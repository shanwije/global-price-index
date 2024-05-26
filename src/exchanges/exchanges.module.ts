import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BinanceService } from './binance/binance.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: parseInt(configService.get<string>('CACHE_TTL'), 2),
        max: parseInt(configService.get<string>('CACHE_MAX'), 2),
        inject: [ConfigService],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class ExchangesModule {}
