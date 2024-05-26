import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { TestExchangeService } from '../../exchanges/test-exchange.service';
import * as WebSocket from 'ws';

describe('AbstractExchange', () => {
  let service: TestExchangeService;
  let cacheManager: any;
  let wsServer: WebSocket.Server;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register()],
      providers: [
        TestExchangeService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<TestExchangeService>(TestExchangeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    if (wsServer) {
      wsServer.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate and cache mid price', async () => {
    const orderBook = { bids: [['100', '1']], asks: [['200', '1']] };
    const midPrice = await service.calculateAndCacheMidPrice(orderBook);
    expect(midPrice).toBe(150);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'testexchangeserviceMidPrice',
      150,
    );
  });

  it('should return cached mid price', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
  });

  it('should return null if no mid price is available', async () => {
    cacheManager.get.mockResolvedValue(null);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBeNull();
  });
});
