import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { BinanceService } from './exchanges/binance/binance.service';
import { KrakenService } from './exchanges/kraken/kraken.service';
import { HuobiService } from './exchanges/huobi/huobi.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        CacheModule.register({
          ttl: 5,
          max: 10,
        }),
        AppModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
  });

  it('should provide AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
  });

  it('should provide BinanceService', () => {
    const service = module.get<BinanceService>(BinanceService);
    expect(service).toBeDefined();
  });

  it('should provide KrakenService', () => {
    const service = module.get<KrakenService>(KrakenService);
    expect(service).toBeDefined();
  });

  it('should provide HuobiService', () => {
    const service = module.get<HuobiService>(HuobiService);
    expect(service).toBeDefined();
  });
});
