import * as dotenv from 'dotenv';

dotenv.config();

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  logLevel: process.env.LOG_LEVEL || 'debug',
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 1,
    max: parseInt(process.env.CACHE_MAX, 10) || 100,
  },
  binance: {
    wsUrl: process.env.BINANCE_WS_URL,
    wsDepth: process.env.BINANCE_WS_DEPTH,
    wsCurrencyPair: process.env.BINANCE_WS_CURRENCY_PAIR,
  },
  kraken: {
    wsUrl: process.env.KRAKEN_WS_URL,
    wsDepth: parseInt(process.env.KRAKEN_WS_DEPTH, 10) || 10,
    wsCurrencyPair: process.env.KRAKEN_WS_CURRENCY_PAIR,
  },
  huobi: {
    wsUrl: process.env.HUOBI_WS_URL,
    wsDepth: process.env.HUOBI_WS_DEPTH,
    wsCurrencyPair: process.env.HUOBI_WS_CURRENCY_PAIR,
  },
});
