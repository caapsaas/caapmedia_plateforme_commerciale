// src/crm/leads/dto/create-lead.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la piste est requis.' })
  leadName: string;

  @IsString()
  @IsNotEmpty({ message: "Le nom de l'entreprise est requis." })
  company: string;

  @Transform(({ value }) => value === '' ? null : value)
  @IsEmail({}, { message: "L'adresse email doit être valide." })
  @IsOptional()
  email?: string | null;

  @Transform(({ value }) => value === '' ? null : value)
  @IsString()
  @IsOptional()
  phone?: string | null;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LeadStatus, { message: 'Le statut de la piste est invalide.' })
  @IsNotEmpty({ message: 'Le statut de la piste est requis.' })
  status: LeadStatus;

  @IsString()
  @IsOptional()
  salesRepId?: string;

  @IsOptional() @IsString() externalReference?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() cityArea?: string;
  @IsOptional() @IsString() sector?: string;
  @IsOptional() @IsString() caapOffer?: string;
  @IsOptional() @IsString() yearEndNeed?: string;
  @IsOptional() @IsString() requestedService?: string;
  @IsOptional() @IsString() score?: string;
  @IsOptional() @IsString() commercialPriority?: string;
  @IsOptional() @IsString() verification?: string;
  @IsOptional() @IsString() nextAction?: string;
  @IsOptional() @IsString() commercialStatus?: string;
  @IsOptional() @IsString() responsibleName?: string;
  @IsOptional() @IsString() contactDate?: string;
  @IsOptional() @IsString() followUpDate?: string;
  @IsOptional() @IsString() followUpNotes?: string;
  @IsOptional() @IsString() whatsappConfirmed?: string;
  @IsOptional() @IsString() observedFact?: string;
  @IsOptional() @IsString() locationSource?: string;
  @IsOptional() @IsString() contactSource?: string;
  @IsOptional() @IsString() signalDate?: string;
  @IsOptional() @IsString() signalSource?: string;
  @IsOptional() @IsString() documentaryConfidence?: string;
  @IsOptional() @IsString() fitScore?: string;
  @IsOptional() @IsString() recentSignalScore?: string;
  @IsOptional() @IsString() recurrenceScore?: string;
  @IsOptional() @IsString() accessibilityScore?: string;
  @IsOptional() @IsString() feasibilityScore?: string;
  @IsOptional() @IsString() caapOfferSource?: string;
  @IsOptional() @IsString() consultationDate?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() prospectType?: string;
  @IsOptional() @IsString() officialWebsite?: string;
  @IsOptional() @IsString() reservesLogistics?: string;
  @IsOptional() @IsString() linkedinPublic?: string;
  @IsOptional() @IsString() preparedMessage?: string;
}
