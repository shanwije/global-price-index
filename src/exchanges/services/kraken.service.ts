import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KrakenService extends AbstractExchange {
  readonly logger = new Logger(KrakenService.name);

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

      const bids = orderBookData.bs || orderBookData.b || [];
      const asks = orderBookData.as || orderBookData.a || [];

      if (bids.length > 0 && asks.length > 0) {
        const bestBid = parseFloat(bids[0][0]);
        const bestAsk = parseFloat(asks[0][0]);

        if (!isNaN(bestBid) && !isNaN(bestAsk)) {
          const midPrice = (bestBid + bestAsk) / 2;
          this.logger.log(`Calculated mid price: ${midPrice}`);
          this.cacheManager.set(
            `${this.constructor.name.toLowerCase()}MidPrice`,
            midPrice,
          );
        } else {
          this.logger.warn(
            `${this.constructor.name} - Invalid bid/ask values received`,
          );
        }
      }
    } else {
      this.logger.warn(`Received non-array data: ${JSON.stringify(data)}`);
    }
  }

  async getMidPrice(): Promise<number> {
    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    const midPrice = await this.cacheManager.get<number>(cacheKey);
    this.logger.log(
      `${this.constructor.name} - Retrieved mid price from cache: ${midPrice}`,
    );

    if (midPrice !== undefined && midPrice !== null) {
      return midPrice;
    } else {
      this.logger.error(
        `${this.constructor.name} - No mid price available in cache`,
      );
      return null;
    }
  }
}
