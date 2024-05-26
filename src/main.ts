import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogLevel } from '@nestjs/common/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('PORT') || 3000;

  const logLevel =
    (configService.get<string>('LOG_LEVEL') as LogLevel) || 'log';
  Logger.overrideLogger([logLevel]);

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}

bootstrap();
