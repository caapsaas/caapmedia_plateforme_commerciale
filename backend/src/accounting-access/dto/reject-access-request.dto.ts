import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectAccessRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejectionNote?: string;
}
