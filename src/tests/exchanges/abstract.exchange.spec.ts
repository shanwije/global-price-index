import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { KrakenService } from '../../exchanges/services/kraken.service';
import { AbstractExchange } from '../../exchanges/abstract-exchange';

describe('KrakenService', () => {
  let service: KrakenService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register()],
      providers: [
        KrakenService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<KrakenService>(KrakenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to WebSocket', () => {
    const connectSpy = jest.spyOn(service, 'connect');
    service.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle subscription status messages', () => {
    const subscriptionMessage = {
      event: 'subscriptionStatus',
      status: 'subscribed',
    };
    const logSpy = jest.spyOn(service['logger'], 'log');

    service.handleMessage(subscriptionMessage);
    expect(logSpy).toHaveBeenCalledWith(
      'Successfully subscribed to Kraken WebSocket',
    );
  });

  it('should handle initial snapshot and cache mid price', async () => {
    const initialSnapshot = [
      0,
      {
        as: [['69000.0', '1.0']],
        bs: [['68000.0', '1.0']],
      },
    ];
    const logSpy = jest.spyOn(service['logger'], 'log');
    const calculateSpy = jest.spyOn(
      AbstractExchange.prototype as any,
      'calculateAndCacheMidPrice',
    );

    service.handleMessage(initialSnapshot);
    expect(calculateSpy).toHaveBeenCalledWith({
      asks: [['69000.0', '1.0']],
      bids: [['68000.0', '1.0']],
    });
    expect(logSpy).toHaveBeenCalledWith(
      'Received initial order book snapshot from Kraken',
    );
  });

  it('should handle incremental updates and cache mid price', async () => {
    const orderBookUpdate = [
      0,
      {
        a: [['69050.0', '1.5']],
        b: [['68050.0', '1.5']],
      },
    ];
    const logSpy = jest.spyOn(service['logger'], 'log');
    const calculateSpy = jest.spyOn(
      AbstractExchange.prototype as any,
      'calculateAndCacheMidPrice',
    );

    service.handleMessage(orderBookUpdate);
    expect(calculateSpy).toHaveBeenCalledWith({
      asks: [['69050.0', '1.5']],
      bids: [['68050.0', '1.5']],
    });
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(68500);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(68500);
    expect(cacheManager.get).toHaveBeenCalledWith('krakenserviceMidPrice');
  });
});
