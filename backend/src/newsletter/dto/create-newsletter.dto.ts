import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse e-mail valide.' })
  @IsNotEmpty({ message: "L'adresse e-mail ne peut pas être vide." })
  email: string;
}
