import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import * as zlib from 'zlib';

@Injectable()
export class HuobiService extends AbstractExchange {
  readonly logger = new Logger(HuobiService.name);
  private ws: WebSocket;
  private wsUrl: string;
  wsSubscriptionMessage: any;

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    this.wsUrl = this.configService.get<string>('HUOBI_WS_URL');
    this.wsSubscriptionMessage = {
      sub: `market.${this.configService.get<string>('HUOBI_WS_CURRENCY_PAIR')}.depth.${this.configService.get<string>('HUOBI_WS_DEPTH')}`,
      id: 'id1',
    };
  }

  connect(): void {
    this.logger.log(`Connecting to Huobi WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  private setupWebSocket(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log('Connected to Huobi WebSocket');
      this.ws.send(JSON.stringify(this.wsSubscriptionMessage));
    });

    this.ws.on('message', (data) => {
      this.logger.log('Received message from Huobi WebSocket');
      try {
        // Handle gzip-compressed data
        zlib.gunzip(data, (err, decompressed) => {
          if (err) {
            this.logger.error(`Decompression error: ${err}`);
            return;
          }

          const parsedData = JSON.parse(decompressed.toString());
          //   this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
          this.handleMessage(parsedData);
        });
      } catch (error) {
        this.logger.error(`Error parsing message: ${error}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('Disconnected from Huobi WebSocket, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error}`);
    });
  }

  handleMessage(data: any): void {
    if (data.ping) {
      this.ws.send(JSON.stringify({ pong: data.ping }));
      return;
    }

    if (data.ch && data.tick) {
      this.data = data.tick;
      this.calculateAndCacheMidPrice(data.tick);
    }
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    await this.cacheManager.set('huobiMidPrice', midPrice);
    this.logger.log(`Cached mid price: ${midPrice}`);
    return midPrice;
  }
}
