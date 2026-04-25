import * as jwt from 'jsonwebtoken';

export class JwtUtil {
  static generateGithubAppJwt(appId: string, privateKey: string): string {
    return jwt.sign(
        {
            iat: Math.floor(Date.now()/1000) - 60, // current time in seconds - 60s to account for possible clock skew between the server generating and the server validating the token
            exp: Math.floor(Date.now()/1000) + 600,
            iss: appId,
        },
        privateKey,
        {
            algorithm: 'RS256',
        },
    );
  }
}
