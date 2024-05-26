import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('binance-order-book')
  getBinanceOrderBook(): any {
    this.logger.log('Handling GET request for /binance-order-book');
    return this.appService.getBinanceOrderBook();
  }

  @Get('kraken-order-book')
  getKrakenOrderBook(): any {
    this.logger.log('Handling GET request for /kraken-order-book');
    return this.appService.getKrakenOrderBook();
  }

  @Get('huobi-order-book')
  getHuobiOrderBook(): any {
    this.logger.log('Handling GET request for /huobi-order-book');
    return this.appService.getHuobiOrderBook();
  }

  @Get('average-mid-price')
  async getAverageMidPrice(): Promise<number> {
    this.logger.log('Handling GET request for /average-mid-price');
    return await this.appService.getAverageMidPrice();
  }
}
