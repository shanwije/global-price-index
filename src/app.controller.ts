import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('binance-orderbook')
  getBinanceOrderBook(): any {
    return this.appService.getBinanceOrderBook();
  }

  @Get('kraken-orderbook')
  getKrakenOrderBook(): any {
    return this.appService.getKrakenOrderBook();
  }

  @Get('huobi-orderbook')
  getHuobiOrderBook(): any {
    return this.appService.getHuobiOrderBook();
  }

  @Get('average-midprice')
  async getAverageMidPrice(): Promise<number> {
    return this.appService.getAverageMidPrice();
  }
}
