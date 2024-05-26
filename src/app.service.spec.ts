import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

describe('AppService', () => {
  let service: AppService;
  let binanceService: BinanceService;
  let krakenService: KrakenService;
  let huobiService: HuobiService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CacheModule.register()],
      providers: [
        AppService,
        BinanceService,
        KrakenService,
        HuobiService,
        ConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    binanceService = module.get<BinanceService>(BinanceService);
    krakenService = module.get<KrakenService>(KrakenService);
    huobiService = module.get<HuobiService>(HuobiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize services on module init', () => {
    const binanceConnectSpy = jest.spyOn(binanceService, 'connect');
    const krakenConnectSpy = jest.spyOn(krakenService, 'connect');
    const huobiConnectSpy = jest.spyOn(huobiService, 'connect');

    service.onModuleInit();

    expect(binanceConnectSpy).toHaveBeenCalled();
    expect(krakenConnectSpy).toHaveBeenCalled();
    expect(huobiConnectSpy).toHaveBeenCalled();
  });

  it('should calculate and cache average mid price', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(100);
    jest.spyOn(krakenService, 'getMidPrice').mockResolvedValue(200);
    jest.spyOn(huobiService, 'getMidPrice').mockResolvedValue(300);

    const averageMidPrice = await service.calculateAndCacheAverageMidPrice();
    expect(averageMidPrice).toBe(200);
    expect(cacheManager.set).toHaveBeenCalledWith('averageMidPrice', 200);
  });

  it('should get average mid price from cache', async () => {
    cacheManager.get.mockResolvedValue(200);
    const averageMidPrice = await service.getAverageMidPrice();
    expect(averageMidPrice).toBe(200);
  });

  it('should return null if no prices are available', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(null);
    jest.spyOn(krakenService, 'getMidPrice').mockResolvedValue(null);
    jest.spyOn(huobiService, 'getMidPrice').mockResolvedValue(null);

    const averageMidPrice = await service.calculateAndCacheAverageMidPrice();
    expect(averageMidPrice).toBeNull();
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('should return mid price if cache retrieval fails and fallback is available', async () => {
    cacheManager.get.mockRejectedValue(new Error('Cache error'));
    const fallbackValue = 150;
    jest
      .spyOn(service, 'calculateAndCacheAverageMidPrice')
      .mockResolvedValue(fallbackValue);

    const averageMidPrice = await service.getAverageMidPrice();
    expect(service.calculateAndCacheAverageMidPrice).toHaveBeenCalled();
    expect(averageMidPrice).toBe(fallbackValue);
  });

  it('should return null if cache retrieval fails and no fallback is available', async () => {
    cacheManager.get.mockRejectedValue(new Error('Cache error'));
    jest
      .spyOn(service, 'calculateAndCacheAverageMidPrice')
      .mockResolvedValue(null);

    const averageMidPrice = await service.getAverageMidPrice();
    expect(averageMidPrice).toBeNull();
  });
});
