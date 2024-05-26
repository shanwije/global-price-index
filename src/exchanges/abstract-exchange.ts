import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import * as zlib from 'zlib';
import { Exchange } from './exchange.interface';

@Injectable()
export abstract class AbstractExchange implements Exchange {
  protected ws: WebSocket;
  protected readonly logger = new Logger(AbstractExchange.name);
  protected latestOrderBook: any = null;
  protected data: any = null;
  protected wsUrl: string;
  protected wsSubscriptionMessage: any;

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    protected configService: ConfigService,
  ) {}

  abstract connect(): void;
  abstract handleMessage(data: any): void;

  protected setupWebSocket(url: string): void {
    this.logger.log(
      `${this.constructor.name} - Setting up WebSocket connection to ${url}`,
    );
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.logger.log(`${this.constructor.name} - Connected to WebSocket`);
      if (this.wsSubscriptionMessage) {
        this.ws.send(JSON.stringify(this.wsSubscriptionMessage));
      }
    });

    this.ws.on('message', (data) => {
      try {
        if (this.constructor.name === 'HuobiService') {
          this.handleGzipMessage(data);
        } else {
          this.handlePlainMessage(data);
        }
      } catch (error) {
        this.logger.error(
          `${this.constructor.name} - Error parsing message: ${error.message}`,
        );
      }
    });

    this.ws.on('close', () => {
      this.logger.warn(
        `${this.constructor.name} - Disconnected, reconnecting...`,
      );
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(
        `${this.constructor.name} - WebSocket error: ${error.message}`,
      );
    });
  }

  protected handlePlainMessage(data: any): void {
    const parsedData = JSON.parse(data.toString());
    this.latestOrderBook = parsedData;
    this.handleMessage(parsedData);
  }

  protected handleGzipMessage(data: any): void {
    zlib.gunzip(data, (err, decompressed) => {
      if (err) {
        this.logger.error(
          `${this.constructor.name} - Decompression error: ${err.message}`,
        );
        return;
      }

      const parsedData = JSON.parse(decompressed.toString());
      this.latestOrderBook = parsedData;
      this.handleMessage(parsedData);
    });
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      this.logger.warn(`${this.constructor.name} - Invalid order book data`);
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    await this.cacheManager.set(cacheKey, midPrice);
    return midPrice;
  }

  async getMidPrice(): Promise<number> {
    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    const midPrice = await this.cacheManager.get<number>(cacheKey);

    if (midPrice) {
      return midPrice;
    } else if (this.data) {
      return this.calculateAndCacheMidPrice(this.data);
    } else {
      return null;
    }
  }

  getOrderBook(): any {
    return this.latestOrderBook;
  }
}
