import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
export declare class NewsletterController {
    private readonly newsletterService;
    constructor(newsletterService: NewsletterService);
    subscribe(createNewsletterDto: CreateNewsletterDto): Promise<{
        message: string;
        subscription: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
}
