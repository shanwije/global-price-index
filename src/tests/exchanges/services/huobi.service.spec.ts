import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HuobiService } from '../../../exchanges/services/huobi.service';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import * as WebSocket from 'ws';

describe('HuobiService', () => {
  let service: HuobiService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register()],
      providers: [
        HuobiService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<HuobiService>(HuobiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to WebSocket', () => {
    const connectSpy = jest.spyOn(service, 'connect');
    service.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle ping messages', () => {
    const wsMock = { send: jest.fn() } as unknown as WebSocket;
    service['ws'] = wsMock;
    const pingMessage = { ping: 123456 };

    service.handleMessage(pingMessage);
    expect(wsMock.send).toHaveBeenCalledWith(JSON.stringify({ pong: 123456 }));
  });

  it('should handle data messages and cache mid price', async () => {
    const orderBook = {
      ch: 'market.btcusdt.depth.step0',
      tick: { bids: [['100', '1']], asks: [['200', '1']] },
    };
    const calculateAndCacheMidPriceSpy = jest.spyOn(
      service,
      'calculateAndCacheMidPrice',
    );

    service.handleMessage(orderBook);
    expect(calculateAndCacheMidPriceSpy).toHaveBeenCalledWith(orderBook.tick);
  });

  it('should handle plain data messages and cache mid price (for testing purposes)', async () => {
    const orderBook = { bids: [['100', '1']], asks: [['200', '1']] };
    const calculateAndCacheMidPriceSpy = jest.spyOn(
      service,
      'calculateAndCacheMidPrice',
    );

    service.handleMessage(orderBook);
    expect(calculateAndCacheMidPriceSpy).toHaveBeenCalledWith(orderBook);
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
    expect(cacheManager.get).toHaveBeenCalledWith('huobiserviceMidPrice');
  });

  it('should calculate and cache mid price if not in cache', async () => {
    const orderBook = { bids: [['100', '1']], asks: [['200', '1']] };
    service['data'] = orderBook; // Directly setting protected member for test

    cacheManager.get.mockResolvedValue(null);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
    expect(cacheManager.set).toHaveBeenCalledWith('huobiserviceMidPrice', 150);
  });

  it('should return null if no data and not in cache', async () => {
    cacheManager.get.mockResolvedValue(null);
    service['data'] = null; // Ensure no data is set

    const midPrice = await service.getMidPrice();
    expect(midPrice).toBeNull();
  });
});
