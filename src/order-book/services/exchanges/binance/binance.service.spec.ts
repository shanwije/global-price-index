import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService } from '../../exchange.service';

class MockExchangeService extends ExchangeService {
  connect(): void {
    // Mock implementation
  }
  fetchOrderBook(): Promise<any> {
    return Promise.resolve({ asks: [100], bids: [90] });
  }
}

describe('ExchangeService', () => {
  let service: ExchangeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ExchangeService,
          useClass: MockExchangeService,
        },
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate mid price', () => {
    const orderBook = { asks: [100], bids: [90] };
    const midPrice = service.calculateMidPrice(orderBook);
    expect(midPrice).toBe(95);
  });
});
