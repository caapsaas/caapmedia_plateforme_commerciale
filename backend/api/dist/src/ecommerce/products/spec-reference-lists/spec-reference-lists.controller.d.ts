import { SpecReferenceListsService } from './spec-reference-lists.service';
import { CreateReferenceListDto, CreateReferenceValueDto, UpdateReferenceListDto, UpdateReferenceValueDto } from './dto/spec-reference-list.dto';
export declare class SpecReferenceListsController {
    private readonly service;
    constructor(service: SpecReferenceListsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        values: {
            id: string;
            listId: string;
            value: string;
            label: string;
            order: number;
        }[];
    } & {
        id: string;
        name: string;
        key: string;
    })[]>;
    create(dto: CreateReferenceListDto): Promise<{
        id: string;
        name: string;
        key: string;
    }>;
    findOne(id: string): Promise<{
        values: {
            id: string;
            listId: string;
            value: string;
            label: string;
            order: number;
        }[];
    } & {
        id: string;
        name: string;
        key: string;
    }>;
    update(id: string, dto: UpdateReferenceListDto): Promise<{
        id: string;
        name: string;
        key: string;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
    addValue(id: string, dto: CreateReferenceValueDto): Promise<{
        id: string;
        listId: string;
        value: string;
        label: string;
        order: number;
    }>;
    updateValue(valueId: string, dto: UpdateReferenceValueDto): Promise<{
        id: string;
        listId: string;
        value: string;
        label: string;
        order: number;
    }>;
    removeValue(valueId: string): Promise<{
        id: string;
    }>;
}
