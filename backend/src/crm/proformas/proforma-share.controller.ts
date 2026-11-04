import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ProformaDeliveryService } from './proforma-delivery.service';
import { proformaFilename } from './proforma-pdf.service';

@Controller('proforma-share')
export class ProformaShareController {
  constructor(private readonly delivery: ProformaDeliveryService) {}

  @Get(':token')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async download(@Param('token') token: string, @Res() response: Response) {
    const { quote, buffer } = await this.delivery.sharedDocument(token);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${proformaFilename(quote.proformaNumber)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    });
    response.send(buffer);
  }
}
