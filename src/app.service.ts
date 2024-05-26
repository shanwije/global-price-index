import { Injectable, OnModuleInit } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly binanceService: BinanceService) {}

  onModuleInit() {
    this.binanceService.connect();
  }

  getBinanceOrderBook(): any {
    return this.binanceService.getLatestOrderBook();
  }

  getBinanceMidPrice(): Promise<number> {
    return this.binanceService.getMidPrice();
  }
}
