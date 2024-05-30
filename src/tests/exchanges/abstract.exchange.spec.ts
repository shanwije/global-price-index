/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { AbstractExchange } from '../../exchanges/abstract-exchange';

// todo add more tests
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
  });

  it('should be defined', () => {
    expect(exchange).toBeDefined();
  });

  it('should return null if cache is not updated within 1 second', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

    const result = await exchange.getMidPrice();
    expect(result).toBeNull();
  });
});
