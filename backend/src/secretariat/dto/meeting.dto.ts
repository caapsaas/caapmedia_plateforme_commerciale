import { IsString, IsDate, IsOptional, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateMeetingDto {
  @IsString()
  // @ApiProperty({ description: 'Titre de la réunion' })
  title: string;

  @Type(() => Date) // Convertit string ISO en Date
  @IsDate({ message: 'meetingDate must be a valid date' })
  // @ApiProperty({ description: 'Date de la réunion' })
  meetingDate: Date;

  @Type(() => Date) // Convertit string ISO en Date
  @IsDate({ message: 'meetingTime must be a valid date' })
  // @ApiProperty({ description: 'Heure de la réunion' })
  meetingTime: Date;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Lieu de la réunion' })
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Ordre du jour' })
  agenda?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Compte-rendu' })
  minutes?: string;

  @IsUUID('all') // Plus précis : valide tous les types UUID
  // @ApiProperty({ description: 'ID de la filiale' })
  subsidiaryId: string;

  @IsOptional() // Rendu optionnel : tableau vide OK
  @IsArray()
  @IsString({ each: true })
  // @ApiPropertyOptional({ description: 'IDs des participants (employés)', type: [String] })
  participantIds?: string[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau titre' })
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Nouvelle date' })
  meetingDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Nouvelle heure' })
  meetingTime?: Date;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau lieu' })
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau ordre du jour' })
  agenda?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau compte-rendu' })
  minutes?: string;

  @IsOptional() // Rendu optionnel : ne force pas l'update des participants
  @IsArray()
  @IsString({ each: true })
  // @ApiPropertyOptional({ description: 'Nouveaux IDs des participants', type: [String] })
  participantIds?: string[];
}

export class SearchMeetingsDto {
  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Titre à rechercher' })
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Date à rechercher' })
  meetingDate?: Date;
}
