export default () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    app: {
      port: parseInt(process.env.PORT ?? '3000', 10),
      env: process.env.ENVIRONMENT,
      isProduction,
    },
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      name: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    },
    cache: {
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    },
    security: {
      jwtSecretKey: process.env.JWT_SECRET_KEY,
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl: process.env.GOOGLE_REDIRECT_URL,
        tokenUrl: process.env.GOOGLE_TOKEN_URL,
        userInfoUrl: process.env.GOOGLE_USER_INFO_URL,
        tokenInfoUrl: process.env.GOOGLE_TOKEN_INFO_URL,
        authUrl: process.env.GOOGLE_AUTH_URL,
      },
    },
    cookies: {
      domain: isProduction ? '.yourdomain.com' : 'localhost',
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: {
        accessToken: 60 * 60 * 1000, // 1 hour
        refreshToken: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    },
    tokens: {
      accessTokenExpiresInSeconds: 3600, // 1 hour
      refreshTokenExpiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    github: {
      appName: process.env.GITHUB_APP_NAME,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
      webhookSecret: process.env.GUTHUB_APP_WEBHOOK_SECRET,
      appId: process.env.GITHUB_APP_ID,
    },
  };
};
