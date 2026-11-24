import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ActiveRoles } from '../auth/role/role.decorator';
import { RoleGuard } from '../auth/role/role.guard';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RoleGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @ActiveRoles(UserRole.SUPER_ADMIN)
  @Header('Cache-Control', 'no-store')
  list() {
    return this.integrations.list();
  }

  @Get(':id/checks')
  @ActiveRoles(UserRole.SUPER_ADMIN)
  @Header('Cache-Control', 'no-store')
  history(@Param('id') id: string, @Query('beforeId') beforeId?: string) {
    const cursor = beforeId === undefined ? undefined : Number(beforeId);
    if (
      cursor !== undefined &&
      (typeof beforeId !== 'string' ||
        !/^\d+$/.test(beforeId) ||
        !Number.isInteger(cursor) ||
        cursor < 1 ||
        cursor > 2147483647)
    ) {
      throw new BadRequestException('Invalid history cursor');
    }
    return this.integrations.history(id, cursor);
  }
}
