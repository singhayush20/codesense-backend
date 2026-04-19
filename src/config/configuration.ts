export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    env: process.env.ENVIRONMENT,
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
      port: parseInt(process.env.REDIS_PORT ?? '6379',10)
    }
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
});
