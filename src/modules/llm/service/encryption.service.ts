import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppException } from "../../../exception-handling/app-exception.exception";
import { ExceptionCodes } from "../../../exception-handling/exception-codes";
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  // AES is the standard, 256 means it requires a 256-bit (32-byte) key, and GCM (Galois/Counter Mode) is the specific mode that provides built-in integrity checking.
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = configService.get<string>('security.apiKeyEncryptionKey');

    if (!key) {
      throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }

    // Converts the string key into a raw byte Buffer. It expects the environment variable to be a hexadecimal string. Because the algorithm is aes-256, this hex string must be exactly 64 characters long to form a 32-byte buffer.
    this.key = Buffer.from(key, 'hex');
  }

  encrypt(data: unknown): string {
    try {
      // IV (Initialization Vector): Generates 12 random bytes. An IV ensures that encrypting the exact same data twice produces completely different ciphertext. In GCM mode, 12 bytes (96 bits) is the standard and most efficient length.
      const iv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'), // Encrypts the JSON string.
        cipher.final(), // Finishes the encryption process and outputs any remaining encrypted blocks.
      ]); // Merges these pieces together into a single Buffer containing the raw encrypted data.

      const tag = cipher.getAuthTag(); // It generates a 16-byte signature based on the encrypted data. Later, decryption will use this tag to verify that nobody altered the ciphertext in transit.

      return Buffer.concat([iv, tag, encrypted]).toString('base64'); // Merges these pieces together into a single Buffer containing the raw encrypted data. The IV is needed for decryption, and the tag is used to verify the integrity of the data during decryption. Finally, it encodes the combined Buffer into a base64 string, which is safe for storage and transmission. [12 bytes of IV] + [16 bytes of Tag] + [The Encrypted Data]
    } catch {
      throw new AppException(
        ExceptionCodes.KEY_ENCRYPTION_FAILED,
        'Encryption failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  decrypt<T>(payload: string): T {
    try {
      const buffer = Buffer.from(payload, 'base64'); // Reverses the final step of the encryption process, converting the base64 string back into a raw byte Buffer

      const iv = buffer.subarray(0, 12); // Bytes 0 to 12: The Initialization Vector.
      const tag = buffer.subarray(12, 28); // Bytes 12 to 28: The 16-byte Auth Tag.
      const encrypted = buffer.subarray(28); // Bytes 28 to the end: The actual encrypted data.

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(tag); // Passes the Auth Tag to the decipher. If the encrypted data was modified even slightly by a malicious actor, the decipher process will fail here.

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(), // performs the actual verification against the Auth Tag. If the tag doesn't match the data, it throws an error immediately.
      ]);

      return JSON.parse(decrypted.toString()); // Converts the decrypted raw bytes back into a UTF-8 string, and parses that JSON string back into the original JavaScript object/type.
    } catch {
      throw new AppException(
        ExceptionCodes.KEY_DECRYPTION_FAILED,
        'Decryption failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
