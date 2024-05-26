import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExchangeService } from './order-book/services/exchange/exchange.service';
import { BinanceService } from './order-book/services/exchanges/binance/binance.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ExchangeService, BinanceService],
})
export class AppModule {}
