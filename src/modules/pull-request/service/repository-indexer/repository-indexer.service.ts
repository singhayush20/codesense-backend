import { Injectable } from '@nestjs/common';
import { AstParserService } from '../../../code-processing/service/ast-parser/ast-parser.service';
import { SymbolExtractorUtil } from '../../../code-processing/utils/symbol-extractor.util';
import { RepositorySymbolIndexService } from '../../../code-processing/service/repository-index/repository-index.service';

@Injectable()
export class RepositoryIndexingService {
  constructor(
    private readonly astParserService: AstParserService,

    private readonly repositorySymbolIndexService: RepositorySymbolIndexService,
  ) {}

  async indexFile(filePath: string, source: string): Promise<void> {
    const parsed = await this.astParserService.parseFile(filePath, source);

    const symbols = SymbolExtractorUtil.extractSymbols(
      filePath,
      parsed.language,
      parsed.rootNode,
    );

    this.repositorySymbolIndexService.addSymbols(symbols);
  }
}
