import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

@Injectable()
export class KrakenService extends AbstractExchange {
  readonly logger = new Logger(KrakenService.name);
  private ws: WebSocket;
  private wsUrl: string;
  wsSubscriptionMessage: any;

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

  private setupWebSocket(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log('Connected to Kraken WebSocket');
      this.ws.send(JSON.stringify(this.wsSubscriptionMessage));
    });

    this.ws.on('message', (data) => {
      this.logger.log('Received message from Kraken WebSocket');
      try {
        const parsedData = JSON.parse(data.toString());
        // this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
        this.handleMessage(parsedData);
      } catch (error) {
        this.logger.error(`Error parsing message: ${error}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('Disconnected from Kraken WebSocket, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error}`);
    });
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
    }
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    await this.cacheManager.set('krakenMidPrice', midPrice);
    this.logger.log(`Cached mid price: ${midPrice}`);
    return midPrice;
  }
}