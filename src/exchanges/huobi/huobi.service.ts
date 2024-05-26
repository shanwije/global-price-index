import { Injectable, Logger, Inject } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HuobiService extends AbstractExchange {
  readonly logger = new Logger(HuobiService.name);
  protected ws: WebSocket;
  protected wsUrl: string;
  wsSubscriptionMessage: any;

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    this.wsUrl = this.configService.get<string>('HUOBI_WS_URL');
    this.wsSubscriptionMessage = {
      sub: `market.${this.configService.get<string>('HUOBI_WS_CURRENCY_PAIR')}.depth.${this.configService.get<string>('HUOBI_WS_DEPTH')}`,
      id: 'id1',
    };
  }

  connect(): void {
    this.logger.log(`Connecting to Huobi WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  handleMessage(data: any): void {
    if (data.ping) {
      this.ws.send(JSON.stringify({ pong: data.ping }));
      return;
    }

    if (data.ch && data.tick) {
      this.data = data.tick;
      this.calculateAndCacheMidPrice(data.tick);
    }
  }
}
