import { PickType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterContactDto extends PickType(CreateContactDto, [
  'email',
  'contactName',
  'company',
  'phone',
  'address',
] as const) {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
