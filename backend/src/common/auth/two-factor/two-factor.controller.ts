import {
  Controller,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { TwoFactorService } from './two-factor.service';
import { AuthService } from '../auth/auth.service';
import { setAuthCookies, setCsrfCookie } from '../cookie.util';

class TwoFactorCodeDto {
  @IsString()
  @MinLength(6)
  code: string;
}

class TwoFactorDisableDto {
  @IsString()
  password: string;

  @IsString()
  @MinLength(6)
  code: string;
}

class TwoFactorLoginDto {
  @IsString()
  pendingToken: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  recoveryCode?: string;
}

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Genere un nouveau secret TOTP + QR code. Le secret est deja persiste en
   * base mais twoFactorEnabled reste false tant que /verify n'a pas confirme
   * que l'utilisateur a bien scanne le QR code (sinon un secret jamais
   * confirme pourrait verrouiller le compte).
   */
  @UseGuards(JwtAuthGuard)
  @Post('setup')
  async setup(@Request() req) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.twoFactorEnabled) throw new ConflictException('La double authentification est deja activee');

    const secret = this.twoFactorService.generateSecret();
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

    const qrCodeDataUrl = await this.twoFactorService.generateQrCodeDataUrl(user.email, secret);
    return { qrCodeDataUrl, secret };
  }

  /**
   * Confirme l'activation avec un premier code TOTP valide. Genere et
   * renvoie les codes de secours en clair - unique moment ou ils sont
   * visibles, seul leur hash est conserve ensuite.
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Request() req, @Body() dto: TwoFactorCodeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Aucune configuration 2FA en attente - appelez /auth/2fa/setup d\'abord');
    }

    const isValid = await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code);
    if (!isValid) throw new UnauthorizedException('Code invalide');

    const recoveryCodes = this.twoFactorService.generateRecoveryCodes();
    const hashedCodes = recoveryCodes.map((c) => this.twoFactorService.hashRecoveryCode(c));

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorRecoveryCodes: hashedCodes },
    });

    return { message: 'Double authentification activee', recoveryCodes };
  }

  /**
   * Desactivation: exige le mot de passe ET un code TOTP valide (double
   * confirmation car cela reduit la securite du compte).
   */
  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Request() req, @Body() dto: TwoFactorDisableDto) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }
    if (!user.twoFactorSecret || !(await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code))) {
      throw new UnauthorizedException('Code invalide');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: [] },
    });

    return { message: 'Double authentification desactivee' };
  }

  /**
   * Deuxieme etape du login quand twoFactorEnabled: echange le pendingToken
   * (obtenu apres verification du mot de passe) + un code TOTP ou un code de
   * secours contre une session complete (cookies httpOnly).
   */
  @Post('login')
  async login(@Body() dto: TwoFactorLoginDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    if (!dto.code && !dto.recoveryCode) {
      throw new BadRequestException('code ou recoveryCode requis');
    }

    let payload: { sub: string; type?: string };
    try {
      payload = this.jwtService.verify(dto.pendingToken);
    } catch {
      throw new UnauthorizedException('Session 2FA expiree, reconnectez-vous');
    }
    if (payload.type !== 'pending_2fa') {
      throw new UnauthorizedException('Token invalide');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { subsidiary: true } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Session invalide');
    }

    let authenticated = false;
    if (dto.code) {
      authenticated = await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code);
    } else if (dto.recoveryCode) {
      const hashed = this.twoFactorService.hashRecoveryCode(dto.recoveryCode);
      if (user.twoFactorRecoveryCodes.includes(hashed)) {
        authenticated = true;
        // Usage unique: le code consomme est retire immediatement.
        await this.prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: user.twoFactorRecoveryCodes.filter((c) => c !== hashed) },
        });
      }
    }

    if (!authenticated) throw new UnauthorizedException('Code invalide');

    const { accessToken, refreshToken, user: userPayload } = await this.authService.issueTokens(user, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, refreshToken);
    setCsrfCookie(res);
    return { user: userPayload, subsidiary: user.subsidiary };
  }
}
