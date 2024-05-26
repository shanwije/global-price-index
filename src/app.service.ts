import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from './exchanges/services/binance.service';
import { KrakenService } from './exchanges/services/kraken.service';
import { HuobiService } from './exchanges/services/huobi.service';
import { AverageMidPriceDto } from './dto/global-price-index.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly huobiService: HuobiService,
  ) {}

  onModuleInit() {
    this.binanceService.connect();
    this.krakenService.connect();
    this.huobiService.connect();
  }

  async getGlobalPriceIndex(): Promise<AverageMidPriceDto> {
    const prices: number[] = [];

    try {
      const binanceMidPrice = await this.binanceService.getMidPrice();
      if (binanceMidPrice !== null) prices.push(binanceMidPrice);
    } catch (error) {
      this.logger.error('Binance service failed', error.message);
    }

    try {
      const krakenMidPrice = await this.krakenService.getMidPrice();
      if (krakenMidPrice !== null) prices.push(krakenMidPrice);
    } catch (error) {
      this.logger.error('Kraken service failed', error.message);
    }

    try {
      const huobiMidPrice = await this.huobiService.getMidPrice();
      if (huobiMidPrice !== null) prices.push(huobiMidPrice);
    } catch (error) {
      this.logger.error('Huobi service failed', error.message);
    }

    if (prices.length === 0) {
      throw new Error('All services failed');
    }

    this.logger.error(`prices : ${prices}`);

    const validPrices = prices.filter(
      (price) => price !== null && price !== undefined,
    );

    const averageMidPrice =
      validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
    return { price: averageMidPrice };
  }
}
