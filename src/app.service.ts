import { Injectable, OnModuleInit } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly krakenService: KrakenService,
  ) {}

  onModuleInit() {
    this.binanceService.connect();
    this.krakenService.connect();
  }

  getBinanceOrderBook(): any {
    return this.binanceService.getOrderBook();
  }

  getKrakenOrderBook(): any {
    return this.krakenService.getOrderBook();
  }

  getBinanceMidPrice(): Promise<number> {
    return this.binanceService.getMidPrice();
  }

  getKrakenMidPrice(): Promise<number> {
    return this.krakenService.getMidPrice();
  }
}
