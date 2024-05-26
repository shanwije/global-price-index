export interface IExchangeService {
  connect(): void;
  fetchOrderBook(): Promise<any>;
  calculateMidPrice(orderBook: any): number;
}
