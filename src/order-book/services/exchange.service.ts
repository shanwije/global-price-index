import { IExchangeService } from '../interfaces/exchange-service.interface';
import { Socket } from 'socket.io-client';
import { Logger } from '@nestjs/common';

export abstract class ExchangeService implements IExchangeService {
  protected socket: Socket;
  protected logger = new Logger(ExchangeService.name);

  abstract connect(): void;
  abstract fetchOrderBook(): Promise<any>;

  calculateMidPrice(orderBook: any): number {
    const bestAsk = orderBook.asks[0];
    const bestBid = orderBook.bids[0];
    this.logger.log(`Best Ask: ${bestAsk}, Best Bid: ${bestBid}`);
    return (bestAsk + bestBid) / 2;
  }
}
