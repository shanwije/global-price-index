import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BinanceService extends AbstractExchange {
  readonly logger = new Logger(BinanceService.name);

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

  handleMessage(data: any): void {
    this.data = data;
    this.calculateAndCacheMidPrice(data);
  }
}
