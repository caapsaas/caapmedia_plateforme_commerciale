import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UtilsModule } from '../utils/utils.module';
import { RoleGuard } from './role/role.guard';
import { SubsidiaryGuard } from './subsidiary/subsidiary.guard';import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    UtilsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RoleGuard, SubsidiaryGuard],
  exports: [AuthService, JwtModule, RoleGuard, SubsidiaryGuard],
})
export class AuthModule {}
