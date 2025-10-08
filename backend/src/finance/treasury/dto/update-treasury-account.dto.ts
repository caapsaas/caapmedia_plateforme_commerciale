import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty } from 'class-validator';

// On ne permet de modifier que le nom du compte pour éviter les incohérences de solde.
class UpdateableTreasuryAccount {
    @IsString()
    @IsNotEmpty()
    accountName: string;
}

export class UpdateTreasuryAccountDto extends PartialType(UpdateableTreasuryAccount) {}
