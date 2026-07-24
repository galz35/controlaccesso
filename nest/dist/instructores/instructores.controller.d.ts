import { InstructoresService } from './instructores.service';
import { InstructorDto } from '../common/dto/catalog.dto';
export declare class InstructoresController {
    private service;
    constructor(service: InstructoresService);
    getAll(): Promise<any[]>;
    create(dto: InstructorDto): Promise<any>;
    update(id: number, dto: InstructorDto): Promise<any>;
}
