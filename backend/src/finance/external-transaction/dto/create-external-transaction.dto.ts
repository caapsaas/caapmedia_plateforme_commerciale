import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExternalTransactionType,
  ExternalTransactionCategory,
  ExternalTransactionStatus,
  PaymentMethod,
} from '@prisma/client';

export class CreateExternalTransactionDto {
  @ApiProperty({ description: 'Date de la transaction (YYYY-MM-DD)' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Description de la transaction' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Montant de la transaction' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    enum: ExternalTransactionType,
    description: 'Type de transaction externe',
  })
  @IsEnum(ExternalTransactionType)
  externalTransactionType: ExternalTransactionType;

  @ApiProperty({
    enum: ExternalTransactionCategory,
    description: 'Catégorie de la transaction',
  })
  @IsEnum(ExternalTransactionCategory)
  externalTransactionCategory: ExternalTransactionCategory;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Méthode de paiement',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Numéro de référence' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  // User.id est un id préfixé custom (USR-xxx), jamais un UUID.
  @ApiProperty({ description: "ID de l'utilisateur qui crée la transaction" })
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'ID de la filiale' })
  @IsString()
  subsidiaryId: string;
}
