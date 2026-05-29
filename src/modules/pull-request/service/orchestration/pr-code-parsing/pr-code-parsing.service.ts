import { Injectable, NotFoundException } from '@nestjs/common';
import { PrContextBuilderService } from '../../context-builder/context-builder.service';
import { PullRequest } from '../../../entity/pull-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FileContextDto,
  PullRequestReviewContextDto,
} from '../../../dto/review/pr-review-context.dto';

@Injectable()
export class PrCodeParsingService {
  constructor(
    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: Repository<PullRequest>,
    private readonly contextBuilderService: PrContextBuilderService,
  ) {}

  async generateContextFromPullRequest(
    pullRequestId: string,
  ): Promise<PullRequestReviewContextDto> {
    const pullRequest = await this.pullRequestRepository.findOne({
      where: { id: pullRequestId },
      relations: {
        files: true,
      },
    });

    if (!pullRequest) {
      throw new NotFoundException(`PR not found: ${pullRequestId}`);
    }

    const filesContext: FileContextDto[] = pullRequest.files.map((file) => {
      const reviewContext =
        this.contextBuilderService.buildReviewContextForFile(file);

      return {
        fileId: file.id,
        filePath: file.fileName,
        reviewContext,
      };
    });

    return {
      pullRequestId,
      prMetadata: {
        title: pullRequest.title,
        body: pullRequest.body || 'No description provided.',
        baseBranch: pullRequest.baseBranch,
        headBranch: pullRequest.headBranch,
      },
      files: filesContext,
    };
  }
}
