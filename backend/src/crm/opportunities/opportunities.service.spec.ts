import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OpportunityStage, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OpportunitiesService } from './opportunities.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const commercial: JwtUser = {
  id: 'commercial-A',
  email: 'staff@example.test',
  subsidiaryId: 'A',
  role: UserRole.COMMERCIAL,
  activeRole: UserRole.COMMERCIAL,
  roles: [UserRole.COMMERCIAL],
};
const admin: JwtUser = {
  ...commercial,
  role: UserRole.ADMIN,
  activeRole: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
};
const globalUser: JwtUser = { ...admin, roles: [UserRole.SUPER_ADMIN] };
const localRecord = {
  id: 'opp-A',
  opportunityValue: new Decimal(1000),
  products: [],
  subsidiaryId: 'A',
  userId: commercial.id,
  contactId: 'contact-A',
  accountId: 'account-A',
};
const foreignRecord = {
  ...localRecord,
  id: 'opp-B',
  subsidiaryId: 'B',
  userId: 'commercial-B',
  contactId: 'contact-B',
  accountId: 'account-B',
};
const draft = {
  opportunityName: 'Campaign',
  opportunityValue: 1000,
  closeDate: '2026-11-26',
  stage: OpportunityStage.QUALIFICATION,
  contactId: 'contact-A',
  accountId: 'account-A',
  productIds: ['product'],
};
type Lookup = {
  where: { id?: string; subsidiaryId?: string; userId?: string };
};

