import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BinanceService } from './binance/binance.service';
import { KrakenService } from './kraken/kraken.service';
import { HuobiService } from './huobi/huobi.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: parseInt(configService.get<string>('CACHE_TTL'), 10), // seconds
        max: parseInt(configService.get<string>('CACHE_MAX'), 10), // maximum number of items in cache
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BinanceService, KrakenService, HuobiService],
  exports: [BinanceService, KrakenService, HuobiService],
})
export class ExchangesModule {}
