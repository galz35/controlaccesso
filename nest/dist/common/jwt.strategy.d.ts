import { ConfigService } from '@nestjs/config';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: any): Promise<{
        sub: any;
        carnet: any;
        username: any;
        nombre: any;
        rol: any;
        tipo: any;
        cpf: any;
        edificioIdDefecto: any;
    }>;
}
export {};
