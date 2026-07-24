import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET', 'control_acceso_jwt_secret_2026'),
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
