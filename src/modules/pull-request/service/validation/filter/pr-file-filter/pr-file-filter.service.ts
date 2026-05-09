import { Injectable } from '@nestjs/common';

@Injectable()
export class PrFileFilterService {
  private readonly ignoredPatterns = [
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
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
