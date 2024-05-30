import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from './exchanges/services/binance.service';
import { KrakenService } from './exchanges/services/kraken.service';
import { HuobiService } from './exchanges/services/huobi.service';
import { AverageMidPriceDto } from './dto/global-price-index.dto';
import { number } from 'joi';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
    private readonly huobiService: HuobiService,
  ) {}

  async getGlobalPriceIndex(): Promise<AverageMidPriceDto> {
    const prices: (number | null)[] = [];

    try {
      const binanceMidPrice = await this.binanceService.getMidPrice();
      const krakenMidPrice = await this.krakenService.getMidPrice();
      const huobiMidPrice = await this.huobiService.getMidPrice();
      this.logger.debug(
        `binance mid price : ${binanceMidPrice}, kraken mid price : ${krakenMidPrice}, huobiMidPrice = ${huobiMidPrice}`,
      );
      prices.push(binanceMidPrice);
      prices.push(krakenMidPrice);
      prices.push(huobiMidPrice);
    } catch (error) {
      this.logger.error('Binance service failed', error.message);
    }

    if (prices.length === 0) {
      throw new Error('All services failed');
    }

    this.logger.debug(`All prices: ${prices}`);

    const validPrices = prices.filter(
      (price) => price !== null && price !== undefined,
    );

    const averageMidPrice =
      validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
    return { price: averageMidPrice };
  }
}
