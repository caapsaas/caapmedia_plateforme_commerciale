import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindExternalTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID de la filiale' })
  @IsString()
  subsidiaryId: string;

  @ApiPropertyOptional({ description: 'Filtrer par type de transaction' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filtrer par catégorie' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
