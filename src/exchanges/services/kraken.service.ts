import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KrakenService extends AbstractExchange {
  readonly logger = new Logger(KrakenService.name);
  private orderBook: { bids: any[]; asks: any[] } = { bids: [], asks: [] };

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    this.wsUrl = this.configService.get<string>('KRAKEN_WS_URL');
    const depth = parseInt(
      this.configService.get<string>('KRAKEN_WS_DEPTH'),
      10,
    );
    this.wsSubscriptionMessage = {
      event: 'subscribe',
      pair: [this.configService.get<string>('KRAKEN_WS_CURRENCY_PAIR')],
      subscription: {
        name: 'book',
        depth: depth,
      },
    };
    this.logger.log(`WebSocket URL: ${this.wsUrl}`);
  }

  connect(): void {
    this.logger.log(`Connecting to Kraken WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  handleMessage(data: any): void {
    if (data.event === 'subscriptionStatus' && data.status === 'subscribed') {
      this.logger.log('Successfully subscribed to Kraken WebSocket');
      return;
    }

    if (Array.isArray(data)) {
      const orderBookData = data[1];

      if (orderBookData.as || orderBookData.bs) {
        // Initial snapshot
        this.orderBook.asks = orderBookData.as || [];
        this.orderBook.bids = orderBookData.bs || [];
        this.logger.log('Received initial order book snapshot from Kraken');
        this.calculateAndCacheMidPrice(this.orderBook);
      } else {
        // Incremental updates
        const asks = orderBookData.a || [];
        const bids = orderBookData.b || [];
        if (asks.length > 0) {
          this.updateOrderBook(this.orderBook.asks, asks, 'asks');
        }
        if (bids.length > 0) {
          this.updateOrderBook(this.orderBook.bids, bids, 'bids');
        }
        this.calculateAndCacheMidPrice(this.orderBook);
      }
    } else {
      this.logger.warn(`Received non-array data: ${JSON.stringify(data)}`);
    }
  }

  private updateOrderBook(side: any[], updates: any[], type: string): void {
    updates.forEach((update) => {
      const [price, volume] = update;
      const index = side.findIndex((level) => level[0] === price);
      if (volume === '0.00000000') {
        if (index !== -1) {
          side.splice(index, 1);
        }
      } else {
        if (index === -1) {
          side.push(update);
        } else {
          side[index] = update;
        }
      }
    });
    this.logger.debug(`Updated ${type} in order book`);
  }
}
