import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';

export class RepoConfigErrors {
  static repoNotFound(): AppException {
    return new AppException(
      ExceptionCodes.REPO_NOT_FOUND,
      'Repository not found',
      HttpStatus.NOT_FOUND,
    );
  }

  static providerNotFound(): AppException {
    return new AppException(
      ExceptionCodes.PROVIDER_NOT_FOUND,
      'Provider not found',
      HttpStatus.NOT_FOUND,
    );
  }

  static providerInactive(): AppException {
    return new AppException(
      ExceptionCodes.PROVIDER_INACTIVE,
      'Provider is inactive',
      HttpStatus.BAD_REQUEST,
    );
  }

  static invalidCredentials(): AppException {
    return new AppException(
      ExceptionCodes.INVALID_CREDENTIAL,
      'Provider credentials are invalid',
      HttpStatus.BAD_REQUEST,
    );
  }

  static configNotFound(): AppException {
    return new AppException(
      ExceptionCodes.REPO_CONFIG_NOT_FOUND,
      'Repository LLM config not found',
      HttpStatus.NOT_FOUND,
    );
  }

  static invalidModel(): AppException {
    return new AppException(
      ExceptionCodes.INVALID_MODEL_NAME,
      'Invalid model specified',
      HttpStatus.BAD_REQUEST,
    );
  }
}
