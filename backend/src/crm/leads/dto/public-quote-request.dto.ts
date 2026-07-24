import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class PublicQuoteRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis.' })
  leadName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'entreprise est requis.' })
  company: string;

  @IsEmail({}, { message: 'L\'adresse email doit être valide.' })
  @IsNotEmpty({ message: 'L\'adresse email est requise.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis.' })
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;
}
