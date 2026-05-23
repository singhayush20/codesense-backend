import { Injectable } from '@nestjs/common';
import { RepositorySymbolDto } from '../../dtos/repository-symbol.dto';

@Injectable()
export class RepositorySymbolIndexService {
  private readonly symbols: RepositorySymbolDto[] = [];

  addSymbols(symbols: RepositorySymbolDto[]): void {
    this.symbols.push(...symbols);
  }

  findByName(symbolName: string): RepositorySymbolDto[] {
    return this.symbols.filter((symbol) => symbol.name === symbolName);
  }

  getAll(): RepositorySymbolDto[] {
    return this.symbols;
  }

  clear(): void {
    this.symbols.length = 0;
  }
}
