import { IsEmail } from 'class-validator';

export class SendProformaEmailDto {
  // A precondition, never an override of the stored client's address.
  @IsEmail()
  expectedRecipient: string;
}
