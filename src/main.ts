import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogLevel } from '@nestjs/common/services/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('port') || 3000;

  const logLevel =
    (configService.get<string>('logLevel') as LogLevel) || 'debug';

  Logger.overrideLogger([logLevel]);

  const config = new DocumentBuilder()
    .setTitle('Global Price Index API')
    .setDescription(
      'API to provide the global price index for the BTC/USDT trading pair from Binance, Kraken, and Huobi exchanges.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}

bootstrap();
