import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

@Injectable()
export class BinanceService extends AbstractExchange {
  readonly logger = new Logger(BinanceService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    const wsBaseUrl = this.configService.get<string>('BINANCE_WS_URL');
    const wsDepth = this.configService.get<string>('BINANCE_WS_DEPTH');
    const wsCurrencyPair = this.configService.get<string>(
      'BINANCE_WS_CURRENCY_PAIR',
    );
    this.wsUrl = `${wsBaseUrl}/${wsCurrencyPair}@${wsDepth}`;
    this.logger.debug(`BinanceService initialized with wsUrl: ${this.wsUrl}`);
  }

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  parseData(data: WebSocket.Data) {
    this.logger.debug(`Received data`);
    try {
      const parsed = JSON.parse(data.toString());
      this.logger.debug(`Parsed data successfully`);
      return parsed;
    } catch (error) {
      this.logger.error(`Error parsing data: ${error.message}`, error.stack);
      throw new Error(`Error parsing data: ${error.message}`);
    }
  }

  calculateMidPrice(data: any): number {
    this.logger.debug(`Calculating mid price for data`);
    if (!data.bids || !data.asks) {
      const errorMsg = `Data bids or asks are empty`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const highestBid = parseFloat(data.bids[0][0]);
    const lowestAsk = parseFloat(data.asks[0][0]);

    this.logger.debug(`Highest bid: ${highestBid}, Lowest ask: ${lowestAsk}`);

    if (isNaN(highestBid) || isNaN(lowestAsk)) {
      const errorMsg = `Invalid bid/ask price: ${highestBid}, ${lowestAsk}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const midPrice = (highestBid + lowestAsk) / 2;
    this.logger.debug(`Calculated mid price: ${midPrice}`);
    return midPrice;
  }
}
