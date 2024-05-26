import { Injectable, OnModuleInit } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';

@Injectable()
export class AppService implements OnModuleInit {
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

  getBinanceOrderBook(): any {
    return this.binanceService.getOrderBook();
  }

  getKrakenOrderBook(): any {
    return this.krakenService.getOrderBook();
  }

  getHuobiOrderBook(): any {
    return this.huobiService.getOrderBook();
  }

  getBinanceMidPrice(): Promise<number> {
    return this.binanceService.getMidPrice();
  }

  getKrakenMidPrice(): Promise<number> {
    return this.krakenService.getMidPrice();
  }

  getHuobiMidPrice(): Promise<number> {
    return this.huobiService.getMidPrice();
  }
}
