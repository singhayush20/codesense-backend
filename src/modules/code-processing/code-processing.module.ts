import { Module } from '@nestjs/common';
import { LanguageDetectorService } from './service/language-detector/language-detector.service';
import { AstParserService } from './service/ast-parser/ast-parser.service';
import { RepositorySymbolIndexService } from './service/repository-index/repository-index.service';
import { SymbolDefinitionService } from './service/symbol-definition/symbol-definition.service';
import { ParserRuntimeService } from './service/runtime-parser/runtime-parser.service';

@Module({
  providers: [
    LanguageDetectorService,
    AstParserService,
    ParserRuntimeService,
    RepositorySymbolIndexService,
    SymbolDefinitionService,
  ],
  exports: [AstParserService, RepositorySymbolIndexService],
})
export class CodeProcessingModule {}
