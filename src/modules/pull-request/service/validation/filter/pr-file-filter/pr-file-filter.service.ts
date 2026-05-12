import { Injectable } from '@nestjs/common';

@Injectable()
export class PrFileFilterService {
  private readonly ignoredPatterns = [
    '.snap',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
  ];

  shouldIgnore(fileName: string): boolean {
    return this.ignoredPatterns.some((pattern) => fileName.includes(pattern));
  }
}
