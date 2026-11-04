import {
  IsIn,
  IsString,
  Length,
} from 'class-validator';

export class SecurePointageDto {
  @IsString() @Length(20, 128) token: string;
  @IsString() @Length(1, 100) matricule: string;
  @IsIn(['arrival', 'departure']) action: 'arrival' | 'departure';
}
