import { Injectable } from '@nestjs/common';
import { GithubSelectionService } from '../../../../github-integration/service/github-selection.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrValidationService {
  constructor(
    private readonly githubSelectionService: GithubSelectionService,
    @InjectPinoLogger(PrValidationService.name)
    private readonly logger: PinoLogger,
  ) {}

  async validatePullRequestRepoSelection(
    installationId: string,
    repositoryId: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Validation pull request repository selection for installation ${installationId} and repository ${repositoryId}`,
    );
    const isRepoSelectedInInstallation =
      await this.githubSelectionService.isRepoSelectedForInstallation(
        repositoryId,
        installationId,
      );

    if (!isRepoSelectedInInstallation) {
      this.logger.debug(
        `Repository ${repositoryId} is not selected for installation ${installationId}`,
      );
      return false;
    }

    return true;
  }
}
