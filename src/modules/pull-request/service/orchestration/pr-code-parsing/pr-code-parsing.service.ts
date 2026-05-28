import { Injectable, NotFoundException } from '@nestjs/common';
import { PrAstProcessingService } from '../../pr-ast-processing/pr-ast-processing.service';
import { PrDiffMapperService } from '../../pr-diff-mapper/pr-diff-mapper.service';
import { PrContextBuilderService } from '../../context-builder/context-builder.service';
import { PullRequest } from '../../../entity/pull-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequestFile } from '../../../entity/pull-request-file.entity';
import { PullRequestFileSnapshot } from '../../../entity/pull-request-file-snapshot.entity';
import {
  FileContextDto,
  PullRequestReviewContextDto,
} from '../../../dto/review-context/pr-review-context.dto';

@Injectable()
export class PrCodeParsingService {
  constructor(
    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: Repository<PullRequest>,
    private readonly prAstProcessingService: PrAstProcessingService,
    private readonly prDiffMapperService: PrDiffMapperService,
    private readonly contextBuilderService: PrContextBuilderService,
  ) {}

  async generateContextFromPullRequest(
    pullRequestId: string,
  ): Promise<PullRequestReviewContextDto> {
    const pullRequest = await this.pullRequestRepository.findOne({
      where: {
        id: pullRequestId,
      },
      relations: {
        files: {
          snapshots: true,
        },
      },
    });

    if (!pullRequest) {
      throw new NotFoundException(`PR not found: ${pullRequestId}`);
    }

    const prFiles = pullRequest.files;

    const fileContexts: FileContextDto[] =
      await this.generateContextFromPullRequestFiles(prFiles);

    return {
      pullRequestId,
      files: fileContexts,
    };
  }

  async generateContextFromPullRequestFiles(
    prFiles: PullRequestFile[],
  ): Promise<FileContextDto[]> {
    const fileContexts: FileContextDto[] = [];

    for (const file of prFiles) {
      const latestSnapshot = this.getLatestSnapshot(file);

      if (!latestSnapshot) {
        continue;
      }

      const parsedFile = await this.prAstProcessingService.parsePullRequestFile(
        {
          id: file.id,
          filePath: file.fileName,
          content: latestSnapshot.content,
          patch: file.patch,
        },
      );

      const changedBlocks =
        this.prDiffMapperService.extractChangedBlocks(parsedFile);

      const reviewContext =
        this.contextBuilderService.buildReviewContextForFiles(changedBlocks);

      fileContexts.push({
        fileId: file.id,
        filePath: file.fileName,
        reviewContext,
      });
    }

    return fileContexts;
  }

  private getLatestSnapshot(
    file: PullRequestFile,
  ): PullRequestFileSnapshot | null {
    if (!file.snapshots.length) {
      return null;
    }

    return [...file.snapshots].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
  }
}
