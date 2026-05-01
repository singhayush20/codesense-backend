import Joi from 'joi';

export const configValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string().valid('dev', 'prod').required(),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET_KEY: Joi.string().min(10).required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URL: Joi.string().uri().required(),
  GOOGLE_TOKEN_URL: Joi.string().uri().required(),
  GOOGLE_USER_INFO_URL: Joi.string().uri().required(),
  GOOGLE_TOKEN_INFO_URL: Joi.string().uri().required(),
  GOOGLE_AUTH_URL: Joi.string().uri().required(),
});
