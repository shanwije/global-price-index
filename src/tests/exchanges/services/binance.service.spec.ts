import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AbstractExchange } from '../../../exchanges/abstract-exchange';
import * as WebSocket from 'ws';

class TestExchange extends AbstractExchange {
  connect(): void {}

  parseData(data: WebSocket.Data): any {
    return JSON.parse(data.toString());
  }

  calculateMidPrice(data: any): number {
    const highestBid = parseFloat(data.bids[0][0]);
    const lowestAsk = parseFloat(data.asks[0][0]);
    return (highestBid + lowestAsk) / 2;
  }
}

describe('AbstractExchange', () => {
  let service: AbstractExchange;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      store: {
        keys: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        CacheModule.register(),
        ThrottlerModule.forRoot([
          {
            ttl: 60,
            limit: 10,
          },
        ]),
      ],
      providers: [
        TestExchange,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    service = module.get<TestExchange>(TestExchange);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
    expect(cacheManager.get).toHaveBeenCalledWith('testexchangeMidPrice');
  });

  it('should handle API response correctly', async () => {
    const orderBook = { bids: [['100', '1']], asks: [['200', '1']] };
    const calculateMidPriceSpy = jest.spyOn(service, 'calculateMidPrice');
    const cacheSetSpy = jest.spyOn(cacheManager, 'set');

    const midPrice = service.calculateMidPrice(orderBook);
    calculateMidPriceSpy.mockReturnValue(midPrice);

    await service.handleAPIResponse(JSON.stringify(orderBook));

    expect(calculateMidPriceSpy).toHaveBeenCalledWith(orderBook);
    expect(cacheSetSpy).toHaveBeenCalledWith('testexchangeMidPrice', midPrice);
  });
});
