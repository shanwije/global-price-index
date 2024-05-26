import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { BinanceService } from '../exchanges/binance/binance.service';
import { KrakenService } from '../exchanges/kraken/kraken.service';
import { HuobiService } from '../exchanges/huobi/huobi.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: BinanceService,
          useValue: { getMidPrice: jest.fn().mockResolvedValue(50000) },
        },
        {
          provide: KrakenService,
          useValue: { getMidPrice: jest.fn().mockResolvedValue(49000) },
        },
        {
          provide: HuobiService,
          useValue: { getMidPrice: jest.fn().mockResolvedValue(49500) },
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
  });

  describe('getGlobalPriceIndex', () => {
    it('should return the global price index', async () => {
      const result = await appController.getGlobalPriceIndex();
      expect(result).toEqual({ price: 49500 });
    });
  });
});
