import { NotificationsModule } from '../../notifications/notifications.module';
import { Module } from '@nestjs/common';
import { ProformasService } from './proformas.service';
import { ProformasController } from './proformas.controller';
import { ProformaPdfService } from './proforma-pdf.service';
import { ProformaMailerService } from './proforma-mailer.service';
import { ProformaDeliveryService } from './proforma-delivery.service';
import { ProformaShareController } from './proforma-share.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [ProformasController, ProformaShareController],
  providers: [
    ProformasService,
    ProformaPdfService,
    ProformaMailerService,
    ProformaDeliveryService,
  ],
  exports: [ProformasService],
})
export class ProformasModule {}
