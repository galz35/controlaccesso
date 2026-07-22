import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
export declare class AuthService {
    private db;
    private jwt;
    constructor(db: DatabaseService, jwt: JwtService);
    devLogin(carnet: string): Promise<{
        access_token: string;
        user: {
            carnet: any;
            nombre: any;
            rol: any;
        };
    }>;
    me(carnet: string): Promise<{
        carnet: any;
        nombre: any;
        rol: any;
    }>;
}
