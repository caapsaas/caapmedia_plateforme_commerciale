
import { Controller, Post, Body, Patch, Delete, Get, Query, Request, UseGuards, Param, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsUUID, IsEnum, IsArray, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.SUPER_ADMIN])
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.userName, dto.email, dto.password, dto.userRole, dto.subsidiaryId, dto.additionalRoles ?? []);
  }


  @Post('login')
  async login(@Body() dto: LoginDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    if (result.twoFactorRequired) {
      // Pas de cookies: le client doit d'abord completer POST /auth/2fa/login
      return { twoFactorRequired: true, pendingToken: result.pendingToken };
    }
    const { accessToken, refreshToken, user: userPayload } = await this.authService.issueTokens(result.user, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, refreshToken);
    setCsrfCookie(res);
    return { twoFactorRequired: false, user: userPayload, subsidiary: result.subsidiary };
  }

  /**
   * Rotation du refresh token: le cookie httpOnly refresh_token (non lisible
   * en JS) est envoye automatiquement par le navigateur sur cette route
   * (path restreint a /api-caapmedia/auth, voir cookie.util.ts).
   */
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

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('Userprofile')
  async getProfileUser(@Request() req) {
    // req.user contient le payload du token JWT, qui inclut l'ID (sub), l'email, etc.
    // Nous passons cet objet directement à notre nouvelle méthode de service.
    return this.authService.getProfileUser(req.user);
  }
  

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR])
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.authService.updateUser(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR])
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    return this.authService.deleteUser(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR])
  @Get('users')
  async getAllUsers(@Request() req) {
    return this.authService.getAllUsers(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.HR_MANAGER, UserRole.FINANCIAL_DIRECTOR])
  @Get('users/search')
  async searchUsers(@Query() query: SearchUsersDto, @Request() req) {
    return this.authService.searchUsers(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const presentedToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.logout(req.user, presentedToken);
    clearAuthCookies(res);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user est le payload du token JWT, qui contient l'ID de l'utilisateur (sub)
    return this.authService.getProfile(req.user.sub);
  }
}
