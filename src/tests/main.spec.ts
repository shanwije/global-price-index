import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';

describe('Bootstrap', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);
    await app.listen(configService.get<number>('port') || 3000);
  });

  it('should start the application', async () => {
    const logger = new Logger('Bootstrap');
    logger.log = jest.fn();

    const response = await request(app.getHttpServer()).get('/');
    expect(response.status).toBe(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
