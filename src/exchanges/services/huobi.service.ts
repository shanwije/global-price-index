import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

@Injectable()
export class HuobiService extends AbstractExchange {
  readonly logger = new Logger(HuobiService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly configService: ConfigService,
  ) {
    super(cacheManager, configService);
    const wsBaseUrl = this.configService.get<string>('HUOBI_WS_URL');
    const wsCurrencyPair = this.configService.get<string>(
      'HUOBI_WS_CURRENCY_PAIR',
    );
    this.wsUrl = `${wsBaseUrl}`;
    this.wsSubscriptionMessage = {
      sub: `market.${wsCurrencyPair}.depth.step0`,
      id: `${HuobiService.name}_depth_step0`,
    };
  }

  connect(): void {
    this.logger.log(`Connecting to Huobi WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  parseData(data: WebSocket.Data) {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.ping) {
        this.ws.send(JSON.stringify({ pong: parsed.ping }));
        return null;
      }
      return parsed;
    } catch (error) {
      throw new Error(`Error parsing data: ${error.message}`);
    }
  }

  calculateMidPrice(data: any): number {
    if (!data.tick || !data.tick.bids || !data.tick.asks) {
      throw new Error(`Data bids or asks are empty`);
    }

    const highestBid = parseFloat(data.tick.bids[0][0]);
    const lowestAsk = parseFloat(data.tick.asks[0][0]);

    if (isNaN(highestBid) || isNaN(lowestAsk)) {
      throw new Error(`Invalid bid/ask price: ${highestBid}, ${lowestAsk}`);
    }

    return (highestBid + lowestAsk) / 2;
  }
}
