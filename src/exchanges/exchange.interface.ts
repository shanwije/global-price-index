import WebSocket from 'ws';

export interface Exchange {
  connect(): void;
  handleAPIResponse(data: WebSocket.data): void;
  calculateMidPrice(data: any): number;
  getMidPrice(): Promise<number | null>;
}
