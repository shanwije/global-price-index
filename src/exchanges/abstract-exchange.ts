import { Inject, Injectable, Logger, UseGuards } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Exchange } from './exchange.interface';

@Injectable()
@UseGuards(ThrottlerGuard)
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

    const checkCacheInterval = this.configService.get<number>(
      'CHECK_CACHE_INTERVAL',
    );
    const cacheTimeout = this.configService.get<number>('CACHE_TIMEOUT');

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const newCachedValue = await this.cacheManager.get<number>(cacheKey);
        if (newCachedValue) {
          this.logger.debug(
            `${this.constructor.name} - Returning newly cached mid price: ${newCachedValue}`,
          );
          clearInterval(interval);
          resolve(newCachedValue);
        }
      }, checkCacheInterval);

      setTimeout(() => {
        clearInterval(interval);
        this.logger.debug(
          `${this.constructor.name} - Returning null after waiting for ${cacheTimeout} ms`,
        );
        resolve(null);
      }, cacheTimeout);
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
      const reconnectDelay = this.configService.get<number>('RECONNECT_DELAY');
      setTimeout(() => this.connect(), reconnectDelay);
    });

    this.ws.on('error', (error) => {
      this.logger.error(
        `${this.constructor.name} - WebSocket error: ${error.message}`,
      );
      this.ws.close();
    });
  }
}
