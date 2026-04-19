export const CacheKeys = {
  user: (id: number) => `auth:user:${id}`,
  prAnalysis: (prId: number) => `pr:analysis:${prId}`,
  workflow: (id: number) => `workflow:execution:${id}`,
};
