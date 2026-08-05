import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { EmailService } from 'src/common/utils/email/email.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  AccountingAccessStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import {
  ApproveAccessRequestDto,
  AccessDurationUnit,
} from './dto/approve-access-request.dto';
import { RejectAccessRequestDto } from './dto/reject-access-request.dto';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';

/**
 * Accès temporaire à la comptabilité (JIT) — indépendant du RBAC standard.
 * Voir Doc/module-comptabilite-plan-implementation.md §2.10.
 */
@Injectable()
export class AccountingAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Un ADMIN du siège a l'accès libre. Le SUPER_ADMIN bypasse aussi
   * systématiquement — cohérent avec `checkRole` (son accès omniscient ne
   * dépend jamais du rôle actif ni de la filiale).
   */
  async isHeadquarterAdmin(user: JwtUser): Promise<boolean> {
    const roles = user.roles?.length ? user.roles : [user.role];
    if (roles.includes(UserRole.SUPER_ADMIN)) return true;

    const activeRole = user.activeRole ?? user.role;
    if (activeRole !== UserRole.ADMIN) return false;

    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: user.subsidiaryId },
      select: { isHeadquarter: true },
    });
    return subsidiary?.isHeadquarter ?? false;
  }

  async hasActiveAccess(user: JwtUser): Promise<boolean> {
    if (await this.isHeadquarterAdmin(user)) return true;

    const active = await this.prisma.accountingAccessRequest.findFirst({
      where: {
        userId: user.id,
        status: AccountingAccessStatus.APPROVED,
        expiresAt: { gt: new Date() },
      },
    });
    return !!active;
  }

  async createRequest(user: JwtUser, dto: CreateAccessRequestDto) {
    if (await this.isHeadquarterAdmin(user)) {
      throw new BadRequestException(
        'Vous avez déjà un accès permanent à la comptabilité.',
      );
    }
    if (await this.hasActiveAccess(user)) {
      throw new BadRequestException(
        'Vous avez déjà un accès actif à la comptabilité.',
      );
    }
    const pending = await this.prisma.accountingAccessRequest.findFirst({
      where: { userId: user.id, status: AccountingAccessStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException(
        'Une demande est déjà en attente de validation.',
      );
    }

    const request = await this.prisma.accountingAccessRequest.create({
      data: {
        id: generateId(ID_PREFIXES.ACCOUNTINGACCESSREQUEST),
        userId: user.id,
        justification: dto.justification,
      },
      include: { user: { select: { userName: true, email: true } } },
    });

    await this.notifyHeadquarterAdmins(request);

    return request;
  }

  async approve(id: string, dto: ApproveAccessRequestDto, reviewer: JwtUser) {
    if (!(await this.isHeadquarterAdmin(reviewer))) {
      throw new ForbiddenException(
        'Seul un ADMIN du siège peut approuver un accès comptabilité.',
      );
    }

    const request = await this.prisma.accountingAccessRequest.findUnique({
      where: { id },
      include: { user: { select: { userName: true, email: true } } },
    });
    if (!request) throw new NotFoundException(`Demande "${id}" introuvable.`);
    if (request.status !== AccountingAccessStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const hours =
      dto.unit === AccessDurationUnit.DAYS ? dto.duration * 24 : dto.duration;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const updated = await this.prisma.accountingAccessRequest.update({
      where: { id },
      data: {
        status: AccountingAccessStatus.APPROVED,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        expiresAt,
      },
    });

    await this.notificationsService.notifyUser(request.userId, {
      title: 'Accès comptabilité approuvé',
      message: `Votre accès temporaire à la comptabilité est approuvé jusqu'au ${expiresAt.toLocaleString('fr-FR')}.`,
      type: NotificationType.ACCOUNTING_ACCESS_APPROVED,
      data: { requestId: request.id, expiresAt: expiresAt.toISOString() },
    });
    this.emailService.sendAccountingAccessNotificationEmail(
      request.user.email,
      request.user.userName,
      'Accès comptabilité approuvé',
      `Votre demande d'accès à la comptabilité a été approuvée jusqu'au ${expiresAt.toLocaleString('fr-FR')}.`,
    );

    return updated;
  }

  async reject(id: string, dto: RejectAccessRequestDto, reviewer: JwtUser) {
    if (!(await this.isHeadquarterAdmin(reviewer))) {
      throw new ForbiddenException(
        'Seul un ADMIN du siège peut refuser un accès comptabilité.',
      );
    }

    const request = await this.prisma.accountingAccessRequest.findUnique({
      where: { id },
      include: { user: { select: { userName: true, email: true } } },
    });
    if (!request) throw new NotFoundException(`Demande "${id}" introuvable.`);
    if (request.status !== AccountingAccessStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const updated = await this.prisma.accountingAccessRequest.update({
      where: { id },
      data: {
        status: AccountingAccessStatus.REJECTED,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        rejectionNote: dto.rejectionNote,
      },
    });

    await this.notificationsService.notifyUser(request.userId, {
      title: 'Accès comptabilité refusé',
      message: dto.rejectionNote
        ? `Votre demande d'accès à la comptabilité a été refusée : ${dto.rejectionNote}`
        : "Votre demande d'accès à la comptabilité a été refusée.",
      type: NotificationType.ACCOUNTING_ACCESS_REJECTED,
      data: { requestId: request.id },
    });
    this.emailService.sendAccountingAccessNotificationEmail(
      request.user.email,
      request.user.userName,
      'Accès comptabilité refusé',
      dto.rejectionNote
        ? `Votre demande d'accès à la comptabilité a été refusée : ${dto.rejectionNote}`
        : "Votre demande d'accès à la comptabilité a été refusée.",
    );

    return updated;
  }

  async findAll(user: JwtUser, paginationQuery: PaginationQueryDto = {}) {
    const isHqAdmin = await this.isHeadquarterAdmin(user);
    return paginate(
      this.prisma.accountingAccessRequest,
      {
        where: isHqAdmin ? {} : { userId: user.id },
        orderBy: { requestedAt: 'desc' },
        include: {
          user: { select: { userName: true, email: true } },
          reviewer: { select: { userName: true } },
        },
      },
      paginationQuery,
    );
  }

  async countPending(user: JwtUser): Promise<number> {
    if (!(await this.isHeadquarterAdmin(user))) return 0;
    return this.prisma.accountingAccessRequest.count({
      where: { status: AccountingAccessStatus.PENDING },
    });
  }

  async myStatus(user: JwtUser) {
    if (await this.isHeadquarterAdmin(user)) {
      return { hasAccess: true as const, reason: 'HEADQUARTER_ADMIN' as const };
    }

    const active = await this.prisma.accountingAccessRequest.findFirst({
      where: {
        userId: user.id,
        status: AccountingAccessStatus.APPROVED,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });
    if (active) {
      return {
        hasAccess: true as const,
        reason: 'APPROVED' as const,
        expiresAt: active.expiresAt,
      };
    }

    const pending = await this.prisma.accountingAccessRequest.findFirst({
      where: { userId: user.id, status: AccountingAccessStatus.PENDING },
    });
    if (pending) {
      return {
        hasAccess: false as const,
        reason: 'PENDING' as const,
        requestId: pending.id,
      };
    }

    return { hasAccess: false as const, reason: 'NONE' as const };
  }

  private async notifyHeadquarterAdmins(request: {
    id: string;
    justification: string;
    user: { userName: string };
  }) {
    const admins = await this.prisma.user.findMany({
      where: {
        subsidiary: { isHeadquarter: true },
        OR: [{ userRole: UserRole.ADMIN }, { roles: { has: UserRole.ADMIN } }],
      },
    });

    for (const admin of admins) {
      await this.notificationsService.notifyUser(admin.id, {
        title: "Nouvelle demande d'accès comptabilité",
        message: `${request.user.userName} demande un accès temporaire à la comptabilité : "${request.justification}"`,
        type: NotificationType.ACCOUNTING_ACCESS_REQUESTED,
        data: { requestId: request.id },
      });
      this.emailService.sendAccountingAccessNotificationEmail(
        admin.email,
        admin.userName,
        "Nouvelle demande d'accès comptabilité",
        `${request.user.userName} demande un accès temporaire à la comptabilité.\n\nJustification : ${request.justification}`,
      );
    }
  }
}
