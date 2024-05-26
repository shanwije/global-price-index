import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly huobiService: HuobiService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing module and connecting to exchanges...');
    this.binanceService.connect();
    this.krakenService.connect();
    this.huobiService.connect();
    this.logger.log('Successfully connected to all exchanges.');
  }

  async getExchangeMidPrices(): Promise<number[]> {
    this.logger.log('Fetching mid prices from exchanges...');
    const binanceMidPrice = await this.binanceService.getMidPrice();
    const krakenMidPrice = await this.krakenService.getMidPrice();
    const huobiMidPrice = await this.huobiService.getMidPrice();

    this.logger.log('Successfully fetched mid prices from exchanges.');
    return [binanceMidPrice, krakenMidPrice, huobiMidPrice].filter(
      (price) => price !== null,
    );
  }

  async calculateAndCacheAverageMidPrice(): Promise<number> {
    this.logger.log('Calculating and caching average mid price...');
    const prices = await this.getExchangeMidPrices();
    if (prices.length === 0) {
      this.logger.warn('No mid prices available from exchanges.');
      return null;
    }

    const averageMidPrice =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;
    await this.cacheManager.set('averageMidPrice', averageMidPrice);
    this.logger.log(`Cached average mid price: ${averageMidPrice}`);
    return averageMidPrice;
  }

  async getAverageMidPrice(): Promise<number> {
    try {
      this.logger.log('Retrieving average mid price from cache...');
      const cachedAverageMidPrice =
        await this.cacheManager.get<number>('averageMidPrice');
      if (
        cachedAverageMidPrice !== undefined &&
        cachedAverageMidPrice !== null
      ) {
        this.logger.log('Successfully retrieved average mid price from cache.');
        return cachedAverageMidPrice;
      } else {
        this.logger.warn('No average mid price in cache, calculating...');
        return this.calculateAndCacheAverageMidPrice();
      }
    } catch (error) {
      this.logger.error(
        'Error retrieving average mid price from cache:',
        error,
      );
      return this.calculateAndCacheAverageMidPrice();
    }
  }

  getBinanceOrderBook(): any {
    this.logger.log('Fetching Binance order book...');
    return this.binanceService.getOrderBook();
  }

  getKrakenOrderBook(): any {
    this.logger.log('Fetching Kraken order book...');
    return this.krakenService.getOrderBook();
  }

  getHuobiOrderBook(): any {
    this.logger.log('Fetching Huobi order book...');
    return this.huobiService.getOrderBook();
  }
}
