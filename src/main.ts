import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './config/exceptions/AllExceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  const port = configService.get<number>('port');
  // const logLevel = configService.get<LogLevel>('logLevel');

  const logLevels: LogLevel[] = ['warn', 'error'];
  Logger.overrideLogger(logLevels);
  app.useLogger(logLevels);

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
