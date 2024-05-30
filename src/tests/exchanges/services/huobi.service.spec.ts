import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HuobiService } from '../../../exchanges/services/huobi.service';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as zlib from 'zlib';

describe('HuobiService', () => {
  let service: HuobiService;
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
        HuobiService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    service = module.get<HuobiService>(HuobiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to WebSocket', () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');
    const setupWebSocketSpy = jest.spyOn<any, any>(service, 'setupWebSocket');

    service.connect();

    expect(loggerSpy).toHaveBeenCalledWith(
      `Connecting to Huobi WebSocket at ${service['wsUrl']}`,
    );
    expect(setupWebSocketSpy).toHaveBeenCalledWith(service['wsUrl']);
  });

  it('should handle plain messages and cache mid price', async () => {
    const orderBook = { tick: { bids: [['100', '1']], asks: [['200', '1']] } };
    const calculateMidPriceSpy = jest.spyOn(service, 'calculateMidPrice');
    const cacheSetSpy = jest.spyOn(cacheManager, 'set');

    const midPrice = service.calculateMidPrice(orderBook);
    calculateMidPriceSpy.mockReturnValue(midPrice);

    service.handleAPIResponse(JSON.stringify(orderBook));

    expect(calculateMidPriceSpy).toHaveBeenCalledWith(orderBook);
    expect(cacheSetSpy).toHaveBeenCalledWith('huobiserviceMidPrice', midPrice);
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
    expect(cacheManager.get).toHaveBeenCalledWith('huobiserviceMidPrice');
  });

  it('should parse data correctly', () => {
    const data = JSON.stringify({ test: 'data' });
    const parsedData = service.parseData(data);
    expect(parsedData).toEqual({ test: 'data' });
  });

  it('should handle parsing error correctly', () => {
    const invalidData = 'invalid data';
    expect(() => service.parseData(invalidData)).toThrow(
      `Error parsing data: Unexpected token 'i', \"invalid data\" is not valid JSON`,
    );
  });

  it('should handle compressed data correctly', () => {
    const mockData = { test: 'data' };
    const compressedData = zlib.gzipSync(Buffer.from(JSON.stringify(mockData)));
    const loggerSpy = jest.spyOn(service['logger'], 'debug');
    const parsedData = service.parseData(compressedData);

    expect(loggerSpy).toHaveBeenCalledWith('Decompressed data successfully');
    expect(parsedData).toEqual(mockData);
  });

  it('should calculate mid price correctly', () => {
    const data = {
      tick: { bids: [['100.0', '1']], asks: [['200.0', '1']] },
    };
    const midPrice = service.calculateMidPrice(data);
    expect(midPrice).toBe(150.0);
  });

  it('should throw error if bids or asks are empty', () => {
    const data = { tick: { bids: [], asks: [] } };
    expect(() => service.calculateMidPrice(data)).toThrow(
      `Cannot read properties of undefined (reading '0')`,
    );
  });

  it('should throw error if bid or ask prices are invalid', () => {
    const data = {
      tick: { bids: [['invalid', '1']], asks: [['invalid', '1']] },
    };
    expect(() => service.calculateMidPrice(data)).toThrow(
      'Invalid bid/ask price: NaN, NaN',
    );
  });
});
