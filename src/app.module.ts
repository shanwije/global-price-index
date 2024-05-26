import { Module } from '@nestjs/common';
import { ExchangesModule } from './exchanges/exchanges.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 600,
      max: 100,
    }),
    ExchangesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
