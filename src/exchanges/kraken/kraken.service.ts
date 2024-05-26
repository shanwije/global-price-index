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
    this.wsSubscriptionMessage = {
      event: 'subscribe',
      pair: [this.configService.get<string>('KRAKEN_WS_CURRENCY_PAIR')],
      subscription: {
        name: 'book',
        depth: this.configService.get<number>('KRAKEN_WS_DEPTH'),
      },
    };
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
      const [, orderBook] = data;
      this.data = orderBook;
      this.calculateAndCacheMidPrice(orderBook);
    } else {
      // For testing purposes
      this.calculateAndCacheMidPrice(data);
    }
  }
}
