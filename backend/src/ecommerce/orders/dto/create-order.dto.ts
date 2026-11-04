import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  Length,
  Matches,
  ValidateIf,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderSource } from '@prisma/client';
import { OrderStatus, CustomerPaymentMethod } from '@prisma/client';
import { ProductionStatus } from '@prisma/client';

class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty()
  optionType: string;

  @IsString()
  @IsNotEmpty()
  optionValue: string;
}

// Étape de production soumise par le commercial pour une ligne de service.
export class CreateProductionStepDto {
  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @IsString()
  @IsNotEmpty()
  equipmentNameSnapshot: string;

  @IsInt()
  @Min(1)
  stepOrder: number;

  // Temps estimé en heures décimales (ex : 1.5 = 1h30).
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedTimeHours: number;

  // Coût horaire figé au moment de la commande.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRateSnapshot: number;

  // Coût calculé figé : estimatedTimeHours × hourlyRateSnapshot.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calculatedCost: number;
}

// Résumé financier soumis par le commercial pour une ligne de service.
export class CreateProductionSummaryDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalProductionCost: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  marginPercent: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalPrice: number;
}

class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Pour les services : prix = finalPrice calculé par le module coût de production.
  // Pour les produits stock : prix négocié manuellement.
  @IsNumber()
  @Min(0)
  unitPrice: number;

  // Remise négociée sur cette ligne (montant, pas %), figée historiquement avec le total.
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  // Prix d'assemblage (montant, pas %) — pour certains services, coût de
  // finition/assemblage facturé après la production, saisi par le commercial
  // à la commande, distinct du prix unitaire et du workflow de production.
  @IsOptional()
  @IsNumber()
  @Min(0)
  assemblyPrice?: number;

  @IsOptional()
  @IsString()
  designFileName?: string;

  @IsOptional()
  @IsString()
  designFileUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options?: CreateProductOptionDto[];

  // Valeurs des spécifications techniques du produit (Chantier 5) —
  // { technicalKey: valeur }, validées server-side contre la définition du produit.
  @IsOptional()
  @IsObject()
  specValues?: Record<string, unknown>;

  // Coût de production (services uniquement) — optionnel.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductionStepDto)
  productionSteps?: CreateProductionStepDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductionSummaryDto)
  productionSummary?: CreateProductionSummaryDto;
}

export class OccasionalOrderCustomerDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 255)
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(7, 30)
  @Matches(/^\+?[0-9 ()-]+$/)
  phone: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() || undefined : value,
  )
  @IsEmail()
  @Length(1, 255)
  email?: string;
}

export class CreateOrderBySalesRepDto {
  @ValidateIf(
    (dto: CreateOrderBySalesRepDto) =>
      !dto.occasionalCustomer || dto.customerId !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  customerId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return plainToInstance(
        OccasionalOrderCustomerDto,
        JSON.parse(value) as object,
      );
    } catch {
      return value;
    }
  })
  @IsObject()
  @ValidateNested()
  @Type(() => OccasionalOrderCustomerDto)
  occasionalCustomer?: OccasionalOrderCustomerDto;

  @ValidateIf((dto: CreateOrderBySalesRepDto) => !dto.occasionalCustomer)
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  paymentDueDate: string;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsOptional()
  @IsString()
  opportunityId?: string;

  @IsNotEmpty()
  @IsEnum(OrderSource)
  source: OrderSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // Applique ou non la TVA (taux par défaut configuré dans le module taxes) à
  // cette commande — décidé par le commercial au moment de la création.
  // Défaut à true : la TVA est appliquée sauf décision explicite contraire.
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  applyTax?: boolean;
}

export class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}

export class updateProductionStatusDto {
  @IsEnum(ProductionStatus)
  @IsNotEmpty()
  productionStatus: ProductionStatus;
}
