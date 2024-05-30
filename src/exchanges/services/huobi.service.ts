import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbstractExchange } from '../abstract-exchange';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as zlib from 'zlib';
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
    this.logger.debug(
      `HuobiService initialized with wsUrl: ${this.wsUrl} and wsSubscriptionMessage: ${JSON.stringify(this.wsSubscriptionMessage)}`,
    );
  }

  connect(): void {
    this.logger.log(`Connecting to Huobi WebSocket at ${this.wsUrl}`);
    this.setupWebSocket(this.wsUrl);
  }

  parseData(data: WebSocket.Data) {
    this.logger.debug(`Received data`);
    try {
      if (Buffer.isBuffer(data)) {
        const decompressedData = zlib.gunzipSync(data).toString('utf-8');
        data = decompressedData;
        this.logger.debug(`Decompressed data successfully`);
      }

      const parsed = JSON.parse(data.toString());
      this.logger.debug(`Parsed data successfully`);

      if (parsed.ping) {
        this.logger.debug(`Received ping: ${parsed.ping}`);
        this.ws.send(JSON.stringify({ pong: parsed.ping }));
        this.logger.debug(`Sent pong: ${parsed.ping}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Error parsing data: ${error.message}`, error.stack);
      throw new Error(`Error parsing data: ${error.message}`);
    }
  }

  calculateMidPrice(data: any): number {
    this.logger.debug(`Calculating mid price for data`);
    if (!data.tick || !data.tick.bids || !data.tick.asks) {
      const errorMsg = `Data bids or asks are empty`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const highestBid = parseFloat(data.tick.bids[0][0]);
    const lowestAsk = parseFloat(data.tick.asks[0][0]);

    this.logger.debug(`Highest bid: ${highestBid}, Lowest ask: ${lowestAsk}`);

    if (isNaN(highestBid) || isNaN(lowestAsk)) {
      const errorMsg = `Invalid bid/ask price: ${highestBid}, ${lowestAsk}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const midPrice = (highestBid + lowestAsk) / 2;
    this.logger.debug(`Calculated mid price: ${midPrice}`);
    return midPrice;
  }
}
