import { Exchange } from './exchange.interface';
import { Logger, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import * as zlib from 'zlib';

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
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log(`Connected to ${this.constructor.name}`);
      if (this.wsSubscriptionMessage) {
        this.ws.send(JSON.stringify(this.wsSubscriptionMessage));
      }
    });

    this.ws.on('message', (data) => {
      this.logger.log(`Received message from ${this.constructor.name}`);
      try {
        if (this.constructor.name === 'HuobiService') {
          this.handleGzipMessage(data);
        } else {
          this.handlePlainMessage(data);
        }
      } catch (error) {
        this.logger.error(`Error parsing message: ${error}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn(
        `Disconnected from ${this.constructor.name}, reconnecting...`,
      );
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error}`);
    });
  }

  protected handlePlainMessage(data: any): void {
    const parsedData = JSON.parse(data.toString());
    this.logger.debug(`${this.constructor.name} Message data received`);
    // this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
    this.latestOrderBook = parsedData;
    this.handleMessage(parsedData);
  }

  protected handleGzipMessage(data: any): void {
    zlib.gunzip(data, (err, decompressed) => {
      if (err) {
        this.logger.error(`Decompression error: ${err}`);
        return;
      }

      const parsedData = JSON.parse(decompressed.toString());
      this.logger.debug(`${this.constructor.name} Message data received`);

      // this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
      this.latestOrderBook = parsedData; // Store the latest order book data
      this.handleMessage(parsedData); // Additional processing
    });
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    // I'm not exactly sure whether this is the exact way to calculate mid price
    const midPrice = (bestBid + bestAsk) / 2;

    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    await this.cacheManager.set(cacheKey, midPrice);
    this.logger.log(
      `${this.constructor.name.toLowerCase()} : Cached mid price: ${midPrice}`,
    );
    return midPrice;
  }

  async getMidPrice(): Promise<number> {
    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    const midPrice = await this.cacheManager.get<number>(cacheKey);
    this.logger.log(`Retrieved mid price from cache: ${midPrice}`);

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
