export interface PrStateCount {
  state: string;
  count: number;
}

export interface ReviewStatusCount {
  status: string;
  count: number;
}

export interface ProviderReviewCount {
  provider: string;
  count: number;
}

export interface DashboardStatsResponseDto {
  totalRepositories: number;
  totalPullRequests: number;
  pullRequestsByState: PrStateCount[];
  totalReviewsGenerated: number;
  reviewsByStatus: ReviewStatusCount[];
  totalTokensConsumed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalSelectedRepos: number;
  totalLlmConfigs: number;
  averageTokensPerReview: number;
  averageInputTokensPerReview: number;
  averageOutputTokensPerReview: number;
  reviewsByProvider: ProviderReviewCount[];
  averageFilesPerPr: number;
  averageReviewTimeMs: number;
}