describe('Opportunities access and relationship integrity', () => {
  const opportunity = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const contact = { findUnique: jest.fn() };
  const account = { findUnique: jest.fn() };
  const item = { count: jest.fn() };
  const tx = { opportunity, contact, account, item };
  const prisma = {
    ...tx,
    $transaction: jest.fn((callback: (db: unknown) => unknown) => callback(tx)),
  };
  const service = new OpportunitiesService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    opportunity.findUnique.mockImplementation(({ where }: Lookup) =>
      Promise.resolve(
        [localRecord, foreignRecord].find(
          (row) =>
            row.id === where.id &&
            (!where.subsidiaryId || row.subsidiaryId === where.subsidiaryId) &&
            (!where.userId || row.userId === where.userId),
        ) ?? null,
      ),
    );
    opportunity.findMany.mockResolvedValue([]);
    opportunity.count.mockResolvedValue(0);
    account.findUnique.mockImplementation(({ where }: Lookup) =>
      Promise.resolve(
        [
          { id: 'account-A', subsidiaryId: 'A' },
          { id: 'account-B', subsidiaryId: 'B' },
        ].find(
          (row) =>
            row.id === where.id &&
            (!where.subsidiaryId || row.subsidiaryId === where.subsidiaryId),
        ) ?? null,
      ),
    );
    contact.findUnique.mockImplementation(({ where }: Lookup) =>
      Promise.resolve(
        [
          { id: 'contact-A', subsidiaryId: 'A', accountId: 'account-A' },
          { id: 'contact-B', subsidiaryId: 'B', accountId: 'account-B' },
        ].find(
          (row) =>
            row.id === where.id && row.subsidiaryId === where.subsidiaryId,
        ) ?? null,
      ),
    );
    item.count.mockResolvedValue(1);
    opportunity.create.mockResolvedValue(localRecord);
    opportunity.update.mockResolvedValue(localRecord);
    opportunity.delete.mockResolvedValue(localRecord);
  });

  it.each(['read', 'update', 'delete'])(
    'refuses foreign %s without a write',
    async (action) => {
      const operation =
        action === 'read'
          ? service.findOne('opp-B', commercial)
          : action === 'update'
            ? service.update(
                'opp-B',
                { stage: OpportunityStage.WON },
                commercial,
              )
            : service.remove('opp-B', commercial);
      await expect(operation).rejects.toBeInstanceOf(NotFoundException);
      expect(opportunity.update).not.toHaveBeenCalled();
      expect(opportunity.delete).not.toHaveBeenCalled();
    },
  );
  it('uses the same local owner predicate for lists, detail and deletion', async () => {
    await service.findAll(commercial);
    expect(opportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subsidiaryId: 'A', userId: commercial.id },
      }),
    );
    await service.findOne('opp-A', commercial);
    await service.remove('opp-A', commercial);
    expect(opportunity.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'opp-A', subsidiaryId: 'A', userId: commercial.id },
      }),
    );
  });
  it.each([UserRole.ADMIN, UserRole.SECRETARY])(
    'allows %s to manage another owner in the same branch',
    async (role) => {
      const user = {
        ...admin,
        id: 'manager',
        role,
        activeRole: role,
        roles: [role],
      };
      await expect(service.findOne('opp-A', user)).resolves.toEqual(
        expect.objectContaining({
          id: localRecord.id,
          opportunityValue: 1000,
          products: [],
          productIds: [],
        }),
      );
      await service.update('opp-A', { stage: OpportunityStage.WON }, user);
      expect(opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'opp-A', subsidiaryId: 'A' } }),
      );
    },
  );
  it('does not use an inactive administrator role to bypass owner restrictions', async () => {
    const user = {
      ...commercial,
      id: 'other',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN, UserRole.COMMERCIAL],
    };
    await service.findAll(user);
    expect(opportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subsidiaryId: 'A', userId: 'other' },
      }),
    );
    await expect(service.findOne('opp-A', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('keeps the existing financial director owner restriction', async () => {
    const user = {
      ...commercial,
      id: 'director',
      role: UserRole.FINANCIAL_DIRECTOR,
      activeRole: UserRole.FINANCIAL_DIRECTOR,
    };
    await expect(service.findOne('opp-A', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('supports consolidated list, foreign detail and foreign writes for the super administrator', async () => {
    await service.findAll(globalUser);
    expect(opportunity.count).toHaveBeenCalledWith({ where: {} });
    await expect(service.findOne('opp-B', globalUser)).resolves.toEqual(
      expect.objectContaining({
        id: foreignRecord.id,
        opportunityValue: 1000,
        products: [],
        productIds: [],
      }),
    );
    await service.update('opp-B', { stage: OpportunityStage.WON }, globalUser);
    expect(opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'opp-B' } }),
    );
    expect(contact.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contact-B', subsidiaryId: 'B' },
      }),
    );
  });
  it('selects safe contact and staff fields on detail responses', async () => {
    await service.findOne('opp-A', commercial);
    expect(opportunity.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          user: { select: { id: true, userName: true, email: true } },
          contact: {
            select: {
              id: true,
              contactName: true,
              company: true,
              email: true,
              phone: true,
              address: true,
              accountId: true,
              subsidiaryId: true,
              salesRepId: true,
              status: true,
            },
          },
        }) as unknown,
      }),
    );
  });
  it.each([
    { ...commercial, subsidiaryId: '' },
    { ...commercial, id: '' },
  ])('refuses incomplete identities before querying', async (user) => {
    await expect(service.findAll(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(opportunity.findMany).not.toHaveBeenCalled();
  });
  it('creates a local opportunity under the authenticated author and branch', async () => {
    await service.create(draft, commercial);
    expect(opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subsidiaryId: 'A',
          userId: commercial.id,
        }) as unknown,
      }),
    );
  });
  it('rejects a foreign account at creation even if its identifier is valid', async () => {
    await expect(
      service.create(
        { ...draft, accountId: 'account-B', contactId: 'contact-B' },
        commercial,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(opportunity.create).not.toHaveBeenCalled();
  });
  it('uses the authorized account branch for a super administrator creation', async () => {
    await service.create(
      { ...draft, accountId: 'account-B', contactId: 'contact-B' },
      globalUser,
    );
    expect(opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subsidiaryId: 'B',
          userId: globalUser.id,
        }) as unknown,
      }),
    );
  });
  it.each([{ contactId: 'contact-B' }, { accountId: 'account-B' }])(
    'rejects a foreign reference update',
    async (update) => {
      await expect(
        service.update('opp-A', update, commercial),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(opportunity.update).not.toHaveBeenCalled();
    },
  );
  it('prevents a super administrator from mixing references across branches on an existing opportunity', async () => {
    await expect(
      service.update(
        'opp-B',
        { contactId: 'contact-A', accountId: 'account-A' },
        globalUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(opportunity.update).not.toHaveBeenCalled();
  });
  it('rejects a contact attached to a different account in the same branch', async () => {
    contact.findUnique.mockResolvedValue({
      id: 'contact-A',
      accountId: 'different-account',
    });
    await expect(service.create(draft, commercial)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(opportunity.create).not.toHaveBeenCalled();
  });
  it('validates product existence before replacing associations', async () => {
    item.count.mockResolvedValue(0);
    await expect(
      service.update('opp-A', { productIds: ['missing'] }, commercial),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(opportunity.update).not.toHaveBeenCalled();
  });
  it('deduplicates products and replaces associations in one scoped nested write', async () => {
    await service.update(
      'opp-A',
      { productIds: ['product', 'product'] },
      commercial,
    );
    expect(item.count).toHaveBeenCalledWith({
      where: { id: { in: ['product'] } },
    });
    expect(opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'opp-A', subsidiaryId: 'A', userId: commercial.id },
        data: expect.objectContaining({
          products: {
            deleteMany: {},
            create: [
              expect.objectContaining({ productId: 'product' }) as unknown,
            ],
          },
        }) as unknown,
      }),
    );
  });
  it('allows clearing products without treating the empty list as missing', async () => {
    await service.update('opp-A', { productIds: [] }, commercial);
    expect(opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          products: { deleteMany: {}, create: [] },
        }) as unknown,
      }),
    );
  });
  it('returns catalog product ids instead of association ids when reopening an opportunity', async () => {
    opportunity.findUnique.mockResolvedValue({
      ...localRecord,
      products: [
        {
          id: 'association-id',
          productId: 'product',
          product: { id: 'product', name: 'Service' },
        },
      ],
    });
    const response = await service.findOne('opp-A', commercial);
    expect(response.productIds).toEqual(['product']);
    expect(response.products).toEqual([{ id: 'product', name: 'Service' }]);
    expect(response.opportunityValue).toBe(1000);
  });
});
