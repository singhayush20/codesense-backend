import path from 'node:path';
import { FileProcessingStrategy } from '../enums/file-processing-strategy.enum';

export class FileProcessingUtil {
  /**
   * Files that benefit from:
   * - AST parsing
   * - structural extraction
   * - symbol retrieval
   * - dependency traversal
   */
  private static readonly AST_EXTENSIONS = new Set([
    '.ts',
    '.tsx',

    '.js',
    '.jsx',

    '.java',

    '.py',

    '.dart',

    '.go',

    '.rs',

    '.php',

    '.rb',

    '.swift',

    '.kt',
    '.kts',

    '.c',
    '.h',

    '.cpp',
    '.hpp',
    '.cc',
    '.cxx',

    '.cs',

    '.scala',

    '.lua',

    '.html',

    '.css',

    '.scss',
  ]);

  /**
   * Files that are valuable for review,
   * but do not require AST parsing.
   */
  private static readonly RAW_TEXT_EXTENSIONS = new Set([
    '.json',

    '.yaml',
    '.yml',

    '.toml',

    '.ini',

    '.env',

    '.properties',

    '.gradle',

    '.md',

    '.txt',

    '.xml',
  ]);

  /**
   * Files identified by exact filename
   * instead of extension.
   */
  private static readonly RAW_TEXT_FILENAMES = new Set([
    '.gitignore',

    '.dockerignore',

    '.npmrc',

    '.prettierrc',

    '.eslintrc',

    'dockerfile',

    'makefile',
  ]);

  /**
   * Files that should never be parsed/reviewed.
   */
  private static readonly SKIP_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',

    '.ico',

    '.mp4',
    '.mov',

    '.mp3',

    '.zip',
    '.tar',
    '.gz',

    '.exe',
    '.dll',

    '.class',
    '.jar',

    '.min.js',
    '.min.css',

    '.lock',
  ]);

  static determineProcessingStrategy(filePath: string): FileProcessingStrategy {
    const normalizedPath = filePath.toLowerCase();

    const fileName = path.basename(normalizedPath);

    /**
     * Exact filename checks
     */
    if (this.RAW_TEXT_FILENAMES.has(fileName)) {
      return FileProcessingStrategy.RAW_TEXT;
    }

    /**
     * Skip noisy/generated/binary assets
     */
    for (const extension of this.SKIP_EXTENSIONS) {
      if (normalizedPath.endsWith(extension)) {
        return FileProcessingStrategy.SKIP;
      }
    }

    /**
     * AST-capable source files
     */
    for (const extension of this.AST_EXTENSIONS) {
      if (normalizedPath.endsWith(extension)) {
        return FileProcessingStrategy.AST;
      }
    }

    /**
     * Raw text config/document files
     */
    for (const extension of this.RAW_TEXT_EXTENSIONS) {
      if (normalizedPath.endsWith(extension)) {
        return FileProcessingStrategy.RAW_TEXT;
      }
    }

    /**
     * Default safe fallback
     */
    return FileProcessingStrategy.SKIP;
  }
}
