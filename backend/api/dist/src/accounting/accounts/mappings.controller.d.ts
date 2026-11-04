import { MappingsService } from './mappings.service';
export declare class MappingsController {
    private readonly mappingsService;
    constructor(mappingsService: MappingsService);
    findAll(): Promise<{
        id: string;
        key: string;
        accountCode: string;
    }[]>;
    update(key: string, accountCode: string): Promise<{
        id: string;
        key: string;
        accountCode: string;
    }>;
    seed(): Promise<{
        message: string;
    }>;
}
