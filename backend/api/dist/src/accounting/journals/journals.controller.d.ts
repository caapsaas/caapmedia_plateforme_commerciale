import { JournalsService } from './journals.service';
export declare class JournalsController {
    private readonly journalsService;
    constructor(journalsService: JournalsService);
    findAll(): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        code: string;
        journalType: import("@prisma/client").$Enums.JournalType;
    }[]>;
    seed(): Promise<{
        message: string;
    }>;
}
