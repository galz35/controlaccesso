import { AuthService } from './auth.service';
import { SsoAuthService } from './sso-auth.service';
import { CpfAuthService } from './cpf-auth.service';
export declare class AuthController {
    private auth;
    private sso;
    private cpf;
    constructor(auth: AuthService, sso: SsoAuthService, cpf: CpfAuthService);
    devLogin(dto: {
        carnet: string;
    }): Promise<{
        access_token: string;
        user: {
            carnet: any;
            nombre: any;
            rol: any;
        };
    }>;
    ssoLogin(dto: {
        token: string;
    }): Promise<{
        access_token: string;
        user: {
            carnet: any;
            nombre: any;
            rol: any;
        };
    }>;
    cpfLogin(dto: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            nombre: any;
            rol: any;
            tipo: any;
        };
    }>;
    cpfRegister(dto: {
        username: string;
        password: string;
        nombre: string;
        tipo: string;
        referenciaId?: number;
    }): Promise<any>;
    cpfChangePassword(dto: {
        username: string;
        oldPassword: string;
        newPassword: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    me(req: any): Promise<any>;
}
