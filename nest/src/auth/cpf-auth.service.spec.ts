import { Test, TestingModule } from '@nestjs/testing';
import { CpfAuthService } from './cpf-auth.service';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

describe('CpfAuthService', () => {
  let service: CpfAuthService;
  const mockDb = { getPool: jest.fn() };
  const mockJwt = { sign: jest.fn(() => 'mock_token') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpfAuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<CpfAuthService>(CpfAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('returns token and user with edificioIdDefecto', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [{ Id: 1, Username: 'test', Nombre: 'Test', Rol: 'registrador', Tipo: 'PROVEEDOR', PasswordHash: hash, EdificioIdDefecto: 121 }] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      const result = await service.login('test', 'pass123');
      expect(result.access_token).toBe('mock_token');
      expect(result.user.edificioIdDefecto).toBe(121);
    });

    it('throws for invalid password', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [{ Id: 1, Username: 'test', Nombre: 'Test', Rol: 'registrador', Tipo: 'PROVEEDOR', PasswordHash: hash }] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      await expect(service.login('test', 'wrong')).rejects.toThrow('Usuario o contraseña incorrectos');
    });
  });
});