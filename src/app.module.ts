import { Module } from '@nestjs/common';
import { ExchangesModule } from './exchanges/exchanges.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [ExchangesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
