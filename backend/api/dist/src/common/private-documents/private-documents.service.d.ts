import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { ScopableUser } from '../utils/subsidiary-scope';
export declare class PrivateDocumentsService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    resolveFile(category: string, filename: string, subsidiaryId: string | undefined, user: ScopableUser): Promise<string>;
}
