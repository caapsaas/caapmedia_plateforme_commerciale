import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  justification: string;
}
