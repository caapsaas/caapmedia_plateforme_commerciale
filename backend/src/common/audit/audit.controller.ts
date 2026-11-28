import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RoleGuard } from '../auth/role/role.guard';
import { ActiveRoles } from '../auth/role/role.decorator';
import { SystemAuditService } from './system-audit.service';

class SystemAuditQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @IsString()
  actorEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly systemAuditService: SystemAuditService) {}

  @ActiveRoles(UserRole.SUPER_ADMIN)
  @Get('system')
  findSystemLogs(@Query() query: SystemAuditQueryDto) {
    return this.systemAuditService.findMany(query);
  }
}
