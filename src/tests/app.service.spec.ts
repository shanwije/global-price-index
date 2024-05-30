import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../../src/app.service';
import { BinanceService } from '../exchanges/services/binance.service';
import { KrakenService } from '../exchanges/services/kraken.service';
import { HuobiService } from '../exchanges/services/huobi.service';

describe('AppService', () => {
  let appService: AppService;
  let binanceService: BinanceService;
  let krakenService: KrakenService;
  let huobiService: HuobiService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: BinanceService,
          useValue: { getMidPrice: jest.fn() },
        },
        {
          provide: KrakenService,
          useValue: { getMidPrice: jest.fn() },
        },
        {
          provide: HuobiService,
          useValue: { getMidPrice: jest.fn() },
        },
      ],
    }).compile();

    appService = moduleRef.get<AppService>(AppService);
    binanceService = moduleRef.get<BinanceService>(BinanceService);
    krakenService = moduleRef.get<KrakenService>(KrakenService);
    huobiService = moduleRef.get<HuobiService>(HuobiService);
  });

  it('should return the global price index when all services return the same price', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(50000);
    jest.spyOn(krakenService, 'getMidPrice').mockResolvedValue(50000);
    jest.spyOn(huobiService, 'getMidPrice').mockResolvedValue(50000);

    const result = await appService.getGlobalPriceIndex();
    expect(result).toEqual({ price: 50000 });
  });

  it('should return the global price index when one service returns a different price', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(50000);
    jest.spyOn(krakenService, 'getMidPrice').mockResolvedValue(49000);
    jest.spyOn(huobiService, 'getMidPrice').mockResolvedValue(49500);

    const result = await appService.getGlobalPriceIndex();
    expect(result).toEqual({ price: 49500 });
  });

  it('should handle one service failing', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(50000);
    jest
      .spyOn(krakenService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));
    jest.spyOn(huobiService, 'getMidPrice').mockResolvedValue(49500);

    const result = await appService.getGlobalPriceIndex();
    expect(result).toEqual({ price: 49750 }); // Average of 50000 and 49500
  });

  it('should handle all services failing', async () => {
    jest
      .spyOn(binanceService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));
    jest
      .spyOn(krakenService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));
    jest
      .spyOn(huobiService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));

    await expect(appService.getGlobalPriceIndex()).rejects.toThrow(
      'All services failed',
    );
  });

  it('should handle two services failing', async () => {
    jest.spyOn(binanceService, 'getMidPrice').mockResolvedValue(50000);
    jest
      .spyOn(krakenService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));
    jest
      .spyOn(huobiService, 'getMidPrice')
      .mockRejectedValue(new Error('Service unavailable'));

    const result = await appService.getGlobalPriceIndex();
    expect(result).toEqual({ price: 50000 }); // Only Binance service working
  });
});
