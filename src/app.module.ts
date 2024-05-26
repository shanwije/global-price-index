import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExchangesModule } from './exchanges/exchanges.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: parseInt(configService.get<string>('CACHE_TTL'), 2),
        max: parseInt(configService.get<string>('CACHE_MAX'), 2),
        inject: [ConfigService],
      }),
      inject: [ConfigService],
    }),
    ExchangesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
