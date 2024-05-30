/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { AbstractExchange } from '../../exchanges/abstract-exchange';
import * as WebSocket from 'ws';

// mocks
process.env.THROTTLER_TTL = '60';
process.env.THROTTLER_LIMIT = '10';
process.env.CACHE_TTL = '5';
process.env.CACHE_MAX = '10';
process.env.CHECK_CACHE_INTERVAL = '100';
process.env.CACHE_TIMEOUT = '1000';
process.env.RECONNECT_DELAY = '2000';

class TestExchange extends AbstractExchange {
  connect(): void {}

  parseData(data: any): any {
    return JSON.parse(data.toString());
  }

  calculateMidPrice(data: any): number {
    return data.price;
  }
}

describe('AbstractExchange', () => {
  let exchange: TestExchange;
  let cacheManager: Cache;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register(), ConfigModule.forRoot()],
      providers: [
        ConfigService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            store: {
              keys: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: AbstractExchange,
          useClass: TestExchange,
        },
      ],
    }).compile();

    exchange = module.get<AbstractExchange>(AbstractExchange) as TestExchange;
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(exchange).toBeDefined();
  });

  it('should return null if cache is not updated within 1 second', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

    const result = await exchange.getMidPrice();
    expect(result).toBeNull();
  });

  it('should handle API response correctly', async () => {
    const orderBook = {
      bids: [['100', '1']],
      asks: [['200', '1']],
      price: 150,
    };
    const calculateMidPriceSpy = jest.spyOn(exchange, 'calculateMidPrice');
    const cacheSetSpy = jest.spyOn(cacheManager, 'set');

    await exchange.handleAPIResponse(JSON.stringify(orderBook));

    expect(calculateMidPriceSpy).toHaveBeenCalledWith(orderBook);
  });
});
