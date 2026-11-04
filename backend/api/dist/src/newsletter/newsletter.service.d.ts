import { PrismaService } from '../common/utils/prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
export declare class NewsletterService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createNewsletterDto: CreateNewsletterDto): Promise<{
        id: string;
        email: string;
        createdAt: Date;
    }>;
}
