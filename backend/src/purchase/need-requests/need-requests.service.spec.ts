import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { NeedRequestsService } from './need-requests.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { NeedDecision } from './dto/need-request.dto';

describe('NeedRequestsService', () => {
  const commercial: JwtUser = {
    id: 'commercial',
    email: 'c@test.com',
    role: UserRole.COMMERCIAL,
    activeRole: UserRole.COMMERCIAL,
    roles: [UserRole.COMMERCIAL],
    subsidiaryId: 'branch-a',
  };
  const admin: JwtUser = {
    ...commercial,
    id: 'admin',
    role: UserRole.SUPER_ADMIN,
    activeRole: UserRole.SUPER_ADMIN,
    roles: [UserRole.SUPER_ADMIN],
  };
  const dto = {
    title: 'Besoin matériel',
    description: 'Matériel pour une campagne commerciale',
  };
  const delegate = {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const prisma = {
    needRequest: delegate,
    user: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const notifications = { createNotification: jest.fn(), publish: jest.fn() };
  let service: NeedRequestsService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new NeedRequestsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      { enqueue: jest.fn() } as unknown as AccountingOutboxService,
    );
    prisma.user.findMany.mockResolvedValue([{ id: 'super-admin' }]);
    delegate.create.mockResolvedValue({
      id: 'need',
      title: dto.title,
      subsidiaryId: 'branch-a',
      requester: { userName: 'Commercial' },
      subsidiary: { subsidiaryName: 'Agence A' },
    });
    notifications.createNotification.mockResolvedValue({
      id: 'notification',
      recipientId: 'super-admin',
    });
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => callback(prisma),
    );
    delegate.findUnique.mockResolvedValue({
      id: 'need',
      title: 'Besoin matériel',
      requesterId: 'requester-b',
      subsidiaryId: 'branch-b',
    });
    delegate.updateMany.mockResolvedValue({ count: 1 });
    delegate.findUniqueOrThrow.mockResolvedValue({
      id: 'need',
      status: 'APPROVED',
      rejectionReason: 'Budget insuffisant',
    });
  });
  it('scopes commercial reads to the requester and subsidiary', () => {
    void service.findAll(commercial);
    expect(delegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subsidiaryId: 'branch-a', requesterId: 'commercial' },
      }),
    );
  });
  it('allows a super-admin to read all subsidiaries', () => {
    void service.findAll(admin);
    expect(delegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
  it('denies unrelated roles and inactive commercial roles', () => {
    expect(() =>
      service.findAll({ ...commercial, activeRole: UserRole.ADMIN }),
    ).toThrow(ForbiddenException);
    expect(() =>
      service.create({ ...commercial, activeRole: UserRole.ADMIN }, dto),
    ).toThrow(ForbiddenException);
    expect(() => service.create(admin, dto)).toThrow(ForbiddenException);
  });
  it('derives ownership from authentication', async () => {
    await service.create(commercial, dto);
    expect(delegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterId: 'commercial',
          subsidiaryId: 'branch-a',
        }) as unknown,
      }),
    );
  });
  it('notifies all super-admins across branches and publishes after commit', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'headquarter-admin' },
      { id: 'secondary-admin' },
    ]);
    await service.create(commercial, dto);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userRole: UserRole.SUPER_ADMIN },
          { roles: { has: UserRole.SUPER_ADMIN } },
          { additionalRoles: { has: UserRole.SUPER_ADMIN } },
        ],
      },
      select: { id: true },
    });
    expect(notifications.createNotification).toHaveBeenCalledTimes(2);
    expect(notifications.createNotification).toHaveBeenCalledWith(
      'headquarter-admin',
      expect.objectContaining({
        type: 'SYSTEM_ALERT',
        data: {
          event: 'need.created',
          requestId: 'need',
          subsidiaryId: 'branch-a',
        },
      }),
      prisma,
    );
    expect(notifications.publish).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction.mock.invocationCallOrder[0]).toBeLessThan(
      notifications.publish.mock.invocationCallOrder[0],
    );
  });
  it('waits for the transaction to commit before realtime publication', async () => {
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const result = await callback(prisma);
        expect(notifications.createNotification).toHaveBeenCalledTimes(1);
        expect(notifications.publish).not.toHaveBeenCalled();
        return result;
      },
    );
    await service.create(commercial, dto);
    expect(notifications.publish).toHaveBeenCalledTimes(1);
  });
  it('does not publish a notification if the transaction fails', async () => {
    prisma.$transaction.mockRejectedValue(new Error('transaction failed'));
    await expect(service.create(commercial, dto)).rejects.toThrow(
      'transaction failed',
    );
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('fails the transaction if notification persistence fails', async () => {
    notifications.createNotification.mockRejectedValue(
      new Error('notification failed'),
    );
    await expect(service.create(commercial, dto)).rejects.toThrow(
      'notification failed',
    );
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('denies reviews by a commercial', async () => {
    await expect(
      service.review(commercial, 'need', { status: NeedDecision.APPROVED }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('requires a nonblank rejection reason', async () => {
    await expect(
      service.review(admin, 'need', {
        status: NeedDecision.REJECTED,
        rejectionReason: '  ',
      }),
    ).rejects.toThrow(BadRequestException);
  });
  it('records reviewer and decision with a pending-state condition', async () => {
    await service.review(admin, 'need', {
      status: NeedDecision.REJECTED,
      rejectionReason: ' Budget insuffisant ',
    });
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: { id: 'need', subsidiaryId: 'branch-b', status: 'PENDING' },
      data: {
        status: 'REJECTED',
        reviewerId: 'admin',
        reviewedAt: expect.any(Date) as unknown,
        rejectionReason: 'Budget insuffisant',
      },
    });
  });
  it.each([
    {
      status: NeedDecision.APPROVED,
      event: 'need.approved',
      title: 'Expression de besoin validée',
    },
    {
      status: NeedDecision.REJECTED,
      event: 'need.rejected',
      title: 'Expression de besoin rejetée',
    },
  ])(
    'notifies only the original requester after a $status decision',
    async ({ status, event, title }) => {
      const updated = {
        id: 'need',
        status,
        rejectionReason:
          status === NeedDecision.REJECTED ? 'Budget insuffisant' : null,
      };
      delegate.findUniqueOrThrow.mockResolvedValue(updated);
      const result = await service.review(admin, 'need', {
        status,
        rejectionReason: ' Budget insuffisant ',
      });
      expect(result).toEqual(updated);
      expect(notifications.createNotification).toHaveBeenCalledTimes(1);
      expect(notifications.createNotification).toHaveBeenCalledWith(
        'requester-b',
        expect.objectContaining({
          title,
          type: 'SYSTEM_ALERT',
          data: { event, requestId: 'need', subsidiaryId: 'branch-b' },
        }),
        prisma,
      );
      if (status === NeedDecision.REJECTED) {
        expect(notifications.createNotification).toHaveBeenCalledWith(
          'requester-b',
          expect.objectContaining({
            message: expect.stringContaining(
              'Motif : Budget insuffisant',
            ) as unknown,
          }),
          prisma,
        );
      }
      expect(notifications.publish).toHaveBeenCalledTimes(1);
    },
  );
  it('persists the decision and notification before sending realtime updates', async () => {
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const result = await callback(prisma);
        expect(delegate.updateMany).toHaveBeenCalledTimes(1);
        expect(notifications.createNotification).toHaveBeenCalledTimes(1);
        expect(notifications.publish).not.toHaveBeenCalled();
        return result;
      },
    );
    await service.review(admin, 'need', { status: NeedDecision.APPROVED });
    expect(notifications.publish).toHaveBeenCalledTimes(1);
  });
  it('fails the decision transaction if notification persistence fails', async () => {
    notifications.createNotification.mockRejectedValue(
      new Error('notification failed'),
    );
    await expect(
      service.review(admin, 'need', { status: NeedDecision.APPROVED }),
    ).rejects.toThrow('notification failed');
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('rejects duplicate or concurrent decisions', async () => {
    delegate.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.review(admin, 'need', { status: NeedDecision.APPROVED }),
    ).rejects.toThrow(ConflictException);
    expect(notifications.createNotification).not.toHaveBeenCalled();
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('returns not found for an unknown request', async () => {
    delegate.findUnique.mockResolvedValue(null);
    await expect(
      service.review(admin, 'missing', { status: NeedDecision.APPROVED }),
    ).rejects.toThrow(NotFoundException);
  });
});
