import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { ParsedFileDto } from '../../dtos/parsed-file.dto';
import { LanguageDetectorService } from '../language-detector/language-detector.service';
import { ParserRuntimeService } from '../runtime-parser/runtime-parser.service';
import { Tree } from 'web-tree-sitter';
import { AstParsingException } from '../../../../exception-handling/ast-parsing.exception';

@Injectable()
export class AstParserService {
  constructor(
    private readonly languageDetectorService: LanguageDetectorService,
    private readonly parserRuntimeService: ParserRuntimeService,
  ) {}

  async parseFile(filePath: string, source: string): Promise<ParsedFileDto> {
    await this.parserRuntimeService.initialize();

    const language = this.languageDetectorService.detectLanguage(
      filePath,
      source,
    );

    if (!language) {
      throw new UnsupportedMediaTypeException(
        `Unable to detect language for file: ${filePath}`,
      );
    }

    const parser = this.parserRuntimeService.createParser();

    const parserLanguage =
      await this.parserRuntimeService.getLanguage(language);

    parser.setLanguage(parserLanguage);

    const tree: Tree | null = parser.parse(source);

    if (!tree) {
      throw new AstParsingException(filePath);
    }

    return {
      filePath,
      language,
      source,
      tree,
      rootNode: tree?.rootNode,
      hasErrors: tree?.rootNode.hasError,
    };
  }
}
