import { PrismaService } from "../../common/utils/prisma/prisma.service";
export declare const DEFAULT_JOURNALS: ({
    code: string;
    name: string;
    journalType: "VENTES";
} | {
    code: string;
    name: string;
    journalType: "ACHATS";
} | {
    code: string;
    name: string;
    journalType: "BANQUE";
} | {
    code: string;
    name: string;
    journalType: "CAISSE";
} | {
    code: string;
    name: string;
    journalType: "OD";
})[];
export declare class JournalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    seedDefaultJournals(): Promise<void>;
    findAll(): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        code: string;
        journalType: import("@prisma/client").$Enums.JournalType;
    }[]>;
    findByCode(code: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        code: string;
        journalType: import("@prisma/client").$Enums.JournalType;
    }>;
}
