import { DatabaseService } from './database/database.service';
export declare class AppController {
    private db;
    constructor(db: DatabaseService);
    health(): Promise<{
        status: string;
        database: string;
    }>;
}
