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
  }

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  parseData(data: WebSocket.Data) {
    try {
      return JSON.parse(data.toString());
    } catch (error) {
      this.logger.error(`Error parsing data: ${error.message}`);
      throw new Error(`Error parsing data: ${error.message}`);
    }
  }

  calculateMidPrice(data: any): number {
    if (!data.bids || !data.asks) {
      throw new Error(`Data bids or asks are empty`);
    }

    const highestBid = parseFloat(data.bids[0][0]);
    const lowestAsk = parseFloat(data.asks[0][0]);

    if (isNaN(highestBid) || isNaN(lowestAsk)) {
      throw new Error(`Invalid bid/ask price: ${highestBid}, ${lowestAsk}`);
    }

    return (highestBid + lowestAsk) / 2;
  }
}
