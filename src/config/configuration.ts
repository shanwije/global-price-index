import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('log', 'error', 'warn', 'debug', 'verbose')
    .default('log'),
  CACHE_TTL: Joi.number().default(3),
  CACHE_MAX: Joi.number().default(100),
  BINANCE_WS_URL: Joi.string().uri().required(),
  BINANCE_WS_DEPTH: Joi.string().required(),
  BINANCE_WS_CURRENCY_PAIR: Joi.string().required(),
  KRAKEN_WS_URL: Joi.string().uri().required(),
  KRAKEN_WS_DEPTH: Joi.string().required(),
  KRAKEN_WS_CURRENCY_PAIR: Joi.string().required(),
  HUOBI_WS_URL: Joi.string().uri().required(),
  HUOBI_WS_DEPTH: Joi.string().required(),
  HUOBI_WS_CURRENCY_PAIR: Joi.string().required(),
});

const { error, value: envVars } = configValidationSchema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default () => ({
  port: envVars.PORT,
  logLevel: envVars.LOG_LEVEL,
  cache: {
    ttl: envVars.CACHE_TTL,
    max: envVars.CACHE_MAX,
  },
  binance: {
    wsUrl: envVars.BINANCE_WS_URL,
    wsDepth: envVars.BINANCE_WS_DEPTH,
    wsCurrencyPair: envVars.BINANCE_WS_CURRENCY_PAIR,
  },
  kraken: {
    wsUrl: envVars.KRAKEN_WS_URL,
    wsDepth: envVars.KRAKEN_WS_DEPTH,
    wsCurrencyPair: envVars.KRAKEN_WS_CURRENCY_PAIR,
  },
  huobi: {
    wsUrl: envVars.HUOBI_WS_URL,
    wsDepth: envVars.HUOBI_WS_DEPTH,
    wsCurrencyPair: envVars.HUOBI_WS_CURRENCY_PAIR,
  },
});
