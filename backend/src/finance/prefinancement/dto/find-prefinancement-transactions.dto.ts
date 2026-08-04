import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class FindPrefinancementTransactionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @IsIn(['CREDIT', 'DEBIT'])
  type?: 'CREDIT' | 'DEBIT';

  @IsOptional()
  @IsIn(['MATERIELS_PREMIER', 'MAIN_D_OEUVRE', 'ENERGIE', 'TRANSPORT', 'AUTRE'])
  category?:
    | 'MATERIELS_PREMIER'
    | 'MAIN_D_OEUVRE'
    | 'ENERGIE'
    | 'TRANSPORT'
    | 'AUTRE';

  @IsOptional()
  @IsIn(['VALIDE', 'EN_ATTENTE', 'ANNULE'])
  status?: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
