import { ForbiddenException } from '@nestjs/common';

export function resolveBuilding(
  user: any,
  requested?: number,
): number | undefined {
  if (user?.rol === 'admin') return requested;

  const assigned = Number(user?.edificioIdDefecto);
  if (!Number.isInteger(assigned) || assigned < 1) {
    throw new ForbiddenException('Usuario sin edificio autorizado.');
  }

  if (requested && Number(requested) !== assigned) {
    throw new ForbiddenException('Edificio no autorizado.');
  }

  return assigned;
}