import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from '../app.service';
import { AppController } from '../app.controller';
import { BinanceService } from '../exchanges/services/binance.service';
import { KrakenService } from '../exchanges/services/kraken.service';
import { HuobiService } from '../exchanges/services/huobi.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => [
            {
              ttl: config.get<number>('THROTTLER_TTL'),
              limit: config.get<number>('THROTTLER_LIMIT'),
            },
          ],
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
