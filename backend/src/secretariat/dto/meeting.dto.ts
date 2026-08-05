import { IsString, IsDate, IsOptional, IsUUID, IsArray, IsNotEmpty } from 'class-validator';
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
  @IsUUID('all')
  subsidiaryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
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
  @IsUUID('all', { each: true })
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
