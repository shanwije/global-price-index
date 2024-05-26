import { Observable, BehaviorSubject } from 'rxjs';
import { Exchange } from './exchange.interface';
import * as WebSocket from 'ws';
import { Logger } from '@nestjs/common';

export abstract class AbstractExchange implements Exchange {
  protected ws: WebSocket;
  protected readonly logger = new Logger(AbstractExchange.name);
  private latestOrderBook: any = null;

  abstract connect(): void;

  getOrderBook(): any {
    return this.latestOrderBook;
  }

  protected setupWebSocket(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log(`Connected to ${this.constructor.name}`);
    });

    this.ws.on('message', (data) => {
      this.logger.log(`Received message from ${this.constructor.name}`);
      try {
        const parsedData = JSON.parse(data.toString());
        this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
        this.latestOrderBook = parsedData;
      } catch (error) {
        this.logger.error(`Error parsing message: ${error}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn(
        `Disconnected from ${this.constructor.name}, reconnecting...`,
      );
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error}`);
    });
  }
}
