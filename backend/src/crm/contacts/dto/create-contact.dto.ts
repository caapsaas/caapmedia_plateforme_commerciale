import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ContactStatus } from '@prisma/client';

export class CreateContactDto {
  @IsString({ message: 'Le nom du contact doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom du contact est obligatoire.' })
  contactName: string;

  @IsString({ message: 'Le nom de l’entreprise doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom de l’entreprise est obligatoire.' })
  company: string;

  @IsEmail({}, { message: 'L’adresse e-mail fournie est invalide.' })
  @IsNotEmpty({ message: 'L’adresse e-mail est obligatoire.' })
  email: string;

  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire.' })
  phone: string;

  @IsString({ message: 'L’adresse doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'L’adresse est obligatoire.' })
  address: string;

  @IsEnum(ContactStatus, {
    message: 'Le statut du contact doit être une valeur valide de ContactStatus.',
  })
  @IsOptional()
  status?: ContactStatus;

  @IsUUID('4', { message: 'L’ID du compte doit être un UUID valide.' })
  @IsOptional()
  accountId?: string;

  @IsUUID('4', { message: 'L’ID de la filiale doit être un UUID valide.' })
  @IsOptional()
  subsidiaryId?: string;

  @IsDateString({}, { message: 'Le champ "since" doit être une date ISO valide (ex: 2025-10-23T12:00:00.000Z).' })
  @IsOptional()
  since?: Date;
}
