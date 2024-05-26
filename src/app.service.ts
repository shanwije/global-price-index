import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly huobiService: HuobiService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.binanceService.connect();
    this.krakenService.connect();
    this.huobiService.connect();
  }

  async getExchangeMidPrices(): Promise<number[]> {
    const binanceMidPrice = await this.binanceService.getMidPrice();
    const krakenMidPrice = await this.krakenService.getMidPrice();
    const huobiMidPrice = await this.huobiService.getMidPrice();

    return [binanceMidPrice, krakenMidPrice, huobiMidPrice].filter(
      (price) => price !== null,
    );
  }

  async calculateAndCacheAverageMidPrice(): Promise<number> {
    const prices = await this.getExchangeMidPrices();
    if (prices.length === 0) return null;

    const averageMidPrice =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;
    await this.cacheManager.set('averageMidPrice', averageMidPrice);
    return averageMidPrice;
  }

  async getAverageMidPrice(): Promise<number> {
    try {
      const cachedAverageMidPrice =
        await this.cacheManager.get<number>('averageMidPrice');
      if (
        cachedAverageMidPrice !== undefined &&
        cachedAverageMidPrice !== null
      ) {
        return cachedAverageMidPrice;
      } else {
        return this.calculateAndCacheAverageMidPrice();
      }
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return this.calculateAndCacheAverageMidPrice();
    }
  }

  getBinanceOrderBook(): any {
    return this.binanceService.getOrderBook();
  }

  getKrakenOrderBook(): any {
    return this.krakenService.getOrderBook();
  }

  getHuobiOrderBook(): any {
    return this.huobiService.getOrderBook();
  }
}
