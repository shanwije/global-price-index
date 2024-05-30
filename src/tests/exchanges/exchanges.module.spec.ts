import { Test, TestingModule } from '@nestjs/testing';
import { ExchangesModule } from '../../exchanges/exchanges.module';
import { BinanceService } from '../../exchanges/services/binance.service';
import { KrakenService } from '../../exchanges/services/kraken.service';
import { HuobiService } from '../../exchanges/services/huobi.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

describe('ExchangesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        CacheModule.register({
          ttl: 5,
          max: 10,
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60,
            limit: 10,
          },
        ]),
        ExchangesModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
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
