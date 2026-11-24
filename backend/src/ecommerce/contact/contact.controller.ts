import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StorefrontContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact-message.dto';

@Controller('storefront/contact')
export class StorefrontContactController {
  constructor(private readonly contact: StorefrontContactService) {}

  @Post()
  @HttpCode(204)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async submit(@Body() message: ContactMessageDto): Promise<void> {
    if (message.honeypot) return;
    await this.contact.send(message);
  }
}
