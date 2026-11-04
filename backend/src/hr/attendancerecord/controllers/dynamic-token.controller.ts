import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles, CurrentUser } from 'src/common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { resolveScopeContext } from 'src/common/utils/subsidiary-scope';
import { DynamicTokenService } from '../services/dynamic-token.service';

@Controller('hr/dynamic-token')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class DynamicTokenController {
  constructor(private readonly dynamicTokenService: DynamicTokenService) {}
  @Get('current')
  async getCurrentToken(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') requestedId?: string,
  ) {
    const result = await this.dynamicTokenService.getPermanentToken(
      this.resolveSubsidiary(user, requestedId),
    );
    return this.response(result);
  }
  @Post('generate')
  async generateNewToken(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') requestedId?: string,
  ) {
    const result = await this.dynamicTokenService.getPermanentToken(
      this.resolveSubsidiary(user, requestedId),
      true,
    );
    return this.response(result);
  }
  private response(result: { token: string; expiresAt: Date | null }) {
    return {
      ...result,
      qrUrl: `${(process.env.FRONTEND_URL || 'https://caapmedia.com').replace(/\/+$/, '')}/pointage?t=${result.token}`,
    };
  }
  private resolveSubsidiary(user: JwtUser, requestedId?: string): string {
    const ctx = resolveScopeContext(user);
    if (requestedId && !ctx.hasGlobalScope && requestedId !== ctx.subsidiaryId)
      throw new ForbiddenException('Accès limité à votre filiale.');
    return requestedId || ctx.subsidiaryId;
  }
}
