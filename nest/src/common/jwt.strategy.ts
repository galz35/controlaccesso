import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret === 'control_acceso_jwt_secret_2026') {
      throw new Error('JWT_SECRET no configurado o usa el valor por defecto. Configure JWT_SECRET en .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }
  async validate(payload: any) {
    // Preservar todas las propiedades del payload original
    return {
      sub: payload.sub,
      carnet: payload.carnet || null,
      username: payload.username || null,
      nombre: payload.nombre,
      rol: payload.rol,
      tipo: payload.tipo || null,
      cpf: payload.cpf || false,
    };
  }
}
