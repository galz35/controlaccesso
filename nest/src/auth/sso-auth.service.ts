import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SsoAuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async ssoLogin(token: string) {
    const ssoSecret = this.config.get<string>('SSO_SECRET');
    if (!ssoSecret) throw new UnauthorizedException('SSO no configurado.');

    const jsonwebtoken = require('jsonwebtoken');
    let payload: any;
    try {
      payload = jsonwebtoken.verify(token, ssoSecret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Token SSO inválido o expirado.');
    }

    if (payload.type !== 'SSO_PORTAL') {
      throw new UnauthorizedException('Tipo de token SSO inválido.');
    }

    const carnet = payload.carnet;
    if (!carnet) throw new UnauthorizedException('Token no contiene carnet.');

    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Carnet', carnet)
      .execute('sp_Login_Empleado');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Error al crear usuario local.');

    const accessToken = this.jwt.sign({ carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol });
    return { access_token: accessToken, user: { carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol } };
  }
}
