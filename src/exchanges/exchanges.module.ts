import { Module } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600,
      max: 100,
    }),
  ],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class ExchangesModule {}
