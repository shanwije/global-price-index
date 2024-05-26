import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { KrakenService } from '../../../exchanges/services/kraken.service';

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

  it('should handle mid price updates and cache them', async () => {
    const midPriceUpdate = {
      a: [['69000.0', '1.0']],
      b: [['68000.0', '1.0']],
    };
    const logSpy = jest.spyOn(service['logger'], 'log');

    service.handleMessage([0, midPriceUpdate]);
    expect(logSpy).toHaveBeenCalledWith('Calculated mid price: 68500');
    expect(cacheManager.set).toHaveBeenCalledWith(
      'krakenserviceMidPrice',
      68500,
    );
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(68500);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(68500);
    expect(cacheManager.get).toHaveBeenCalledWith('krakenserviceMidPrice');
  });

  it('should log error when no mid price available', async () => {
    cacheManager.get.mockResolvedValue(null);
    const logSpy = jest.spyOn(service['logger'], 'error');
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBeNull();
    expect(logSpy).toHaveBeenCalledWith(
      'KrakenService - No mid price available in cache',
    );
  });
});
