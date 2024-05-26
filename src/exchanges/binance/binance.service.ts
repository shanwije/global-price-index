import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BinanceService extends AbstractExchange {
  private readonly url: string;
  readonly logger = new Logger(BinanceService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    super(cacheManager);
    const wsUrl = this.configService.get<string>('BINANCE_WS_URL');
    const wsDepth = this.configService.get<string>('BINANCE_WS_DEPTH');
    const wsCurrencyPair = this.configService.get<string>(
      'BINANCE_WS_CURRENCY_PAIR',
    );
    this.url = `${wsUrl}/${wsCurrencyPair}@${wsDepth}`;
  }

  connect(): void {
    this.logger.log(`Connecting to Binance WebSocket at ${this.url}`);
    this.setupWebSocket(this.url);
  }

  protected handleMessage(data: any): void {
    this.data = data;
    this.calculateAndCacheMidPrice(data);
  }
}
