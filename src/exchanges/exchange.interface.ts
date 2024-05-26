import { Observable } from 'rxjs';

export interface Exchange {
  connect(): void;

  getOrderBook(): Observable<any>;

  getMidPrice(): Promise<number>;
}
