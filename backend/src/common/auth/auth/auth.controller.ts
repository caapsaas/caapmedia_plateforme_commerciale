
import { Controller, Post, Body, Patch, Delete, Get, Query, Request, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

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

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.userName, dto.email, dto.password, dto.userRole, dto.subsidiaryId);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.authService.updateUser(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    return this.authService.deleteUser(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Get('users')
  async getAllUsers(@Request() req) {
    return this.authService.getAllUsers(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Get('users/search')
  async searchUsers(@Query() query: SearchUsersDto, @Request() req) {
    return this.authService.searchUsers(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user est le payload du token JWT, qui contient l'ID de l'utilisateur (sub)
    return this.authService.getProfile(req.user.sub);
  }
}
