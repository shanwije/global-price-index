import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';
import { AverageMidPriceDto } from './dto/global-price-index.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly huobiService: HuobiService,
  ) {}

  async getGlobalPriceIndex(): Promise<AverageMidPriceDto> {
    const prices: number[] = [];

    try {
      const binanceMidPrice = await this.binanceService.getMidPrice();
      prices.push(binanceMidPrice);
    } catch (error) {
      this.logger.error('Binance service failed', error.message);
    }

    try {
      const krakenMidPrice = await this.krakenService.getMidPrice();
      prices.push(krakenMidPrice);
    } catch (error) {
      this.logger.error('Kraken service failed', error.message);
    }

    try {
      const huobiMidPrice = await this.huobiService.getMidPrice();
      prices.push(huobiMidPrice);
    } catch (error) {
      this.logger.error('Huobi service failed', error.message);
    }

    if (prices.length === 0) {
      throw new Error('All services failed');
    }

    const averageMidPrice =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;
    return { price: averageMidPrice };
  }
}
