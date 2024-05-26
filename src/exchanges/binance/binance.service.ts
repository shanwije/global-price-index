import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

@Injectable()
export class BinanceService extends AbstractExchange {
  readonly logger = new Logger(BinanceService.name);
  private ws: WebSocket;
  private wsUrl: string;

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    const wsBaseUrl = this.configService.get<string>('BINANCE_WS_URL');
    const wsDepth = this.configService.get<string>('BINANCE_WS_DEPTH');
    const wsCurrencyPair = this.configService.get<string>(
      'BINANCE_WS_CURRENCY_PAIR',
    );
    this.wsUrl = `${wsBaseUrl}/${wsCurrencyPair}@${wsDepth}`;
  }

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  private setupWebSocket(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.on('open', () => {
      this.logger.log('Connected to Binance WebSocket');
    });

    this.ws.on('message', (data) => {
      this.logger.log('Received message from Binance WebSocket');
      try {
        const parsedData = JSON.parse(data.toString());
        // this.logger.debug(`Message data: ${JSON.stringify(parsedData)}`);
        this.handleMessage(parsedData);
      } catch (error) {
        this.logger.error(`Error parsing message: ${error}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('Disconnected from Binance WebSocket, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error}`);
    });
  }

  handleMessage(data: any): void {
    this.data = data;
    this.calculateAndCacheMidPrice(data);
  }

  async calculateAndCacheMidPrice(orderBook: any): Promise<number> {
    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    await this.cacheManager.set('binanceMidPrice', midPrice);
    this.logger.log(`Cached mid price: ${midPrice}`);
    return midPrice;
  }
}
