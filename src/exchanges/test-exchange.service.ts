import { Injectable } from '@nestjs/common';
import { AbstractExchange } from './abstract-exchange';

@Injectable()
export class TestExchangeService extends AbstractExchange {
  wsUrl = 'wss://test-exchange.com/ws';
  wsSubscriptionMessage = { event: 'subscribe', channel: 'test' };

  connect(): void {
    this.setupWebSocket(this.wsUrl);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMessage(data: any): void {}
}
