import { AuthService } from './auth.service';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    devLogin(dto: {
        carnet: string;
    }): Promise<{
        access_token: string;
        user: {
            carnet: string;
            nombre: any;
            rol: string;
        };
    }>;
    me(req: any): Promise<{
        carnet: any;
        nombre: any;
        rol: any;
    }>;
}
