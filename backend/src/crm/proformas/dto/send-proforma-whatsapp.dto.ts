import { IsString, Length } from 'class-validator';

export class SendProformaWhatsAppDto {
  @IsString()
  @Length(1, 40)
  expectedRecipient!: string;
}
