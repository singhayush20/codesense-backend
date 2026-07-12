import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { PullRequestFileSnapshot } from '../../../entity/pull-request-file-snapshot.entity';
import { PullRequestFile } from '../../../entity/pull-request-file.entity';
import { PullRequestQueryMapper } from '../../../mapper/pull-request-query.mapper';
import { PullRequestFileContentDto } from '../../../dto/query/pull-request-file-content.dto';
import { PullRequestFileListDto } from '../../../dto/query/pull-request-file-list.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PullRequestFileQueryService {
  constructor(
    @InjectRepository(PullRequestFile)
    private readonly fileRepository: Repository<PullRequestFile>,
    @InjectRepository(PullRequestFileSnapshot)
    private readonly snapshotRepository: Repository<PullRequestFileSnapshot>,
    @InjectPinoLogger(PullRequestFileQueryService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findFilesByPullRequestId(
    pullRequestId: string,
  ): Promise<PullRequestFileListDto> {
    this.logger.debug({ pullRequestId }, 'Finding files by pull request ID');

    const files = await this.fileRepository.find({
      where: {
        pullRequest: {
          id: pullRequestId,
        },
      },

      order: {
        additions: 'DESC',
      },
    });

    const fileDtos = files.map((file) =>
      PullRequestQueryMapper.toFileDto(file),
    );

    this.logger.debug(
      { pullRequestId, fileCount: files.length },
      'Files found for pull request',
    );

    return { files: fileDtos };
  }

  async findFileContent(fileId: string): Promise<PullRequestFileContentDto> {
    this.logger.debug({ fileId }, 'Finding file content snapshot');

    const snapshot = await this.snapshotRepository.findOne({
      where: {
        pullRequestFile: {
          id: fileId,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });

    if (!snapshot) {
      this.logger.warn({ fileId }, 'No snapshot found for file content');
      return {};
    }

    return {
      fileId,

      content: snapshot.content,

      sha: snapshot.sha,
    };
  }
}
