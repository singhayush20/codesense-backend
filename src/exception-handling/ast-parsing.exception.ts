import { InternalServerErrorException } from '@nestjs/common';

export class AstParsingException extends InternalServerErrorException {
  constructor(filePath: string) {
    super(`Failed to parse AST for file: ${filePath}`);
  }
}
