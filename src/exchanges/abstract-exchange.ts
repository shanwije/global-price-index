import { Exchange } from './exchange.interface';
import { Logger, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export abstract class AbstractExchange implements Exchange {
  protected readonly logger = new Logger(AbstractExchange.name);
  protected latestOrderBook: any = null;
  protected data: any = null;

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    protected configService: ConfigService,
  ) {}

  abstract connect(): void;
  abstract handleMessage(data: any): void;
  abstract calculateAndCacheMidPrice(orderBook: any): Promise<number>;

  getOrderBook(): any {
    return this.latestOrderBook;
  }

  async getMidPrice(): Promise<number> {
    const midPrice = await this.cacheManager.get<number>(
      `${this.constructor.name.toLowerCase()}MidPrice`,
    );
    this.logger.log(`Retrieved mid price from cache: ${midPrice}`);

    if (midPrice !== undefined && midPrice !== null) {
      return midPrice;
    } else if (this.data) {
      return this.calculateAndCacheMidPrice(this.data);
    } else {
      return null;
    }
  }
}
