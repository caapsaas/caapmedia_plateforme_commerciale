import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() createNewsletterDto: CreateNewsletterDto) {
    const subscription =
      await this.newsletterService.create(createNewsletterDto);
    return {
      message: 'Merci de vous être inscrit à notre newsletter !',
      subscription,
    };
  }
}
