import { IsString, IsDate, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
export class CreateMeetingDto {
  @IsString()
  title: string;

  @Type(() => Date)
  @IsDate({ message: 'meetingDateTime must be a valid datetime' })
  meetingDateTime: Date;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  meetingDateTime?: Date;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  minutes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class SearchMeetingsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  meetingDateTime?: Date;
}
