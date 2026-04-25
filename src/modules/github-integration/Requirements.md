
# Webhook Hardening & Scaling Plan

This document defines the next **critical backend improvements** required for a production-grade GitHub App integration.



# Overview

After implementing webhook ingestion, your system currently:

```

GitHub → Webhook → PR Processing → Comment

```

This works for **basic testing**, but will break under:

- duplicate webhook deliveries
- large repositories
- multiple users
- retry storms from GitHub
- long-running AI processing

---

# Goals

Implement:

1. **Repo Ownership Filter**
2. **Idempotency (Delivery Deduplication)**
3. **Async Processing via Queue (BullMQ)**



# 1. Repo Ownership Filter

## ❓ Why this is required

GitHub sends events for **all repositories in an installation**.

But your system logic is:

```

User selects specific repos → only those should be processed

```

Without filtering:

```

❌ You process unwanted repositories
❌ Waste compute (AI cost later)
❌ Security risk (processing repos user didn’t select)

```

---

## ✅ Desired Behavior

```

Webhook → Check repo → If selected → process
Else → ignore

```

---

## 🧠 Data Source

Use your existing table:

```

user_repo_selection

````

---

## 🛠 Implementation

### Step 1: Add repository lookup

```ts
// selection.service.ts
async isRepoSelected(repoId: string): Promise<boolean> {
  const count = await this.selectionRepo.count({
    where: {
      repository: { repoId },
      isActive: true,
    },
  });

  return count > 0;
}
````

---

### Step 2: Use in PR processing

```ts
const repoId = payload.repository.id.toString();

const isAllowed = await this.selectionService.isRepoSelected(repoId);

if (!isAllowed) {
  this.logger.debug(`Skipping repo ${repoId} (not selected)`);
  return;
}
```

---

## ⚠️ Important

* Always use **repoId (GitHub ID)**, not name
* Names can change, IDs do not

---

# 2. Idempotency (Delivery Deduplication)

## ❓ Why this is required

GitHub **retries webhook deliveries** when:

* your server is slow
* network issues occur
* response is not 2xx

This results in:

```
Same event delivered multiple times
```

---

## 🚨 Without idempotency

```
❌ Duplicate PR processing
❌ Duplicate comments
❌ Increased cost
❌ Inconsistent system state
```

---

## ✅ Solution

Use:

```
x-github-delivery (unique event ID)
```

---

## 🧠 Storage Choice

Use **Redis** (fast + TTL support)

---

## 🛠 Implementation

### Step 1: Redis key design

```
gh:webhook:delivery:{deliveryId}
```

---

### Step 2: Check before processing

```ts
const key = `gh:webhook:${deliveryId}`;

const exists = await this.cacheService.get(key);

if (exists) {
  this.logger.warn(`Duplicate event skipped: ${deliveryId}`);
  return;
}
```

---

### Step 3: Store after validation

```ts
await this.cacheService.set(key, true, 3600); // TTL = 1 hour
```

---

## ⚠️ Important

* Store **after signature verification**
* TTL prevents memory leak
* Never store permanently

---

# 3. Async Processing (BullMQ)

## ❓ Why this is required

Webhook constraints:

```
GitHub expects response < 10 seconds
```

Your future pipeline:

```
Fetch PR files → AI processing → Comment
```

This will take:

```
> 10 seconds ❌
```

---

## 🚨 Without async processing

```
❌ GitHub retries webhook
❌ Duplicate executions
❌ Request timeouts
❌ System instability
```

---

## ✅ Solution

```
Webhook → enqueue job → return immediately
Worker → process job
```

---

# 🧠 Architecture

```
Controller → WebhookService → Queue → Worker → PR Processing
```

---

## 🛠 Implementation

---

### Step 1: Install BullMQ

```bash
npm install @nestjs/bullmq bullmq ioredis
```

---

### Step 2: Configure Queue

```ts
// queue.module.ts
BullModule.forRoot({
  connection: {
    host: 'localhost',
    port: 6379,
  },
});
```

---

### Step 3: Create Queue

```ts
BullModule.registerQueue({
  name: 'pr-processing',
});
```

---

### Step 4: Add job in webhook service

```ts
await this.prQueue.add('process-pr', {
  payload,
});
```

---

### Step 5: Create processor

```ts
@Processor('pr-processing')
export class PrProcessor {
  constructor(private readonly prService: PrProcessingService) {}

  @Process('process-pr')
  async handle(job: Job<{ payload: GithubPullRequestPayload }>) {
    await this.prService.processPullRequest(job.data.payload);
  }
}
```

---

## ✅ Webhook flow becomes

```
Webhook received
→ Verify signature
→ Check idempotency
→ Check repo selection
→ Enqueue job
→ Return 200 immediately
```

---

# 🔥 Final Combined Flow

```
GitHub
  ↓
Webhook Controller
  ↓
Signature Verification
  ↓
Idempotency Check
  ↓
Repo Selection Filter
  ↓
Queue Job (BullMQ)
  ↓
Worker
  ↓
PR Processing Service
  ↓
GitHub Comment
```

---

# ⚠️ Order of Execution (IMPORTANT)

Always follow:

```
1. Verify signature
2. Check idempotency
3. Filter repo
4. Enqueue job
```

---

# 🚀 Benefits

| Feature     | Benefit                   |
| ----------- | ------------------------- |
| Repo Filter | Correctness + security    |
| Idempotency | No duplicate processing   |
| Queue       | Scalability + reliability |

---

# 🔜 Next Steps After This

Once implemented:

```
→ Add AI analysis
→ Add inline PR comments
→ Add batching for large PRs
→ Add retry strategy in queue
```

---

# Final Note

If you skip these steps:

```
System will work in dev ❌
System will fail in production ❌
```

If you implement these:


You have a production-grade webhook pipeline ✅
