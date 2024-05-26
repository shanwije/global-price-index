import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeService } from '../../exchange.service';
import { io } from 'socket.io-client';
import { Logger } from '@nestjs/common';

@Injectable()
export class BinanceService extends ExchangeService {
  readonly logger = new Logger(BinanceService.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  connect(): void {
    const url = this.configService.get<string>('BINANCE_SOCKET_URL');
    this.logger.log(`Connecting to ${url}`);
    this.socket = io(url);
    this.socket.on('connect', () => {
      this.logger.log('Connected to Binance WebSocket');
    });
    this.socket.on('disconnect', () => {
      this.logger.log('Disconnected from Binance WebSocket');
    });
  }

  fetchOrderBook(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.on('message', (data) => {
        this.logger.log('Received order book data');
        resolve(JSON.parse(data));
      });
      this.socket.on('error', (error) => {
        this.logger.error('Error receiving order book data', error);
        reject(error);
      });
    });
  }
}
