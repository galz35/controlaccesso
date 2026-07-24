import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class BuildingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin puede ver todos los edificios
    if (user?.rol === 'admin') return true;

    // Si el usuario tiene un edificio por defecto y la request pide un edificio,
    // verificar que coincida o esté dentro de sus permisos
    const edificioIdDefecto = user?.edificioIdDefecto;
    if (!edificioIdDefecto) return true;

    // Si la request tiene un edificioId en query, verificar
    const queryEdificioId = request.query?.edificioId || request.body?.edificioId;
    if (queryEdificioId && Number(queryEdificioId) !== Number(edificioIdDefecto)) {
      return false;
    }

    return true;
  }
}