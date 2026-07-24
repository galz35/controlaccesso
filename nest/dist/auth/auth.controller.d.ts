import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SsoAuthService } from './sso-auth.service';
import { CpfAuthService } from './cpf-auth.service';
import { DevLoginDto, SsoLoginDto, CpfLoginDto, CpfRegisterDto, CpfChangePasswordDto, AdminResetPasswordDto } from './dto/login.dto';
export declare class AuthController {
    private auth;
    private sso;
    private cpf;
    private config;
    constructor(auth: AuthService, sso: SsoAuthService, cpf: CpfAuthService, config: ConfigService);
    devLogin(dto: DevLoginDto): Promise<{
        access_token: string;
        user: {
            carnet: any;
            nombre: any;
            rol: any;
        };
    }>;
    ssoLogin(dto: SsoLoginDto): Promise<{
        access_token: string;
        user: {
            carnet: any;
            nombre: any;
            rol: any;
        };
    }>;
    cpfLogin(dto: CpfLoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            nombre: any;
            rol: any;
            tipo: any;
            edificioIdDefecto: any;
        };
    }>;
    cpfRegister(dto: CpfRegisterDto): Promise<any>;
    cpfChangePassword(dto: CpfChangePasswordDto, req: any): Promise<{
        success: boolean;
    }>;
    adminResetPassword(dto: AdminResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    me(req: any): Promise<any>;
}
