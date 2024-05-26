import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExchangeService } from './order-book/services/exchange/exchange.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ExchangeService],
})
export class AppModule {}
