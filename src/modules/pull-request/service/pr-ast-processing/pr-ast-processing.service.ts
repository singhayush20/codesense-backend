import { Injectable } from '@nestjs/common';
import { AstParserService } from '../../../code-processing/service/ast-parser/ast-parser.service';
import { ParsedPrFileDto } from '../../dto/parsing/parsed-pr-file-data.dto';

@Injectable()
export class PrAstProcessingService {
  constructor(private readonly astParserService: AstParserService) {}

  async parsePullRequestFile(file: {
    id: string;
    filePath: string;
    content: string;
    patch?: string;
  }): Promise<ParsedPrFileDto> {
    const parsed = await this.astParserService.parseFile(
      file.filePath,
      file.content,
    );

    return {
      fileId: file.id,
      filePath: file.filePath,
      language: parsed.language,
      source: file.content,
      patch: file.patch,
      tree: parsed.tree,
      rootNode: parsed?.rootNode,
    };
  }
}
