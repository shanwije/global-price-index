import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getBinanceOrderBook: jest.fn(),
            getKrakenOrderBook: jest.fn(),
            getHuobiOrderBook: jest.fn(),
            getBinanceMidPrice: jest.fn(),
            getKrakenMidPrice: jest.fn(),
            getHuobiMidPrice: jest.fn(),
            getAverageMidPrice: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should return binance order book', () => {
    const result = {};
    jest.spyOn(appService, 'getBinanceOrderBook').mockReturnValue(result);
    expect(appController.getBinanceOrderBook()).toBe(result);
  });

  it('should return kraken order book', () => {
    const result = {};
    jest.spyOn(appService, 'getKrakenOrderBook').mockReturnValue(result);
    expect(appController.getKrakenOrderBook()).toBe(result);
  });

  it('should return huobi order book', () => {
    const result = {};
    jest.spyOn(appService, 'getHuobiOrderBook').mockReturnValue(result);
    expect(appController.getHuobiOrderBook()).toBe(result);
  });

  it('should return average mid price', async () => {
    const result = 150;
    jest.spyOn(appService, 'getAverageMidPrice').mockResolvedValue(result);
    expect(await appController.getAverageMidPrice()).toBe(result);
  });
});
