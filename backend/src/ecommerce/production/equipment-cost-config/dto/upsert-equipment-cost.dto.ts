import { IsUUID, IsNumber, Min } from 'class-validator';

export class UpsertEquipmentCostDto {
  @IsUUID()
  equipmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate: number;
}
