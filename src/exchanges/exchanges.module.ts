import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BinanceService } from './services/binance.service';
import { KrakenService } from './services/kraken.service';
import { HuobiService } from './services/huobi.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: parseInt(configService.get<string>('CACHE_TTL'), 3) || 3,
        max: parseInt(configService.get<string>('CACHE_MAX'), 30) || 30,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BinanceService, KrakenService, HuobiService],
  exports: [BinanceService, KrakenService, HuobiService],
})
export class ExchangesModule {}
