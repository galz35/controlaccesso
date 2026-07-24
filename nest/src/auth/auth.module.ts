import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SsoAuthService } from './sso-auth.service';
import { CpfAuthService } from './cpf-auth.service';
import { JwtStrategy } from '../common/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '8h') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SsoAuthService, CpfAuthService, JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
