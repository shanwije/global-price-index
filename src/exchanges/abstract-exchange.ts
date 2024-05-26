import { Exchange } from './exchange.interface';
import * as WebSocket from 'ws';
import { Logger, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export abstract class AbstractExchange implements Exchange {
  protected ws: WebSocket;
  protected readonly logger = new Logger(AbstractExchange.name);
  protected latestOrderBook: any = null;
  protected data: any = null;

  constructor(@Inject(CACHE_MANAGER) protected cacheManager: Cache) {}

  abstract connect(): void;

  getOrderBook(): any {
    return this.latestOrderBook;
  }

  protected setupWebSocket(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log(`Connected to ${this.constructor.name}`);
    });

    this.ws.on('message', (data) => {
      this.logger.log(`Received message from ${this.constructor.name}`);
      try {
        const parsedData = JSON.parse(data.toString());
        this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
        this.latestOrderBook = parsedData;
        this.handleMessage(parsedData);
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

  protected abstract handleMessage(data: any): void;

  protected async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    await this.cacheManager.set('midPrice', midPrice);
    this.logger.log(`Cached mid price: ${midPrice}`);
    return midPrice;
  }

  async getMidPrice(): Promise<number> {
    const midPrice = await this.cacheManager.get<number>('midPrice');
    this.logger.log(`Retrieved mid price from cache: ${midPrice}`);

    if (midPrice !== undefined && midPrice !== null) {
      return midPrice;
    } else if (this.data) {
      this.logger.log(`cache miss: ${midPrice}`);
      return this.calculateAndCacheMidPrice(this.data);
    } else {
      return null;
    }
  }
}
