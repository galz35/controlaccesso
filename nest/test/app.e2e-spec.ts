import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DatabaseService } from './../src/database/database.service';

const mockDb = {
  getPool: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnThis(),
    query: jest.fn().mockResolvedValue({ recordset: [] }),
    input: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ recordset: [] }),
  }),
};

describe('ControlAcceso (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const { AppModule } = await import('./../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService).useValue(mockDb)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  it('GET /api/health should return ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toBe('connected');
      });
  });

  it('GET /api/edificios should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/api/edificios')
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});