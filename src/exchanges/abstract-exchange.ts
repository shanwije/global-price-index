import { Injectable, Logger, Inject } from '@nestjs/common';
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
  private lastMessageTimestamp: number = 0;

  private dataPromiseResolve: ((data: any) => void) | null = null;

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    protected configService: ConfigService,
  ) {
    this.logger.log(`${this.constructor.name} - Instantiated`);
  }

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
        this.logger.log(
          `${this.constructor.name} - Subscription message sent: ${JSON.stringify(this.wsSubscriptionMessage)}`,
        );
      }
    });

    this.ws.on('message', (data) => {
      const now = Date.now();
      if (now - this.lastMessageTimestamp > 100) {
        this.lastMessageTimestamp = now;
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
      } else {
        this.logger.debug(
          `${this.constructor.name} - Skipping message to avoid flooding`,
        );
      }
    });

    this.ws.on('close', (code, reason) => {
      this.logger.warn(
        `${this.constructor.name} - Disconnected, reconnecting... Code: ${code}, Reason: ${reason}`,
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
    this.logger.debug(`${this.constructor.name} - Handling plain message`);
    const parsedData = JSON.parse(data.toString());
    this.logger.debug(
      `${this.constructor.name} - Message data received: ${JSON.stringify(parsedData)}...`,
    );
    this.latestOrderBook = parsedData;
    this.data = parsedData; // Set this.data to the latest order book data

    if (this.dataPromiseResolve) {
      this.dataPromiseResolve(this.data);
      this.dataPromiseResolve = null;
    }

    this.handleMessage(parsedData);
  }

  protected handleGzipMessage(data: any): void {
    this.logger.debug(`${this.constructor.name} - Handling gzip message`);
    zlib.gunzip(data, (err, decompressed) => {
      if (err) {
        this.logger.error(
          `${this.constructor.name} - Decompression error: ${err.message}`,
        );
        return;
      }

      const parsedData = JSON.parse(decompressed.toString());
      this.logger.debug(
        `${this.constructor.name} - Message data received: ${JSON.stringify(parsedData)}...`,
      );
      this.latestOrderBook = parsedData;
      this.data = parsedData; // Set this.data to the latest order book data

      if (this.dataPromiseResolve) {
        this.dataPromiseResolve(this.data);
        this.dataPromiseResolve = null;
      }

      this.handleMessage(parsedData);
    });
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (
      !orderBook ||
      !orderBook.bids ||
      !orderBook.asks ||
      orderBook.bids.length === 0 ||
      orderBook.asks.length === 0
    ) {
      this.logger.warn(`${this.constructor.name} - Invalid order book data`);
      return null;
    }

    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);

    this.logger.debug(
      `${this.constructor.name} - Best Bid: ${bestBid}, Best Ask: ${bestAsk}`,
    );

    if (isNaN(bestBid) || isNaN(bestAsk)) {
      this.logger.warn(`${this.constructor.name} - Invalid bid/ask values`);
      return null;
    }

    const midPrice = (bestBid + bestAsk) / 2;

    this.logger.debug(
      `${this.constructor.name} - Calculated mid price: ${midPrice}`,
    );

    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    await this.cacheManager.set(cacheKey, midPrice);
    this.logger.log(`${this.constructor.name} - Cached mid price: ${midPrice}`);
    return midPrice;
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
      this.logger.log(
        `${this.constructor.name} - Waiting for data to calculate mid price`,
      );
      const data = await this.waitForData();
      return this.calculateAndCacheMidPrice(data);
    }
  }

  private waitForData(): Promise<any> {
    return new Promise((resolve) => {
      this.dataPromiseResolve = resolve;
    });
  }

  getOrderBook(): any {
    this.logger.log(`${this.constructor.name} - Retrieving latest order book`);
    return this.latestOrderBook;
  }
}
