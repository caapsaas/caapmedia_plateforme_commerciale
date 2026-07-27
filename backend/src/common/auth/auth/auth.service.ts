import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { resolveScopeContext } from '../../utils/subsidiary-scope';
import { RefreshTokenService, RequestMeta } from './refresh-token.service';
import { generateId } from '../../utils/generate-id.util';
import { ID_PREFIXES } from '../../constants/id-prefixes.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  //****1- Fonction de creation d'un utilisateur****

  /**
   * SUPER_ADMIN ne peut etre attribue (role principal ou secondaire) que par
   * quelqu'un qui l'est deja - sinon un ADMIN de filiale pourrait se
   * promouvoir (ou promouvoir un tiers) lui-meme via l'API, en contournant
   * le fait que ce role s'attribue normalement a la main, hors UI courante.
   */
  private assertCanAssignSuperAdmin(
    roles: UserRole[],
    currentUser?: { roles?: UserRole[]; role?: UserRole },
  ): void {
    if (!roles.includes(UserRole.SUPER_ADMIN)) return;
    const callerRoles = currentUser?.roles?.length
      ? currentUser.roles
      : currentUser?.role
        ? [currentUser.role]
        : [];
    if (!callerRoles.includes(UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException(
        'Seul un SUPER_ADMIN peut attribuer ce rôle',
      );
    }
  }

  async register(
    userName: string,
    email: string,
    password: string,
    role: UserRole,
    subsidiaryId: string,
    additionalRoles: UserRole[] = [],
    currentUser?: { roles?: UserRole[]; role?: UserRole },
  ) {
    this.assertCanAssignSuperAdmin([role, ...additionalRoles], currentUser);

    // Validation des paramètres requis
    if (!subsidiaryId || subsidiaryId.trim() === '') {
      this.logger.error(
        'Subsidiary ID is required for registration',
        'AuthService',
      );
      throw new BadRequestException('Subsidiary ID is required');
    }

    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${subsidiaryId} not found`,
        'AuthService',
      );
      throw new NotFoundException('Invalid subsidiary ID');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      this.logger.error(
        `User with email ${email} already exists`,
        'AuthService',
      );
      throw new ConflictException('Email already in use');
    }

    // Defensive check: Ensure password is not undefined or null before hashing
    if (!password) {
      this.logger.error('Password is required for registration', 'AuthService');
      throw new BadRequestException('Password is required');
    }

    // Hacher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    const dedupedAdditionalRoles = additionalRoles.filter((r) => r !== role);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        id: generateId(ID_PREFIXES.USER),
        userName,
        email,
        passwordHash,
        userRole: role,
        additionalRoles: dedupedAdditionalRoles,
        // roles[] est la source de verite RBAC cible (voir Doc/architecture-multi-filiale-auth-rbac.md)
        roles: [role, ...dedupedAdditionalRoles],
        subsidiaryId,
      },
    });

    this.logger.log(`User ${email} registered successfully`, 'AuthService');
    return { message: 'User registered successfully', userId: user.id };
  }

  //****2- Fonction de connexion d'un utilisateur****

  async login(email: string, password: string) {
    // Vérifier l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { subsidiary: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      this.logger.error(
        `Invalid credentials for email ${email}`,
        'AuthService',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      // Pas de cookies de session ici: un second facteur est requis avant
      // d'emettre l'access/refresh token. Token intermediaire courte duree,
      // marque par `type: 'pending_2fa'` - JwtStrategy le rejette
      // explicitement s'il est presente comme un access token normal.
      const pendingToken = this.jwtService.sign(
        { sub: user.id, type: 'pending_2fa' },
        { expiresIn: '5m' },
      );
      this.logger.log(`User ${email} password OK, 2FA requise`, 'AuthService');
      return { twoFactorRequired: true as const, pendingToken };
    }

    this.logger.log(`User ${email} logged in successfully`, 'AuthService');
    return {
      twoFactorRequired: false as const,
      user,
      subsidiary: user.subsidiary,
    };
  }

  /**
   * Emet l'access token JWT (courte duree, signe, stateless) et le refresh
   * token (longue duree, stocke hashe en base, revocable) pour un
   * utilisateur deja authentifie. Separe de `login()` pour pouvoir aussi
   * etre appele apres verification 2FA sans re-verifier le mot de passe.
   */
  async issueTokens(
    user: {
      id: string;
      email: string;
      userName: string;
      userRole: UserRole;
      additionalRoles: UserRole[];
      roles: UserRole[];
      activeRole?: UserRole | null;
      subsidiaryId: string;
      twoFactorEnabled: boolean;
    },
    meta: RequestMeta = {},
  ) {
    // roles[] est la source de verite RBAC (backfillee/maintenue en synchro avec userRole+additionalRoles)
    const roles =
      user.roles.length > 0
        ? user.roles
        : [
            user.userRole,
            ...user.additionalRoles.filter((r) => r !== user.userRole),
          ];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.userRole,
      roles,
      subsidiaryId: user.subsidiaryId,
    };
    const accessToken = this.jwtService.sign(payload);
    const { token: refreshToken } = await this.refreshTokenService.issue(
      user.id,
      meta,
    );

    return {
      accessToken,
      refreshToken,
      // userRole (pas seulement role): c'est le champ que le frontend lit
      // partout (types/models.ts::User.userRole) - getProfileUser() (appele
      // au refresh via /auth/Userprofile) le renvoyait deja, mais ce
      // endpoint-ci (login/2FA) ne renvoyait que `role`, jamais `userRole`
      // ni `userName`. Resultat: juste apres une connexion, user.userRole
      // etait undefined (Header affichait "roles.undefined", Sidebar
      // "Aucune vue disponible") jusqu'a ce qu'un refresh recharge le profil
      // via getProfileUser() qui a la bonne forme.
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        userRole: user.userRole,
        role: user.userRole,
        activeRole: user.activeRole ?? user.userRole,
        roles,
        additionalRoles: user.additionalRoles,
        subsidiaryId: user.subsidiaryId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Rotation du refresh token: verifie le token presente, le revoque, en
   * emet un nouveau + un nouvel access token.
   */
  async refresh(presentedRefreshToken: string, meta: RequestMeta = {}) {
    const { userId, issued } = await this.refreshTokenService.rotate(
      presentedRefreshToken,
      meta,
    );
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subsidiary: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    const roles =
      user.roles.length > 0
        ? user.roles
        : [
            user.userRole,
            ...user.additionalRoles.filter((r) => r !== user.userRole),
          ];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.userRole,
      roles,
      subsidiaryId: user.subsidiaryId,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, refreshToken: issued.token };
  }

  //****3- Fonction de reinitialisation de mot de passe****

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.error(`User with email ${email} not found`, 'AuthService');
      throw new NotFoundException('User not found');
    }

    // Ajout d'une vérification pour s'assurer que les variables d'environnement sont chargées
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.error(
        'SMTP credentials (SMTP_USER, SMTP_PASS) are not configured in .env file.',
        'AuthService',
      );
      throw new Error(
        'Email service is not configured. Please check server environment variables.',
      );
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        // Utilisez les variables d'environnement pour les identifiants
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: '"Your App" <no-reply@yourapp.com>',
      to: email,
      subject: 'Password Reset Request',
      text: 'Click the link to reset your password: http://localhost:3000/reset-password?token=some-token',
    });

    this.logger.log(`Password reset email sent to ${email}`, 'AuthService');
    return { message: 'Password reset link sent' };
  }

  //****4- Fonction de mise à jour d'un utilisateur****

  async updateUser(
    id: string,
    data: {
      userName?: string;
      email?: string;
      password?: string;
      userRole?: UserRole;
      additionalRoles?: UserRole[];
      subsidiaryId?: string;
    },
    currentUser: {
      id: string;
      role: UserRole;
      roles?: UserRole[];
      subsidiaryId: string;
    },
  ) {
    // Vérifier si l'utilisateur à mettre à jour existe
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.error(`User with ID ${id} not found`, 'AuthService');
      throw new NotFoundException('User not found');
    }

    if (data.userRole !== undefined || data.additionalRoles !== undefined) {
      this.assertCanAssignSuperAdmin(
        [
          data.userRole ?? user.userRole,
          ...(data.additionalRoles ?? user.additionalRoles),
        ],
        currentUser,
      );
    }

    // Vérifier les autorisations
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to update user ${id}`,
        'AuthService',
      );
      throw new ForbiddenException(
        'You are not authorized to update this user',
      );
    }

    // Vérifier si la nouvelle filiale existe (si fournie)
    if (data.subsidiaryId) {
      const subsidiary = await this.prisma.subsidiary.findUnique({
        where: { id: data.subsidiaryId },
      });
      if (!subsidiary) {
        this.logger.error(
          `Subsidiary with ID ${data.subsidiaryId} not found`,
          'AuthService',
        );
        throw new NotFoundException('Invalid subsidiary ID');
      }
      // Les non-admins ne peuvent pas changer de filiale
      if (
        currentUser.role !== UserRole.ADMIN &&
        user.subsidiaryId !== currentUser.subsidiaryId
      ) {
        this.logger.error(
          `User ${currentUser.id} cannot update subsidiary for user ${id}`,
          'AuthService',
        );
        throw new ForbiddenException(
          'You cannot update the subsidiary of this user',
        );
      }
    }

    // Vérifier si le nouvel email est déjà utilisé (si fourni et différent)
    if (data.email && data.email.trim() !== '' && data.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        this.logger.error(
          `Email ${data.email} is already in use`,
          'AuthService',
        );
        throw new ConflictException('Email already in use');
      }
    }

    // Hacher le mot de passe si fourni
    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    // Dédupliquer les rôles supplémentaires par rapport au rôle principal, et garder
    // roles[] (source de verite RBAC cible) synchronise des qu'un des deux change.
    if (data.additionalRoles !== undefined || data.userRole !== undefined) {
      const primaryRole = data.userRole ?? user.userRole;
      const additionalRoles = (
        data.additionalRoles ?? user.additionalRoles
      ).filter((r) => r !== primaryRole);
      updateData.additionalRoles = additionalRoles;
      updateData.roles = [primaryRole, ...additionalRoles];
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { subsidiary: true },
    });

    this.logger.log(`User ${id} updated successfully`, 'AuthService');
    return {
      id: updatedUser.id,
      userName: updatedUser.userName,
      email: updatedUser.email,
      userRole: updatedUser.userRole,
      additionalRoles: updatedUser.additionalRoles,
      subsidiaryId: updatedUser.subsidiaryId,
    };
  }

  //****5- Fonction de suppression d'un utilisateur****

  async deleteUser(
    id: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si l'utilisateur existe
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.error(`User with ID ${id} not found`, 'AuthService');
      throw new NotFoundException('User not found');
    }

    // Vérifier les autorisations
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to delete user ${id}`,
        'AuthService',
      );
      throw new ForbiddenException(
        'You are not authorized to delete this user',
      );
    }

    // Les non-admins ne peuvent supprimer que leur propre compte
    if (
      currentUser.role !== UserRole.ADMIN &&
      user.subsidiaryId !== currentUser.subsidiaryId
    ) {
      this.logger.error(
        `User ${currentUser.id} cannot delete user from another subsidiary`,
        'AuthService',
      );
      throw new ForbiddenException(
        'You cannot delete a user from another subsidiary',
      );
    }

    // Supprimer l'utilisateur
    await this.prisma.user.delete({ where: { id } });

    this.logger.log(`User ${id} deleted successfully`, 'AuthService');
    return { message: 'User deleted successfully' };
  }

  //****6- Fonction de récupération de tous les utilisateurs****

  async getAllUsers(currentUser: {
    id: string;
    role: UserRole;
    roles?: UserRole[];
    subsidiaryId: string;
  }) {
    // Seul un scope global (SUPER_ADMIN) voit toutes les filiales; ADMIN de filiale est desormais scope a la sienne.
    const ctx = resolveScopeContext(currentUser);
    const where = ctx.hasGlobalScope
      ? {}
      : { subsidiaryId: currentUser.subsidiaryId };

    const users = await this.prisma.user.findMany({
      where,
      include: { subsidiary: true },
      orderBy: { userName: 'asc' },
    });

    this.logger.log(`Retrieved ${users.length} users`, 'AuthService');
    return users.map((user) => ({
      id: user.id,
      userName: user.userName,
      email: user.email,
      userRole: user.userRole,
      additionalRoles: user.additionalRoles,
      subsidiaryId: user.subsidiaryId,
      subsidiary: user.subsidiary
        ? {
            id: user.subsidiary.id,
            subsidiaryName: user.subsidiary.subsidiaryName,
          }
        : null,
    }));
  }

  //****7- Fonction de recherche d'un utilisateur****

  async searchUsers(
    query: { email?: string; userName?: string; userRole?: UserRole },
    currentUser: {
      id: string;
      role: UserRole;
      roles?: UserRole[];
      subsidiaryId: string;
    },
  ) {
    // Construire les conditions de recherche
    // Seul un scope global (SUPER_ADMIN) voit toutes les filiales; ADMIN de filiale est desormais scope a la sienne.
    const ctx = resolveScopeContext(currentUser);
    const where: any = ctx.hasGlobalScope
      ? {}
      : { subsidiaryId: currentUser.subsidiaryId };
    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }
    if (query.userName) {
      where.userName = { contains: query.userName, mode: 'insensitive' };
    }
    if (query.userRole) {
      where.userRole = query.userRole;
      where.userRole = query.userRole;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { subsidiary: true },
      orderBy: { userName: 'asc' },
    });

    this.logger.log(
      `Found ${users.length} users matching query`,
      'AuthService',
    );
    return users.map((user) => ({
      id: user.id,
      userName: user.userName,
      email: user.email,
      userRole: user.userRole,
      additionalRoles: user.additionalRoles,
      subsidiaryId: user.subsidiaryId,
      subsidiary: user.subsidiary
        ? {
            id: user.subsidiary.id,
            subsidiaryName: user.subsidiary.subsidiaryName,
          }
        : null,
    }));
  }

  //****8- Fonction de déconnexion d'un utilisateur****

  async logout(user: { email: string }, presentedRefreshToken?: string) {
    // Le refresh token est revoque en base (contrairement a l'access token JWT
    // stateless, qui reste techniquement valide jusqu'a son expiration courte
    // de 15 min - c'est le refresh token revoque qui empeche une nouvelle
    // session d'etre prolongee au-dela).
    if (presentedRefreshToken) {
      await this.refreshTokenService.revoke(presentedRefreshToken);
    }
    this.logger.log(
      `User ${user.email} logged out successfully`,
      'AuthService',
    );
    return { message: 'Logged out successfully' };
  }

  async getProfileUser(user: {
    id: string;
    email: string;
    role: UserRole;
    subsidiaryId: string;
  }) {
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: user.subsidiaryId },
    });

    // Récupérer l'utilisateur complet depuis la base de données pour inclure userName
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        userName: true,
        email: true,
        userRole: true,
        additionalRoles: true,
        roles: true,
        activeRole: true,
        subsidiaryId: true,
        twoFactorEnabled: true,
      },
    });

    if (!fullUser) {
      throw new Error('User not found');
    }

    // Mapper userRole -> role pour correspondre au frontend
    const mappedUser = {
      ...fullUser,
      role: fullUser.userRole,
      activeRole: fullUser.activeRole ?? fullUser.userRole,
    };

    this.logger.log(`Profile retrieved for user ${user.email}`, 'AuthService');
    return {
      user: mappedUser,
      subsidiary: subsidiary,
    };
  }

  /**
   * Change le role actif d'un utilisateur multi-role (POST /auth/switch-role).
   * Ne fait QUE mettre a jour activeRole en base - pas besoin de re-emettre
   * l'access token, JwtStrategy relit activeRole depuis la DB a chaque
   * requete (voir jwt.strategy.ts), donc le changement est effectif des la
   * prochaine requete.
   */
  async switchRole(userId: string, requestedRole: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const availableRoles =
      user.roles.length > 0
        ? user.roles
        : [
            user.userRole,
            ...user.additionalRoles.filter((r) => r !== user.userRole),
          ];

    if (!availableRoles.includes(requestedRole)) {
      throw new ForbiddenException('Vous ne possédez pas ce rôle');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: requestedRole },
      select: {
        id: true,
        userName: true,
        email: true,
        userRole: true,
        additionalRoles: true,
        roles: true,
        activeRole: true,
        subsidiaryId: true,
        twoFactorEnabled: true,
      },
    });

    this.logger.log(
      `User ${user.email} switched active role to ${requestedRole}`,
      'AuthService',
    );
    return {
      user: {
        ...updated,
        role: updated.userRole,
        activeRole: updated.activeRole ?? updated.userRole,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        email: true,
        userRole: true,
        subsidiaryId: true,
        subsidiary: {
          select: {
            id: true,
            subsidiaryName: true,
            logoSvg: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.error(
        `Profile for user ID ${userId} not found`,
        'AuthService',
      );
      throw new NotFoundException('User profile not found');
    }

    this.logger.log(`Profile retrieved for user ${user.email}`, 'AuthService');
    return user;
  }

  // ✅ C'est la méthode à ajouter pour la JwtStrategy
  async findOneById(id: string) {
    // Cette méthode est utilisée par la stratégie JWT pour valider le token
    // et attacher l'utilisateur à la requête.
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { subsidiary: true }, // Inclure la filiale pour avoir toutes les infos
    });
    // La stratégie se chargera de retirer le mot de passe.
    return user;
  }
}
