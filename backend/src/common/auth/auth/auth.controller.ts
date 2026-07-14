
import { Controller, Post, Body, Patch, Delete, Get, Query, Request, UseGuards, Param, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthAuditService } from './auth-audit.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../role/role.decorator';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsUUID, IsEnum, IsArray, IsNotEmpty } from 'class-validator';
import { UserRole, AuthAuditEvent } from '@prisma/client';
import { Type } from 'class-transformer';
import { setAuthCookies, clearAuthCookies, setCsrfCookie, REFRESH_TOKEN_COOKIE } from '../cookie.util';

class RegisterDto {
  @IsString()
  userName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  userRole: UserRole;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  additionalRoles?: UserRole[];

  @IsUUID()
  @IsNotEmpty()
  subsidiaryId: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  userRole?: UserRole;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  additionalRoles?: UserRole[];

  @IsOptional()
  @IsUUID()
  subsidiaryId?: string;
}

class SearchUsersDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  userRole?: UserRole;
}

class AuditLogQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(AuthAuditEvent)
  event?: AuthAuditEvent;

  @IsOptional()
  @Type(() => Number)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  skip?: number;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private authAuditService: AuthAuditService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Request() req) {
    return this.authService.register(dto.userName, dto.email, dto.password, dto.userRole, dto.subsidiaryId, dto.additionalRoles ?? [], req.user);
  }


  // Limite plus stricte que le throttle global (10/60s) pour freiner le
  // bruteforce de mot de passe - une IP ne peut tenter que 5 logins/minute.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    const meta = { email: dto.email, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    let result: Awaited<ReturnType<AuthService['login']>>;
    try {
      result = await this.authService.login(dto.email, dto.password);
    } catch (error) {
      await this.authAuditService.log('LOGIN_FAILED', meta);
      throw error;
    }

    if (result.twoFactorRequired) {
      // Pas de cookies: le client doit d'abord completer POST /auth/2fa/login
      await this.authAuditService.log('LOGIN_2FA_PENDING', { ...meta, userId: undefined });
      return { twoFactorRequired: true, pendingToken: result.pendingToken };
    }
    const { accessToken, refreshToken, user: userPayload } = await this.authService.issueTokens(result.user, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, refreshToken);
    setCsrfCookie(res);
    await this.authAuditService.log('LOGIN_SUCCESS', { ...meta, userId: result.user.id });
    return { twoFactorRequired: false, user: userPayload, subsidiary: result.subsidiary };
  }

  /**
   * Rotation du refresh token: le cookie httpOnly refresh_token (non lisible
   * en JS) est envoye automatiquement par le navigateur sur cette route
   * (path restreint a /api-caapmedia/auth, voir cookie.util.ts).
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const presentedToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!presentedToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    try {
      const { accessToken, refreshToken } = await this.authService.refresh(presentedToken, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      setAuthCookies(res, accessToken, refreshToken);
      setCsrfCookie(res);
      return { message: 'Session renouvelée' };
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  // Limite basse: cet endpoint envoie un email et peut servir a enumerer les
  // comptes existants, en plus du cout d'envoi.
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Request() req) {
    const result = await this.authService.forgotPassword(dto.email);
    await this.authAuditService.log('PASSWORD_RESET_REQUESTED', { email: dto.email, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('Userprofile')
  async getProfileUser(@Request() req) {
    // req.user contient le payload du token JWT, qui inclut l'ID (sub), l'email, etc.
    // Nous passons cet objet directement à notre nouvelle méthode de service.
    return this.authService.getProfileUser(req.user);
  }
  

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR)
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.authService.updateUser(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR)
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    return this.authService.deleteUser(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR)
  @Get('users')
  async getAllUsers(@Request() req) {
    return this.authService.getAllUsers(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR)
  @Get('users/search')
  async searchUsers(@Query() query: SearchUsersDto, @Request() req) {
    return this.authService.searchUsers(query, req.user);
  }

  /**
   * Consultation du journal d'audit d'authentification. Reserve a
   * SUPER_ADMIN (vision globale, toutes filiales confondues) - pas encore
   * scope par filiale pour ADMIN, voir Doc/architecture-multi-filiale-
   * auth-rbac.md pour le suivi de ce genre de gap.
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('audit-log')
  async getAuditLog(@Query() query: AuditLogQueryDto) {
    return this.authAuditService.findMany(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const presentedToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.logout(req.user, presentedToken);
    clearAuthCookies(res);
    await this.authAuditService.log('LOGOUT', { userId: req.user.id, email: req.user.email, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user est le payload du token JWT, qui contient l'ID de l'utilisateur (sub)
    return this.authService.getProfile(req.user.sub);
  }
}
