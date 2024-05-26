import { Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';

@Injectable()
export class BinanceService extends AbstractExchange {
  private readonly url = 'wss://stream.binance.com:9443/ws/btcusdt@depth5';
  readonly logger = new Logger(BinanceService.name);

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.url}`);
    this.setupWebSocket(this.url);
  }
}
