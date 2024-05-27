# Global Price Index for BTC/USDT

## Overview

As a market maker, having a global price index is essential. This project aims to fetch the BTC/USDT order book from three different exchanges (Binance, Kraken, and Huobi), compute a mid-price for each order book, and finally return an average of these mid-prices. The implementation uses Nest.js framework built using Node.js and TypeScript.

```angular2html
- Node.js (>=14.x)
- npm
```

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-name>

2. Install the dependencies:

   ```bash
   npm install

3. Configuration
Create a .env file in the root of the project and add the following configuration variables:

   ```bash
   BINANCE_WS_URL=wss://stream.binance.com:9443/ws
   BINANCE_WS_DEPTH=depth10
   BINANCE_WS_CURRENCY_PAIR=btcusdt
   
   KRAKEN_WS_URL=wss://ws.kraken.com
   KRAKEN_WS_DEPTH=10
   
   HUOBI_WS_URL=wss://api.huobi.pro/ws
   HUOBI_WS_CURRENCY_PAIR=btcusdt
   HUOBI_WS_DEPTH=step0

## Running the Application

### using docker

**Docker Setup**
You can run the application using Docker. This section provides the necessary steps to build and run the application in a Docker container.

**Build the Docker Image**:

```bash
docker-compose build
```

Run the Docker Container:

```
```bash
docker-compose up
```

**or can be run using npm**:

   ```bash
   npm start
   ```

   The application will connect to the specified WebSocket endpoints, fetch the order book data, compute the mid-prices, and expose a REST API to get the global price index.

5. Running Tests

   To run the tests, execute:

   ```bash
   npm test
   ```

#### Current Unit test coverage

```angular2html
----------------------------|---------|----------|---------|---------|--------------------------------------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                
----------------------------|---------|----------|---------|---------|--------------------------------------------------
All files                   |   73.23 |    62.82 |   65.78 |   71.54 |                                                  
 src                        |   78.48 |    71.42 |   88.88 |   75.36 |                                                  
  app.controller.ts         |     100 |      100 |     100 |     100 |                                                  
  app.module.ts             |     100 |      100 |     100 |     100 |                                                  
  app.service.ts            |     100 |      100 |     100 |     100 |                                                  
  main.ts                   |       0 |        0 |       0 |       0 | 1-33                                             
 src/config                 |     100 |       50 |     100 |     100 |                                                  
  configuration.ts          |     100 |       50 |     100 |     100 | 6-19                                             
 src/dto                    |     100 |      100 |     100 |     100 |                                                  
  global-price-index.dto.ts |     100 |      100 |     100 |     100 |                                                  
 src/exchanges              |   48.97 |       52 |   31.25 |   47.31 |                                                  
  abstract-exchange.ts      |   43.18 |    47.61 |   26.66 |   42.35 | 38-41,48-63,70-73,77-122,134-135,146-147,172-188 
  exchanges.module.ts       |     100 |       75 |     100 |     100 | 15                                               
 src/exchanges/services     |   94.11 |    72.41 |   91.66 |   94.87 |                                                  
  binance.service.ts        |     100 |      100 |     100 |     100 |                                                  
  huobi.service.ts          |     100 |      100 |     100 |     100 |                                                  
  kraken.service.ts         |   89.13 |    66.66 |   83.33 |   90.69 | 66,75-76,82                                      
----------------------------|---------|----------|---------|---------|--------------------------------------------------

Test Suites: 9 passed, 9 total
Tests:       39 passed, 39 total
```

## Project Structure

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── config/
│   └── configuration.ts
├── dto/
│   └── global-price-index.dto.ts
├── exchanges/
│   ├── abstract-exchange.ts
│   ├── exchange.interface.ts
│   ├── exchanges.module.ts
│   └── services/
│       ├── binance.service.ts
│       ├── huobi.service.ts
│       └── kraken.service.ts
├── main.ts
└── tests/
    ├── app.controller.spec.ts
    ├── app.module.spec.ts
    ├── app.service.spec.ts
    ├── exchanges/
    │   ├── abstract.exchange.spec.ts
    │   ├── exchanges.module.spec.ts
    │   └── services/
    │       ├── binance.service.spec.ts
    │       ├── huobi.service.spec.ts
    │       └── kraken.service.spec.ts
    └── main.spec.ts

```

## API Endpoints

### Swagger

```
http://localhost:3000/api
```

### Get Global Price Index

```
URL: /api/global-price-index
Method: GET
Response:

{
  "price": 50000
}
```

## Implementation Details

**WebSocket Connections**
Each exchange service connects to its respective WebSocket endpoint to receive real-time order book updates. The services handle WebSocket messages, update the order book data, and compute the mid-prices.

**Mid-Price Calculation**
The mid-price is calculated as the average of the best bid and best ask prices from the order book.

**Caching**
Mid-prices are cached to improve performance and reduce redundant computations.

**Error Handling**
Comprehensive error handling is implemented to manage WebSocket disconnections, malformed messages, and other potential issues.
