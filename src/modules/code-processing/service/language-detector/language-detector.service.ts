import { Injectable } from '@nestjs/common';

import path from 'node:path';
import { FILE_EXTENSION_LANGUAGE_MAP } from '../../utils/extension-language-map';

@Injectable()
export class LanguageDetectorService {
  detectLanguage(filePath: string, content?: string): string | null {
    const extension = path.extname(filePath).toLowerCase();

    const extensionLanguage = FILE_EXTENSION_LANGUAGE_MAP.get(extension);

    if (extensionLanguage) {
      return extensionLanguage;
    }

    const fileName = path.basename(filePath);

    // filename-based detection
    if (fileName === 'Dockerfile') {
      return 'dockerfile';
    }

    if (fileName === 'Makefile') {
      return 'make';
    }

    if (fileName == '.gitignore') {
      return 'gitignore';
    }

    // simple shebang detection
    if (content?.startsWith('#!/')) {
      if (content.includes('python')) {
        return 'python';
      }

      if (content.includes('node')) {
        return 'javascript';
      }

      if (content.includes('bash')) {
        return 'bash';
      }
    }

    return null;
  }
}
