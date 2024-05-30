import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import { Exchange } from './exchange.interface';

@Injectable()
export abstract class AbstractExchange implements Exchange {
  protected ws: WebSocket;
  protected wsUrl: string;
  protected wsSubscriptionMessage: any;

  protected readonly logger = new Logger(AbstractExchange.name);

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    protected configService: ConfigService,
  ) {
    this.logger.log(`${this.constructor.name} - Instantiated`);
  }

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  abstract connect(): void;
  abstract parseData(data: WebSocket.Data): any;
  abstract calculateMidPrice(data: any): number;

  async getMidPrice(): Promise<number | null> {
    const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
    this.logger.debug(
      `${this.constructor.name} - Checking cache for key: ${cacheKey}`,
    );

    const cachedValue = await this.cacheManager.get<number>(cacheKey);
    if (cachedValue) {
      this.logger.debug(
        `${this.constructor.name} - Returning cached mid price: ${cachedValue}`,
      );
      return cachedValue;
    }

    return new Promise((resolve) => {
      const checkCacheInterval = setInterval(async () => {
        const newCachedValue = await this.cacheManager.get<number>(cacheKey);
        if (newCachedValue) {
          this.logger.debug(
            `${this.constructor.name} - Returning newly cached mid price: ${newCachedValue}`,
          );
          clearInterval(checkCacheInterval);
          resolve(newCachedValue);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkCacheInterval);
        this.logger.debug(
          `${this.constructor.name} - Returning null after waiting for 1 second`,
        );
        resolve(null);
      }, 1000); // wait for 1 second
    });
  }

  async handleAPIResponse(data: WebSocket.Data) {
    try {
      const parsedData = this.parseData(data);
      const midPrice = this.calculateMidPrice(parsedData);
      this.logger.debug(`${this.constructor.name} - Mid Price: ${midPrice}`);

      const cacheKey = `${this.constructor.name.toLowerCase()}MidPrice`;
      this.logger.debug(
        `${this.constructor.name} - Setting cache for key: ${cacheKey} with value: ${midPrice}`,
      );
      await this.cacheManager.set(cacheKey, midPrice); // Add TTL if needed
      this.printCacheContents();
    } catch (error) {
      this.logger.error(
        `${this.constructor.name} - Error parsing data: ${error}`,
      );
    }
  }

  // just for testing
  async printCacheContents(): Promise<void> {
    const keys = await this.cacheManager.store.keys();
    this.logger.debug(`${this.constructor.name} - Cache keys: ${keys}`);

    for (const key of keys) {
      const value = await this.cacheManager.get(key);
      this.logger.log(
        `${this.constructor.name} - Cache entry: ${key} = ${value}`,
      );
    }
  }

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
      this.logger.debug(`${this.constructor.name} - Data received`);
      this.handleAPIResponse(data);
    });

    this.ws.on('close', (code, reason) => {
      this.logger.warn(
        `${this.constructor.name} - Disconnected, reconnecting... Code: ${code}, Reason: ${reason}`,
      );
      setTimeout(() => this.connect(), 2000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(
        `${this.constructor.name} - WebSocket error: ${error.message}`,
      );
      this.ws.close();
    });
  }
}
