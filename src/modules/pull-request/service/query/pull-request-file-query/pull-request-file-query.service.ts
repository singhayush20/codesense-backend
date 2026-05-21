import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { PullRequestFileSnapshot } from '../../../entity/pull-request-file-snapshot.entity';
import { PullRequestFile } from '../../../entity/pull-request-file.entity';
import { PullRequestQueryMapper } from '../../../mapper/pull-request-query.mapper';
import { PullRequestFileContentDto } from '../../../dto/query/pull-request-file-content.dto';
import { PullRequestFileListDto } from '../../../dto/query/pull-request-file-list.dto';

@Injectable()
export class PullRequestFileQueryService {
  constructor(
    @InjectRepository(PullRequestFile)
    private readonly fileRepository: Repository<PullRequestFile>,
    @InjectRepository(PullRequestFileSnapshot)
    private readonly snapshotRepository: Repository<PullRequestFileSnapshot>,
  ) {}

  async findFilesByPullRequestId(
    pullRequestId: string,
  ): Promise<PullRequestFileListDto> {
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

    return { files: fileDtos };
  }

  async findFileContent(fileId: string): Promise<PullRequestFileContentDto> {
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
      return {};
    }

    return {
      fileId,

      content: snapshot.content,

      sha: snapshot.sha,
    };
  }
}
