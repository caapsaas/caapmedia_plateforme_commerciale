// src/crm/leads/dto/create-lead.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la piste est requis.' })
  leadName: string;

  @IsString()
  @IsNotEmpty({ message: "Le nom de l'entreprise est requis." })
  company: string;

  @IsEmail({}, { message: "L'adresse email doit être valide." })
  @IsNotEmpty({ message: "L'adresse email est requise." })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis.' })
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LeadStatus, { message: 'Le statut de la piste est invalide.' })
  @IsNotEmpty({ message: 'Le statut de la piste est requis.' })
  status: LeadStatus;

  @IsString()
  @IsOptional()
  salesRepId?: string;
}
