import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UtilsModule } from '../utils/utils.module';
import { RoleGuard } from './role/role.guard';
import { SubsidiaryGuard } from './subsidiary/subsidiary.guard';
import { AuthController } from './auth/auth.controller';
import { RefreshTokenService } from './auth/refresh-token.service';
import { TwoFactorController } from './two-factor/two-factor.controller';
import { TwoFactorService } from './two-factor/two-factor.service';

@Module({
  imports: [
    UtilsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // Access token courte duree: c'est le refresh token (httpOnly, stocke
      // hashe en base, revocable) qui porte la duree de session reelle.
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, JwtStrategy, RoleGuard, SubsidiaryGuard, RefreshTokenService, TwoFactorService],
  exports: [AuthService, JwtModule, RoleGuard, SubsidiaryGuard, RefreshTokenService, TwoFactorService],
})
export class AuthModule {}
