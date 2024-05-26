import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from './binance/binance.service';
import { Exchange } from './exchange.interface';

@Injectable()
export class ExchangeFactoryService {
  private readonly logger = new Logger(ExchangeFactoryService.name);

  constructor(private readonly binanceService: BinanceService) {}

  getExchange(exchangeName: string): Exchange {
    switch (exchangeName) {
      case 'binance':
        return this.binanceService;
      default:
        this.logger.error(`Exchange ${exchangeName} not supported`);
        throw new Error(`Exchange ${exchangeName} not supported`);
    }
  }
}
