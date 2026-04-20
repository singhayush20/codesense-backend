export class AuthTokenResponseDto {
  constructor(
    public accessToken: string,
    public refreshToken: string,
    public tokenType: string,
    public accessTokenExpiresAt: Date,
    public refreshTokenExpiresAt: Date,
  ) {}
}
