import { Controller, Post, Body, Get, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { SubsidiaryGuard } from '../subsidiary/subsidiary.guard';
import { IsEmail, IsString, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from 'generated/prisma';

class RegisterDto {
  @IsString()
  userName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  userRole: UserRole;

  @IsUUID()
  subsidiaryId: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.userName,
      dto.email,
      dto.password,
      dto.userRole,
      dto.subsidiaryId,
    );
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  getProtected() {
    return { message: 'This is a protected route for ADMIN' };
  }

  @Get('subsidiary-protected')
  @UseGuards(JwtAuthGuard, SubsidiaryGuard)
  @SetMetadata('subsidiaryId', 'some-uuid-here') // Remplacez par un UUID valide
  getSubsidiaryProtected() {
    return { message: 'This is a subsidiary-protected route' };
  }
}