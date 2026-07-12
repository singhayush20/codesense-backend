import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  DashboardStatsResponseDto,
  PrStateCount,
  ReviewStatusCount,
} from '../dto/dashboard-stats-response.dto';
import { CacheService } from '../../../cache/cache.service';
import { GithubRepository } from '../../github-integration/entity/github-repo.entity';
import { UserRepositorySelection } from '../../github-integration/entity/user-repo-selection.entity';
import { PullRequestReviewJobResult } from '../../pull-request/entity/pull-request-review-job-result.entity';
import { PullRequestReviewJob } from '../../pull-request/entity/pull-request-review-job.entity';
import { PullRequestReviewStep } from '../../pull-request/entity/pull-request-review-step.entity';
import { PullRequestReviewStatus } from '../../pull-request/enums/pull-request-review-status.enum';
import { PullRequest } from '../../pull-request/entity/pull-request.entity';
import { LLMProvider } from '../../llm/entity/llm-provider.entity';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

const DASHBOARD_CACHE_TTL = 300;

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(GithubRepository)
    private readonly repoRepo: Repository<GithubRepository>,
    @InjectRepository(UserRepositorySelection)
    private readonly selectionRepo: Repository<UserRepositorySelection>,
    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,
    @InjectRepository(PullRequestReviewJob)
    private readonly reviewJobRepo: Repository<PullRequestReviewJob>,
    @InjectRepository(PullRequestReviewJobResult)
    private readonly reviewJobResultRepo: Repository<PullRequestReviewJobResult>,
    @InjectRepository(LLMProvider)
    private readonly llmProviderRepo: Repository<LLMProvider>,
    @InjectRepository(PullRequestReviewStep)
    private readonly reviewStepRepo: Repository<PullRequestReviewStep>,
    private readonly cacheService: CacheService,
    @InjectPinoLogger(DashboardStatsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async getStats(userId: string): Promise<DashboardStatsResponseDto> {
    this.logger.debug({ userId }, 'Fetching dashboard stats');

    const cacheKey = `dashboard:stats:${userId}`;

    const cached =
      await this.cacheService.get<DashboardStatsResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug({ userId }, 'Dashboard stats cache hit');
      return cached;
    }

    this.logger.debug({ userId }, 'Dashboard stats cache miss, computing');

    const repoIdRows = await this.selectionRepo.find({
      where: { user: { userId } },
      select: { repository: { id: true } },
      relations: ['repository'],
    });

    const repoIds = repoIdRows.map((s) => s.repository.id);

    if (repoIds.length === 0) {
      this.logger.debug(
        { userId },
        'No repositories selected, returning empty stats',
      );
      const empty = this.buildEmptyStats();
      await this.cacheService.set(cacheKey, empty, DASHBOARD_CACHE_TTL);
      return empty;
    }

    const [
      totalRepos,
      totalPRs,
      prStateRows,
      totalReviews,
      reviewStatusRows,
      tokensResult,
      totalLlmConfigs,
      providerRows,
      avgFilesResult,
      avgTimeResult,
    ] = await Promise.all([
      this.repoRepo.count({ where: { id: In(repoIds) } }),
      this.prRepo
        .createQueryBuilder('pr')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .getCount(),
      this.prRepo
        .createQueryBuilder('pr')
        .select('pr.state', 'state')
        .addSelect('COUNT(*)', 'count')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .groupBy('pr.state')
        .getRawMany<PrStateCount>(),
      this.reviewJobRepo
        .createQueryBuilder('job')
        .innerJoin('job.pullRequest', 'pr')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .getCount(),
      this.reviewJobRepo
        .createQueryBuilder('job')
        .select('job.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .innerJoin('job.pullRequest', 'pr')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .groupBy('job.status')
        .getRawMany<ReviewStatusCount>(),

      this.reviewJobResultRepo
        .createQueryBuilder('result')
        .select('SUM(result.totalTokens)', 'total')
        .addSelect('AVG(result.totalTokens)', 'average')
        .addSelect('SUM(result.totalInputTokens)', 'totalInput')
        .addSelect('AVG(result.totalInputTokens)', 'avgInput')
        .addSelect('SUM(result.totalOutputTokens)', 'totalOutput')
        .addSelect('AVG(result.totalOutputTokens)', 'avgOutput')
        .innerJoin('result.job', 'job')
        .innerJoin('job.pullRequest', 'pr')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .getRawOne<{
          total: string | null;
          average: string | null;
          totalInput: string | null;
          avgInput: string | null;
          totalOutput: string | null;
          avgOutput: string | null;
        }>(),
      this.llmProviderRepo.count({
        where: { user: { userId }, isActive: true },
      }),
      this.reviewJobRepo
        .createQueryBuilder('job')
        .select('job.providerType', 'provider')
        .addSelect('COUNT(*)', 'count')
        .innerJoin('job.pullRequest', 'pr')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .groupBy('job.providerType')
        .getRawMany<{ provider: string; count: string }>(),
      this.prRepo
        .createQueryBuilder('pr')
        .select('AVG(pr.changedFiles)', 'average')
        .innerJoin('pr.repository', 'repo')
        .where('repo.id IN (:...repoIds)', { repoIds })
        .getRawOne<{ average: string | null }>(),
      this.reviewStepRepo.query<{ average: string }[]>(
        `SELECT COALESCE(AVG(sub.total_duration), 0) as average FROM (
          SELECT SUM(s.duration_ms) as total_duration
          FROM pull_request_review_steps s
          INNER JOIN pull_request_review_jobs j ON j.id = s.job_id
          INNER JOIN pull_requests pr ON pr.id = j.pull_request_id
          INNER JOIN github_repositories repo ON repo.id = pr.repo_id
          WHERE repo.id = ANY($1)
          AND j.status = $2
          AND s.duration_ms IS NOT NULL
          GROUP BY j.id
        ) sub`,
        [repoIds, PullRequestReviewStatus.SUCCESS],
      ),
    ]);

    const stats: DashboardStatsResponseDto = {
      totalRepositories: totalRepos,
      totalPullRequests: totalPRs,
      pullRequestsByState: prStateRows.map((r) => ({
        state: r.state,
        count: Number(r.count),
      })),
      totalReviewsGenerated: totalReviews,
      reviewsByStatus: reviewStatusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      totalTokensConsumed: Number(tokensResult?.total ?? 0),
      totalInputTokens: Number(tokensResult?.totalInput ?? 0),
      totalOutputTokens: Number(tokensResult?.totalOutput ?? 0),
      totalSelectedRepos: repoIdRows.length,
      totalLlmConfigs: totalLlmConfigs,
      averageTokensPerReview: Number(tokensResult?.average ?? 0),
      averageInputTokensPerReview: Number(tokensResult?.avgInput ?? 0),
      averageOutputTokensPerReview: Number(tokensResult?.avgOutput ?? 0),
      reviewsByProvider: providerRows.map((r) => ({
        provider: r.provider,
        count: Number(r.count),
      })),
      averageFilesPerPr: Number(avgFilesResult?.average ?? 0),
      averageReviewTimeMs: Number(avgTimeResult?.[0]?.average ?? 0),
    };

    await this.cacheService.set(cacheKey, stats, DASHBOARD_CACHE_TTL);

    this.logger.debug(
      { userId, totalRepos, totalPRs },
      'Dashboard stats computed and cached',
    );

    return stats;
  }

  private buildEmptyStats(): DashboardStatsResponseDto {
    return {
      totalRepositories: 0,
      totalPullRequests: 0,
      pullRequestsByState: [],
      totalReviewsGenerated: 0,
      reviewsByStatus: [],
      totalTokensConsumed: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalSelectedRepos: 0,
      totalLlmConfigs: 0,
      averageTokensPerReview: 0,
      averageInputTokensPerReview: 0,
      averageOutputTokensPerReview: 0,
      reviewsByProvider: [],
      averageFilesPerPr: 0,
      averageReviewTimeMs: 0,
    };
  }
}
