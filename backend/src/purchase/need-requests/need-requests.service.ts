import { randomUUID } from 'node:crypto';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { PayNeedRequestDto } from './dto/pay-need-request.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  NeedRequestStatus,
  NotificationType,
  Prisma,
  TransactionStatus,
  TransactionType,
  TreasuryTransactionType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  getActiveRole,
  isSuperAdmin,
} from '../../common/auth/role/role-identity';
import {
  CreateNeedRequestDto,
  NeedDecision,
  ReviewNeedRequestDto,
} from './dto/need-request.dto';

const details = {
  payment: {
    include: {
      paidBy: { select: { id: true, userName: true } },
      financialTransaction: {
        select: {
          treasuryAccount: { select: { id: true, accountName: true } },
        },
      },
    },
  },
  requester: { select: { id: true, userName: true } },
  reviewer: { select: { id: true, userName: true } },
  subsidiary: { select: { id: true, subsidiaryName: true } },
};

@Injectable()
export class NeedRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  private assertAccess(user: JwtUser) {
    if (!isSuperAdmin(user) && getActiveRole(user) !== UserRole.COMMERCIAL) {
      throw new ForbiddenException(
        'Accès réservé au commercial et au super-admin.',
      );
    }
  }

  findAll(user: JwtUser) {
    this.assertAccess(user);
    return this.prisma.needRequest.findMany({
      where: isSuperAdmin(user)
        ? {}
        : { subsidiaryId: user.subsidiaryId, requesterId: user.id },
      include: details,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(user: JwtUser, dto: CreateNeedRequestDto) {
    if (getActiveRole(user) !== UserRole.COMMERCIAL || isSuperAdmin(user)) {
      throw new ForbiddenException(
        'Seul le commercial peut soumettre une expression de besoin.',
      );
    }
    return this.createAndNotify(user, dto);
  }

  private async createAndNotify(user: JwtUser, dto: CreateNeedRequestDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.needRequest.create({
        data: {
          ...dto,
          desiredDate: dto.desiredDate ? new Date(dto.desiredDate) : undefined,
          subsidiaryId: user.subsidiaryId,
          requesterId: user.id,
        },
        include: details,
      });
      // Super-admins supervise every branch, including when another role is active.
      const admins = await tx.user.findMany({
        where: {
          OR: [
            { userRole: UserRole.SUPER_ADMIN },
            { roles: { has: UserRole.SUPER_ADMIN } },
            { additionalRoles: { has: UserRole.SUPER_ADMIN } },
          ],
        },
        select: { id: true },
      });
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.notifications.createNotification(
            admin.id,
            {
              title: 'Nouvelle expression de besoin',
              message: `${request.requester.userName} (${request.subsidiary.subsidiaryName}) a soumis « ${request.title} ».`,
              type: NotificationType.SYSTEM_ALERT,
              data: {
                event: 'need.created',
                requestId: request.id,
                subsidiaryId: request.subsidiaryId,
              },
            },
            tx,
          ),
        ),
      );
      return { request, notifications };
    });
    for (const notification of result.notifications)
      this.notifications.publish(notification);
    return result.request;
  }

  private assertPayer(user: JwtUser) {
    if (!isSuperAdmin(user))
      throw new ForbiddenException(
        'Seul le super-admin peut régler une expression de besoin.',
      );
  }

  async paymentAccount(user: JwtUser, id: string) {
    this.assertPayer(user);
    const request = await this.prisma.needRequest.findUnique({ where: { id } });
    if (!request)
      throw new NotFoundException('Expression de besoin introuvable.');
    return this.resolveExpenseBox(this.prisma, request.subsidiaryId);
  }

  private async resolveExpenseBox(
    tx: Prisma.TransactionClient,
    subsidiaryId: string,
  ) {
    const accounts = await tx.treasuryAccount.findMany({
      where: { subsidiaryId, accountType: AccountType.EXPENSE_BOX },
      take: 2,
      select: { id: true, accountName: true, balance: true, currency: true },
    });
    if (!accounts.length)
      throw new BadRequestException(
        'Aucune caisse de dépense configurée pour la filiale de cette demande.',
      );
    if (accounts.length !== 1)
      throw new ConflictException(
        'Plusieurs caisses de dépense existent pour cette filiale. Corrigez la configuration avant de régler.',
      );
    return accounts[0];
  }

  async pay(user: JwtUser, id: string, dto: PayNeedRequestDto) {
    this.assertPayer(user);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => {
            const request = await tx.needRequest.findUnique({
              where: { id },
              include: { payment: true },
            });
            if (!request)
              throw new NotFoundException('Expression de besoin introuvable.');
            if (request.status !== NeedRequestStatus.APPROVED)
              throw new BadRequestException(
                'Seule une expression validée peut être réglée.',
              );
            if (request.payment)
              throw new ConflictException(
                'Cette expression de besoin est déjà réglée.',
              );
            const account = await this.resolveExpenseBox(
              tx,
              request.subsidiaryId,
            );
            const amount = new Prisma.Decimal(dto.amount);
            const debit = await tx.treasuryAccount.updateMany({
              where: {
                id: account.id,
                subsidiaryId: request.subsidiaryId,
                accountType: AccountType.EXPENSE_BOX,
                balance: { gte: amount },
              },
              data: { balance: { decrement: amount } },
            });
            if (debit.count !== 1)
              throw new BadRequestException(
                'Solde insuffisant dans la caisse de dépense de cette filiale.',
              );
            const updatedAccount = await tx.treasuryAccount.findUniqueOrThrow({
              where: { id: account.id },
            });
            const transaction = await tx.financialTransaction.create({
              data: {
                id: randomUUID(),
                transactionDate: new Date(dto.transactionDate),
                description: `Règlement expression de besoin : ${request.title}`,
                amount,
                relatedDocumentId: request.id,
                subsidiaryId: request.subsidiaryId,
                financialTransactionType: TransactionType.DEPENSE,
                treasuryAccountId: account.id,
                sourceAccountId: account.id,
                status: TransactionStatus.VALIDE,
                treasuryType: TreasuryTransactionType.OTHER_EXPENSE,
                reference: dto.reference || `BES-${request.id}`,
                providerName: dto.beneficiary,
                balanceAfterSource: updatedAccount.balance,
              },
            });
            await tx.needRequestPayment.create({
              data: {
                needRequestId: request.id,
                financialTransactionId: transaction.id,
                amount,
                currency: account.currency,
                beneficiary: dto.beneficiary,
                category: dto.category,
                reference: dto.reference || `BES-${request.id}`,
                paidAt: new Date(dto.transactionDate),
                paidById: user.id,
              },
            });
            await this.accountingOutbox.enqueue(tx, {
              eventType: 'TREASURY_EXPENSE',
              subsidiaryId: request.subsidiaryId,
              payload: {
                userId: user.id,
                operationDate: new Date(dto.transactionDate).toISOString(),
                amount: dto.amount,
                description: transaction.description,
                sourceId: transaction.id,
                accountType: AccountType.EXPENSE_BOX,
                expenseCategory: dto.category,
                withTva: false,
              },
            });
            const notification = await this.notifications.createNotification(
              request.requesterId,
              {
                title: 'Expression de besoin réglée',
                message: `Votre demande « ${request.title} » a été réglée à hauteur de ${amount.toString()} ${account.currency} depuis la caisse de dépense.`,
                type: NotificationType.SYSTEM_ALERT,
                data: {
                  event: 'need.paid',
                  requestId: request.id,
                  subsidiaryId: request.subsidiaryId,
                },
              },
              tx,
            );
            return {
              request: await tx.needRequest.findUniqueOrThrow({
                where: { id },
                include: details,
              }),
              notification,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        this.notifications.publish(result.notification);
        return result.request;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2034' && attempt < 2) continue;
          if (error.code === 'P2002')
            throw new ConflictException(
              'Cette expression de besoin est déjà réglée.',
            );
          if (error.code === 'P2034')
            throw new ConflictException(
              'Un autre paiement est en cours. Veuillez actualiser puis réessayer.',
            );
        }
        throw error;
      }
    }
    throw new ConflictException('Impossible de finaliser le paiement.');
  }

  async review(user: JwtUser, id: string, dto: ReviewNeedRequestDto) {
    if (!isSuperAdmin(user))
      throw new ForbiddenException('Décision réservée au super-admin.');
    if (dto.status === NeedDecision.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Le motif de rejet est obligatoire.');
    }
    // Compare-and-set prevents two administrators from deciding the same request.
    const reviewed = await this.prisma.$transaction(async (tx) => {
      const request = await tx.needRequest.findUnique({ where: { id } });
      if (!request)
        throw new NotFoundException('Expression de besoin introuvable.');
      const result = await tx.needRequest.updateMany({
        where: {
          id,
          subsidiaryId: request.subsidiaryId,
          status: NeedRequestStatus.PENDING,
        },
        data: {
          status: dto.status,
          reviewerId: user.id,
          reviewedAt: new Date(),
          rejectionReason:
            dto.status === NeedDecision.REJECTED
              ? dto.rejectionReason.trim()
              : null,
        },
      });
      if (!result.count)
        throw new ConflictException('Cette demande a déjà été traitée.');
      const updated = await tx.needRequest.findUniqueOrThrow({
        where: { id },
        include: details,
      });
      const rejected = dto.status === NeedDecision.REJECTED;
      const notification = await this.notifications.createNotification(
        request.requesterId,
        {
          title: rejected
            ? 'Expression de besoin rejetée'
            : 'Expression de besoin validée',
          message: rejected
            ? `Votre demande « ${request.title} » a été rejetée. Motif : ${updated.rejectionReason}`
            : `Votre demande « ${request.title} » a été validée par le super-admin.`,
          type: NotificationType.SYSTEM_ALERT,
          data: {
            event: rejected ? 'need.rejected' : 'need.approved',
            requestId: request.id,
            subsidiaryId: request.subsidiaryId,
          },
        },
        tx,
      );
      return { request: updated, notification };
    });
    this.notifications.publish(reviewed.notification);
    return reviewed.request;
  }
}
