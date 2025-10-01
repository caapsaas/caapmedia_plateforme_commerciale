// src/products/dto/create-product.dto.ts
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUrl,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionType } from '@prisma/client'; // Assurez-vous que Prisma Client est généré
import { PartialType } from '@nestjs/mapped-types';


export class ProductImageDto {
    @IsString()
    @IsNotEmpty()
    imageName: string;

    @IsUrl()
    @IsNotEmpty()
    imageUrl: string;
}

export class ConfigurableOptionItemDataDto {
    @IsString()
    @IsNotEmpty()
    optionName: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @Type(() => Number)
    multiplier: number;
}

export class ConfigurableOptionDto {
    @IsEnum(OptionType)
    @IsNotEmpty()
    optionType: OptionType;

    @ValidateNested()
    @Type(() => ConfigurableOptionItemDataDto)
    @IsNotEmpty()
    item: ConfigurableOptionItemDataDto;
}


export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsString()
    @IsNotEmpty()
    mainCategory: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsPositive()
    stock: number;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsNumber()
    @IsPositive()
    sellingPrice: number;

    @IsString()
    @IsNotEmpty()
    warehouse: string;

    @IsString()
    @IsOptional()
    productRange?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConfigurableOptionDto)
    @IsOptional()
    configurableOptions?: ConfigurableOptionDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageDto)
    @IsOptional()
    productImages?: ProductImageDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
