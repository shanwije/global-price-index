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

  @Get('binance-midprice')
  async getBinanceMidPrice(): Promise<number> {
    return this.appService.getBinanceMidPrice();
  }

  @Get('kraken-midprice')
  async getKrakenMidPrice(): Promise<number> {
    return this.appService.getKrakenMidPrice();
  }

  @Get('huobi-midprice')
  async getHuobiMidPrice(): Promise<number> {
    return this.appService.getHuobiMidPrice();
  }
}
