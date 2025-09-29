import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import * as bcrypt from 'bcryptjs'; // Assurez-vous que bcryptjs est bien utilisé
import { UserRole } from 'generated/prisma'; 



@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async register(
    userName: string,
    email: string,
    password: string,
    role: UserRole,
    subsidiaryId: string,
  ) {
    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      this.logger.error(`Subsidiary with ID ${subsidiaryId} not found`, 'AuthService');
      throw new NotFoundException('Invalid subsidiary ID');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.logger.error(`User with email ${email} already exists`, 'AuthService');
      throw new ConflictException('Email already in use');
    }

    // Hacher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        userName,
        email,
        passwordHash,
        userRole: role,
        subsidiaryId,
      },
    });

    this.logger.log(`User ${email} registered successfully`, 'AuthService');
    return { message: 'User registered successfully', userId: user.id };
  }

  async login(email: string, password: string) {
    // Vérifier l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { subsidiary: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      this.logger.error(`Invalid credentials for email ${email}`, 'AuthService');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Générer le token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.userRole,
      subsidiaryId: user.subsidiaryId,
    };
    const token = this.jwtService.sign(payload);

    this.logger.log(`User ${email} logged in successfully`, 'AuthService');
    return {
      access_token: token,
      user: { id: user.id, email: user.email, role: user.userRole, subsidiaryId: user.subsidiaryId },
    };
  }
}