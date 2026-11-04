import { Body, Controller, Get, GoneException, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SecurePointageDto } from '../dto/secure-pointage.dto';
import { AttendanceSecurityService } from '../services/attendance-security.service';

@Controller('pointage')
export class PointageController {
  constructor(private readonly security: AttendanceSecurityService) {}
  @Get('employees')
  employees() {
    throw new GoneException('La liste publique des employés est désactivée.');
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  pointage(@Body() dto: SecurePointageDto) {
    return this.security.pointage(dto);
  }
}
