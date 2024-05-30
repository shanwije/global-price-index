import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { KrakenService } from '../../../exchanges/services/kraken.service';

describe('KrakenService', () => {
  let service: KrakenService;
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
        KrakenService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    service = module.get<KrakenService>(KrakenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to WebSocket', () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');
    const setupWebSocketSpy = jest.spyOn<any, any>(service, 'setupWebSocket');

    service.connect();

    expect(loggerSpy).toHaveBeenCalledWith(
      `Connecting to Kraken WebSocket at ${service['wsUrl']}`,
    );
    expect(setupWebSocketSpy).toHaveBeenCalledWith(service['wsUrl']);
  });

  it('should handle plain messages and cache mid price', async () => {
    const orderBook = { 1: { bs: [['100', '1']], as: [['200', '1']] } };
    const calculateMidPriceSpy = jest.spyOn(service, 'calculateMidPrice');
    const cacheSetSpy = jest.spyOn(cacheManager, 'set');

    const midPrice = service.calculateMidPrice(orderBook);
    calculateMidPriceSpy.mockReturnValue(midPrice);

    service.handleAPIResponse(JSON.stringify(orderBook));

    expect(calculateMidPriceSpy).toHaveBeenCalledWith(orderBook);
    expect(cacheSetSpy).toHaveBeenCalledWith('krakenserviceMidPrice', midPrice);
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
    expect(cacheManager.get).toHaveBeenCalledWith('krakenserviceMidPrice');
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

  it('should calculate mid price correctly', () => {
    const data = { 1: { bs: [['100.0', '1']], as: [['200.0', '1']] } };
    const midPrice = service.calculateMidPrice(data);
    expect(midPrice).toBe(150.0);
  });

  it('should calculate mid price correctly with no bids', () => {
    const data = { 1: { a: [['200.0', '1']], c: [['100.0', '1']] } };
    const midPrice = service.calculateMidPrice(data);
    expect(midPrice).toBe(200.0);
  });

  it('should throw error if bids or asks are empty or in an unexpected format', () => {
    const data = { 1: {} };
    expect(() => service.calculateMidPrice(data)).toThrow(
      'Data bids or asks are empty or in an unexpected format',
    );
  });

  it('should throw error if ask data is invalid', () => {
    const data = { 1: { bs: [['100.0', '1']], as: [] } };
    expect(() => service.calculateMidPrice(data)).toThrow('Invalid ask data');
  });

  it('should throw error if bid or ask prices are invalid', () => {
    const data = { 1: { bs: [['invalid', '1']], as: [['invalid', '1']] } };
    expect(() => service.calculateMidPrice(data)).toThrow(
      'Invalid bid/ask price: NaN, NaN',
    );
  });
});
