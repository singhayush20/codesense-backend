import * as jwt from 'jsonwebtoken';

export class JwtUtil {
  static generateGithubAppJwt(appId: string, privateKey: string): string {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iat: now - 60, // allow clock skew
        exp: now + 540, // 9 minutes (safe under GitHub 10 min limit)
        iss: appId,
      },
      privateKey,
      {
        algorithm: 'RS256',
      },
    );
  }
}
