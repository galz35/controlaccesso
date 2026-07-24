import { Test, TestingModule } from '@nestjs/testing';
import { AccesoService } from './acceso.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import { resolveBuilding } from '../common/building.resolver';

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
    it('returns empty array when no results', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      expect(await service.accesosHoy()).toEqual([]);
    });
  });

  describe('accesosPendientes', () => {
    it('filters out SALIDA_INDEPENDIENTE type', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      await service.accesosPendientes(121);
      expect(req.input).toHaveBeenCalledWith('EdificioId', 121);
    });
  });

  describe('registrarSalida', () => {
    it('passes EdificioIdAutorizado when provided', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [{ Id: 1 }] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      const result = await service.registrarSalida(1, 'usuario', 121);
      expect(req.input).toHaveBeenCalledWith('EdificioIdAutorizado', 121);
      expect(result.Id).toBe(1);
    });

    it('passes null EdificioIdAutorizado when not provided', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [{ Id: 1 }] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      await service.registrarSalida(1, 'usuario');
      expect(req.input).toHaveBeenCalledWith('EdificioIdAutorizado', null);
    });
  });

  describe('registrarSalidaIndependiente', () => {
    it('returns tipo SALIDA_INDEPENDIENTE', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordset: [{ Id: 1, Nombre: 'Test', FechaSalida: new Date(), EdificioId: 121 }] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      const result = await service.registrarSalidaIndependiente(
        { edificioId: 121, personaId: 'TEST', nombrePersona: 'Test', observacion: 'Prueba' }, 'admin');
      expect(result.tipo).toBe('SALIDA_INDEPENDIENTE');
      expect(result.Id).toBe(1);
    });
  });

  describe('reporte', () => {
    it('passes correct pagination params', async () => {
      const req = { input: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ recordsets: [[[{ Total: 0 }]], []] }) };
      mockDb.getPool.mockResolvedValue({ request: jest.fn(() => req) });
      const result = await service.reporte(121, 'EMPLEADO', '2026-01-01', '2026-12-31', 1, 50);
      expect(result.total).toBe(0);
      expect(result.pagina).toBe(1);
      expect(result.porPagina).toBe(50);
    });
  });
});

describe('resolveBuilding', () => {
  it('returns requested for admin', () => {
    expect(resolveBuilding({ rol: 'admin' }, 5)).toBe(5);
  });

  it('returns assigned building for registrador', () => {
    expect(resolveBuilding({ rol: 'registrador', edificioIdDefecto: 121 }, undefined)).toBe(121);
  });

  it('throws for registrador without building', () => {
    expect(() => resolveBuilding({ rol: 'registrador', edificioIdDefecto: null }, undefined)).toThrow('Usuario sin edificio autorizado');
  });

  it('throws for mismatched building', () => {
    expect(() => resolveBuilding({ rol: 'registrador', edificioIdDefecto: 121 }, 1)).toThrow('Edificio no autorizado');
  });
});