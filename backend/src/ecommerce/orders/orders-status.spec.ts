import { EntriesService } from '../../accounting/entries/entries.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  TransactionStatus,
  TransactionType,
  CashRemittanceStatus,
  PaymentStatus,
  ProductionStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Order cancellation after production', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const statusChanged = jest.fn();
  const tx = {
    order: { update },
    financialTransaction: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    cashRemittanceOrder: { deleteMany: jest.fn(), findUnique: jest.fn() },
    cashRemittance: { update: jest.fn() },
    cashRemittanceReceipt: { deleteMany: jest.fn() },
    sale: { findMany: jest.fn(), deleteMany: jest.fn() },
    treasuryAccount: { update: jest.fn() },
    accountingOutboxEntry: { deleteMany: jest.fn() },
    journalEntry: { findMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
  };
  const reversePostedEntry = jest.fn();
  const prisma = {
    order: { findUnique, update },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
  };
  const service = new OrdersService(
    prisma as unknown as PrismaService,
    {} as ProductSpecsService,
    { statusChanged } as unknown as OrderNotificationsService,
    { reversePostedEntry } as unknown as EntriesService,
  );
  const user = {
    id: 'staff',
    subsidiaryId: 'branch',
    activeRole: UserRole.CAISSIER,
  };
  const details = {
    subsidiaryId: 'branch',
    productionStatus: ProductionStatus.PREPRESS,
    paymentStatus: PaymentStatus.UNPAID,
    amountPaid: new Decimal(0),
    totalAmount: new Decimal(100),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.financialTransaction.findMany.mockResolvedValue([]);
    tx.sale.findMany.mockResolvedValue([]);
    tx.treasuryAccount.update.mockResolvedValue({ balance: new Decimal(60) });
    tx.journalEntry.findMany.mockResolvedValue([]);
  });

  it.each([
    OrderStatus.IN_PRODUCTION,
    OrderStatus.PENDING_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
  ])('rejects reverting %s to a pre-production state', async (status) => {
    findUnique.mockResolvedValue({ id: 'order', status, ...details });
    for (const target of [OrderStatus.NEW, OrderStatus.PENDING_VALIDATION]) {
      await expect(
        service.updateOrderStatus('order', { status: target }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    }
    expect(update).not.toHaveBeenCalled();
    expect(statusChanged).not.toHaveBeenCalled();
  });

  it.each(
    Object.values(OrderStatus).filter(
      (status) => status !== OrderStatus.CANCELLED,
    ),
  )('allows cancellation at stage %s', async (status) => {
    findUnique.mockResolvedValue({ id: 'order', status, ...details });
    update.mockResolvedValue({ id: 'order', status: OrderStatus.CANCELLED });
    await service.updateOrderStatus(
      'order',
      { status: OrderStatus.CANCELLED, cancellationReason: 'Erreur client' },
      user,
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'order',
          subsidiaryId: 'branch',
          status,
        }) as unknown,
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: 'Erreur client',
          amountPaid: 0,
          paymentStatus: PaymentStatus.UNPAID,
          paymentMethod: null,
        },
      }),
    );
  });

  it('requires a non-blank cancellation reason', async () => {
    findUnique.mockResolvedValue({
      id: 'order',
      status: OrderStatus.COMPLETED,
      ...details,
    });
    await expect(
      service.updateOrderStatus(
        'order',
        {
          status: OrderStatus.CANCELLED,
          cancellationReason: '  ',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('keeps settled credits and records debits for cash, received remittances and bank payments', async () => {
    findUnique.mockResolvedValue({
      ...details,
      id: 'order',
      status: OrderStatus.COMPLETED,
      amountPaid: new Decimal(100),
      paymentStatus: PaymentStatus.PAID,
    });
    update.mockResolvedValue({ id: 'order', status: OrderStatus.CANCELLED });
    tx.financialTransaction.findMany.mockResolvedValue([
      {
        id: 'cash',
        status: TransactionStatus.VALIDE,
        amount: new Decimal(40),
        treasuryAccountId: 'register',
        cashRemittanceReceipts: [],
      },
      {
        id: 'remitted',
        status: TransactionStatus.VALIDE,
        amount: new Decimal(20),
        treasuryAccountId: 'register',
        cashRemittanceReceipts: [
          {
            cashRemittance: {
              id: 'received',
              status: CashRemittanceStatus.RECEIVED,
              subsidiaryId: 'branch',
              sourceCashRegisterId: 'register',
              destinationSafeId: 'safe',
            },
          },
        ],
      },
      {
        id: 'submitted',
        status: TransactionStatus.VALIDE,
        amount: new Decimal(10),
        treasuryAccountId: 'register',
        cashRemittanceReceipts: [
          {
            cashRemittance: {
              id: 'awaiting-receipt',
              status: CashRemittanceStatus.SUBMITTED,
              declaredAmount: new Decimal(50),
              subsidiaryId: 'branch',
              sourceCashRegisterId: 'register',
              destinationSafeId: 'safe',
            },
          },
        ],
      },
      {
        id: 'bank',
        status: TransactionStatus.VALIDE,
        amount: new Decimal(30),
        treasuryAccountId: 'bank-account',
        cashRemittanceReceipts: [],
      },
      {
        id: 'pending',
        status: TransactionStatus.EN_ATTENTE,
        amount: new Decimal(30),
        treasuryAccountId: 'bank-account',
      },
    ]);
    const entry = { id: 'journal', status: 'POSTED' };
    tx.journalEntry.findMany.mockResolvedValueOnce([entry]);

    await service.updateOrderStatus(
      'order',
      {
        status: OrderStatus.CANCELLED,
        cancellationReason: '  Erreur de commande  ',
      },
      user,
    );

    expect(reversePostedEntry).toHaveBeenCalledWith(tx, entry, user.id, true);
    expect(tx.financialTransaction.deleteMany).toHaveBeenCalledWith({
      where: {
        subsidiaryId: 'branch',
        id: { in: ['pending'] },
      },
    });
    expect(
      tx.treasuryAccount.update.mock.calls.map(([args]) => [
        args.where.id,
        Number(args.data.balance.decrement),
      ]),
    ).toEqual([
      ['register', 40],
      ['safe', 20],
      ['register', 10],
      ['bank-account', 30],
    ]);
    expect(tx.financialTransaction.create).toHaveBeenCalledTimes(4);
    expect(tx.financialTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description:
          'Annulation du paiement — Commande order — Erreur de commande',
        treasuryAccountId: 'safe',
        financialTransactionType: TransactionType.DEPENSE,
        status: TransactionStatus.VALIDE,
        amount: new Decimal(20),
        balanceAfterSource: new Decimal(60),
      }),
    });
    expect(tx.cashRemittance.update).toHaveBeenCalledWith({
      where: {
        id: 'awaiting-receipt',
        subsidiaryId: 'branch',
        status: CashRemittanceStatus.SUBMITTED,
      },
      data: { declaredAmount: new Decimal(40) },
    });
    expect(tx.sale.deleteMany).toHaveBeenCalledWith({
      where: { subsidiaryId: 'branch', orderId: 'order' },
    });
    expect(tx.notification.deleteMany).toHaveBeenCalled();
  });

  it('allows normal progress after production', async () => {
    findUnique.mockResolvedValue({
      id: 'order',
      status: OrderStatus.IN_PRODUCTION,
      ...details,
      productionStatus: ProductionStatus.READY_FOR_DELIVERY,
    });
    update.mockResolvedValue({
      id: 'order',
      status: OrderStatus.PENDING_DELIVERY,
    });
    await expect(
      service.updateOrderStatus(
        'order',
        { status: OrderStatus.PENDING_DELIVERY },
        { ...user, activeRole: UserRole.ADMIN },
      ),
    ).resolves.toEqual(
      expect.objectContaining({ status: OrderStatus.PENDING_DELIVERY }),
    );
    expect(statusChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order',
        status: OrderStatus.IN_PRODUCTION,
      }),
      OrderStatus.PENDING_DELIVERY,
      OrderStatus.IN_PRODUCTION,
    );
  });

  it('does not mutate an order outside the subsidiary', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.updateOrderStatus(
        'foreign',
        { status: OrderStatus.CANCELLED, cancellationReason: 'Erreur client' },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it('records separate passes and only marks the order delivered when all quantities are delivered', async () => {
    const order = {
      ...details,
      id: 'order',
      status: OrderStatus.PENDING_DELIVERY,
      productionStatus: ProductionStatus.READY_FOR_DELIVERY,
      orderItems: [{ id: 'line', quantity: 10, product: { name: 'Affiche' } }],
      deliveries: null as Prisma.JsonValue,
    };
    findUnique.mockImplementation(() => Promise.resolve({ ...order }));
    update.mockImplementation(
      ({
        data,
      }: {
        data: { status: OrderStatus; deliveries: Prisma.JsonValue };
      }) => {
        Object.assign(order, data);
        return Promise.resolve(order);
      },
    );
    const firstDelivery = {
      id: '4d2730d9-6901-4d9d-945d-75c031b841fb',
      deliveredOn: '2025-04-19',
      lines: [{ orderItemId: 'line', deliveredQuantity: 4, packageCount: 1 }],
    };
    const first = { status: OrderStatus.DELIVERED, delivery: firstDelivery };
    await expect(
      service.updateOrderStatus('order', first, user),
    ).resolves.toMatchObject({
      status: OrderStatus.PENDING_DELIVERY,
      deliveries: [
        {
          ...firstDelivery,
          lines: [
            {
              ...firstDelivery.lines[0],
              productName: 'Affiche',
              orderedQuantity: 10,
            },
          ],
        },
      ],
    });
    expect(statusChanged).not.toHaveBeenCalled();
    await service.updateOrderStatus('order', first, user);
    expect(update).toHaveBeenCalledTimes(1);

    const second = {
      status: OrderStatus.DELIVERED,
      delivery: {
        ...firstDelivery,
        id: '4d2730d9-6901-4d9d-945d-75c031b841fc',
        lines: [{ orderItemId: 'line', deliveredQuantity: 7, packageCount: 2 }],
      },
    };
    await expect(
      service.updateOrderStatus('order', second, user),
    ).rejects.toThrow('reliquat');
    second.delivery.lines[0].deliveredQuantity = 6;
    await expect(
      service.updateOrderStatus('order', second, user),
    ).resolves.toMatchObject({
      status: OrderStatus.DELIVERED,
    });
    expect(update).toHaveBeenCalledTimes(2);
    expect(statusChanged).toHaveBeenCalledTimes(1);
  });

  it.each(['updateOrderStatus', 'rejectByProductionDirector'] as const)(
    'handles simultaneous production validation during %s',
    async (method) => {
      findUnique.mockResolvedValue({
        id: 'order',
        status: OrderStatus.PENDING_VALIDATION,
        ...details,
      });
      update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('State changed', {
          code: 'P2025',
          clientVersion: '6.19.3',
        }),
      );
      const operation =
        method === 'updateOrderStatus'
          ? service.updateOrderStatus(
              'order',
              {
                status: OrderStatus.CANCELLED,
                cancellationReason: 'Erreur client',
              },
              user,
            )
          : service.rejectByProductionDirector('order', 'Erreur client', {
              ...user,
              activeRole: UserRole.PRODUCTION_DIRECTOR,
            });
      await expect(operation).rejects.toBeInstanceOf(ConflictException);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order',
            subsidiaryId: 'branch',
            status: OrderStatus.PENDING_VALIDATION,
          }) as unknown,
        }),
      );
    },
  );
});
