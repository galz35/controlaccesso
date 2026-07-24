import { Test, TestingModule } from '@nestjs/testing';
import { AccesoService } from './acceso.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';

describe('AccesoService', () => {
  let service: AccesoService;
  const mockDb = { getPool: jest.fn() };
  const mockConfig = { get: jest.fn((key: string, def?: any) => def) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccesoService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<AccesoService>(AccesoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('accesosHoy', () => {
    it('should return empty array when no results', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      const result = await service.accesosHoy();
      expect(result).toEqual([]);
    });
  });
});