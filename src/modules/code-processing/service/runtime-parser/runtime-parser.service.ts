import { Injectable } from '@nestjs/common';
import { Parser, Language } from 'web-tree-sitter';

type TSParser = Parser;
type TSLanguage = Language;

@Injectable()
export class ParserRuntimeService {
  private initialized = false;
  private readonly languageCache = new Map<string, TSLanguage>();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Parser.init();

    this.initialized = true;
  }

  async getLanguage(language: string): Promise<TSLanguage> {
    const cached = this.languageCache.get(language);
    if (cached) return cached;

    const wasmPath = this.resolveGrammarPath(language);

    const loadedLanguage = await Language.load(wasmPath);

    this.languageCache.set(language, loadedLanguage);
    return loadedLanguage;
  }

  createParser(): TSParser {
    return new Parser();
  }

  private resolveGrammarPath(language: string): string {
    return require.resolve(
      `tree-sitter-wasms/out/tree-sitter-${language}.wasm`,
    );
  }
}
