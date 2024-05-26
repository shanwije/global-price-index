import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { KrakenService } from './kraken.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

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

  it('should connect to websocket', () => {
    const connectSpy = jest.spyOn(service, 'connect');
    service.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle messages', async () => {
    const orderBook = { bids: [['100', '1']], asks: [['200', '1']] };
    service.handleMessage(orderBook);
    expect(cacheManager.set).toHaveBeenCalled();
  });

  it('should get mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(150);
    const midPrice = await service.getMidPrice();
    expect(midPrice).toBe(150);
  });
});
