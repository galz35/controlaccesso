import { InstructoresService } from './instructores.service';
export declare class InstructoresController {
    private service;
    constructor(service: InstructoresService);
    getAll(): Promise<any[]>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
