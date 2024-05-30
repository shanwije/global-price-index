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
    const wsDepth = parseInt(
      this.configService.get<string>('KRAKEN_WS_DEPTH'),
      10,
    );
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
    this.logger.debug(
      `KrakenService initialized with wsUrl: ${this.wsUrl} and wsSubscriptionMessage: ${JSON.stringify(this.wsSubscriptionMessage)}`,
    );
  }

  connect(): void {
    this.logger.log(`Connecting to Kraken WebSocket at ${this.wsUrl}`);
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
    this.logger.debug('Calculating mid price for data');

    let bids, asks;

    if (data[1].bs && data[1].as) {
      // Format 1
      bids = data[1].bs;
      asks = data[1].as;
    } else if (data[1].a && data[1].c) {
      // Format 2
      bids = []; // No bids in this format
      asks = data[1].a;
    } else {
      const errorMsg = 'Data bids or asks are empty or in an unexpected format';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    
    if (!asks || asks.length === 0) {
      const errorMsg = 'Invalid ask data';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const lowestAsk = parseFloat(asks[0][0]);
    let highestBid = null;

    if (bids.length > 0) {
      highestBid = parseFloat(bids[0][0]);
    }

    this.logger.debug(`Highest bid: ${highestBid}, Lowest ask: ${lowestAsk}`);

    if (isNaN(lowestAsk) || (highestBid !== null && isNaN(highestBid))) {
      const errorMsg = `Invalid bid/ask price: ${highestBid}, ${lowestAsk}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const midPrice =
      highestBid !== null ? (highestBid + lowestAsk) / 2 : lowestAsk;
    this.logger.debug(`Calculated mid price: ${midPrice}`);
    return midPrice;
  }
}
