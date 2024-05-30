import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

@Injectable()
export class KrakenService extends AbstractExchange {
  readonly logger = new Logger(KrakenService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    const wsBaseUrl = this.configService.get<string>('KRAKEN_WS_URL');
    const wsDepth = this.configService.get<string>('KRAKEN_WS_DEPTH');
    const wsCurrencyPair = this.configService.get<string>(
      'KRAKEN_WS_CURRENCY_PAIR',
    );
    this.wsUrl = `${wsBaseUrl}`;
    this.wsSubscriptionMessage = {
      event: 'subscribe',
      pair: [wsCurrencyPair],
      subscription: {
        name: 'book',
        depth: wsDepth,
      },
    };
  }

  connect(): void {
    this.logger.log(`Connecting to Kraken WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  parseData(data: WebSocket.Data) {
    try {
      return JSON.parse(data.toString());
    } catch (error) {
      throw new Error(`Error parsing data: ${error.message}`);
    }
  }

  calculateMidPrice(data: any): number {
    if (!data[1] || (!data[1].b && !data[1].a)) {
      throw new Error(`Data bids or asks are empty`);
    }

    const bids = data[1].b;
    const asks = data[1].a;

    if (!bids || !asks || bids.length === 0 || asks.length === 0) {
      throw new Error(`Invalid bid/ask data`);
    }

    const highestBid = parseFloat(bids[0][0]);
    const lowestAsk = parseFloat(asks[0][0]);

    if (isNaN(highestBid) || isNaN(lowestAsk)) {
      throw new Error(`Invalid bid/ask price: ${highestBid}, ${lowestAsk}`);
    }

    return (highestBid + lowestAsk) / 2;
  }
}
