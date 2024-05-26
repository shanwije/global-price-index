import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BinanceService extends AbstractExchange {
  private readonly url = 'wss://stream.binance.com:9443/ws/btcusdt@depth5';
  readonly logger = new Logger(BinanceService.name);
  data: any;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.url}`);
    this.setupWebSocket(this.url);
  }

  protected handleMessage(data: any): void {
    this.data = data;
    this.calculateAndCacheMidPrice(data);
  }

  private async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    await this.cacheManager.set('binanceMidPrice', midPrice);
    this.logger.log(`Cached mid price: ${midPrice}`);
    return midPrice;
  }

  getLatestOrderBook(): any {
    return this.latestOrderBook;
  }

  async getMidPrice(): Promise<number> {
    const midPrice = await this.cacheManager.get<number>('binanceMidPrice');
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
