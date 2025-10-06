import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ContactLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
