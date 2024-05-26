import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('binance-midprice')
  async getBinanceMidPrice(): Promise<number> {
    const midPrice = await this.appService.getBinanceMidPrice();
    return midPrice;
  }
}
