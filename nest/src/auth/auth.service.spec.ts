import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockDb = { getPool: jest.fn() };
  const mockJwt = { sign: jest.fn(() => 'mock_token') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('devLogin', () => {
    it('should throw UnauthorizedException for invalid carnet', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      await expect(service.devLogin('000000')).rejects.toThrow('Usuario no encontrado');
    });
  });
});