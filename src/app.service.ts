import { Injectable, OnModuleInit } from '@nestjs/common';
import { BinanceService } from './exchanges/binance/binance.service';
import { Observable } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly binanceService: BinanceService) {}

  onModuleInit() {
    this.binanceService.connect();
  }

  getBinanceOrderBook(): Observable<any> {
    return this.binanceService.getOrderBook();
  }
}
