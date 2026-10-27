import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OpportunityStage, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import request from 'supertest';
import type { Server } from 'http';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const local: JwtUser = {
  id: 'commercial-A',
  email: 'staff@example.test',
  subsidiaryId: 'A',
  role: UserRole.COMMERCIAL,
  activeRole: UserRole.COMMERCIAL,
  roles: [UserRole.COMMERCIAL],
};
const identities: Record<string, JwtUser> = {
  commercial: local,
  admin: {
    ...local,
    id: 'admin',
    role: UserRole.ADMIN,
    activeRole: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
  },
  secretary: {
    ...local,
    id: 'secretary',
    role: UserRole.SECRETARY,
    activeRole: UserRole.SECRETARY,
    roles: [UserRole.SECRETARY],
  },
  switched: {
    ...local,
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN, UserRole.COMMERCIAL],
  },
  global: { ...local, roles: [UserRole.SUPER_ADMIN] },
  hr: { ...local, activeRole: UserRole.HR_MANAGER },
};
const rawRecords = [
  {
    id: 'own-A',
    subsidiaryId: 'A',
    userId: local.id,
    contactId: 'contact-A',
    accountId: 'account-A',
  },
  {
    id: 'peer-A',
    subsidiaryId: 'A',
    userId: 'other',
    contactId: 'contact-A',
    accountId: 'account-A',
  },
  {
    id: 'own-B',
    subsidiaryId: 'B',
    userId: 'commercial-B',
    contactId: 'contact-B',
    accountId: 'account-B',
  },
];
const records = rawRecords.map((row) => ({
  ...row,
  opportunityValue: new Decimal(1000),
  products: [],
}));
type Filter = { id?: string; subsidiaryId?: string; userId?: string };
const matches = (row: Filter, where: Filter) =>
  (!where.id || row.id === where.id) &&
  (!where.subsidiaryId || row.subsidiaryId === where.subsidiaryId) &&
  (!where.userId || row.userId === where.userId);

describe('Opportunities HTTP branch and ownership boundaries', () => {
  let app: INestApplication;
  let server: Server;
  const opportunity = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const account = { findUnique: jest.fn() };
  const contact = { findUnique: jest.fn() };
  const item = { count: jest.fn() };
  const tx = { opportunity, account, contact, item };
  const prisma = {
    ...tx,
    $transaction: jest.fn((callback: (db: unknown) => unknown) => callback(tx)),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [
        OpportunitiesService,
        RoleGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<{ headers: Record<string, string>; user?: JwtUser }>();
          req.user = identities[req.headers['x-test-identity']];
          return !!req.user;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    opportunity.findUnique.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(records.find((row) => matches(row, where)) ?? null),
    );
    opportunity.findMany.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(records.filter((row) => matches(row, where))),
    );
    opportunity.count.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(records.filter((row) => matches(row, where)).length),
    );
    account.findUnique.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(
        [
          { id: 'account-A', subsidiaryId: 'A' },
          { id: 'account-B', subsidiaryId: 'B' },
        ].find((row) => matches(row, where)) ?? null,
      ),
    );
    contact.findUnique.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(
        [
          { id: 'contact-A', subsidiaryId: 'A', accountId: 'account-A' },
          { id: 'contact-B', subsidiaryId: 'B', accountId: 'account-B' },
        ].find((row) => matches(row, where)) ?? null,
      ),
    );
    item.count.mockResolvedValue(1);
    opportunity.create.mockResolvedValue(records[0]);
    opportunity.update.mockResolvedValue(records[0]);
    opportunity.delete.mockResolvedValue(records[0]);
  });

  it('returns only owned opportunities and applies the same restriction to details', async () => {
    const response = await request(server)
      .get('/crm/opportunities')
      .set('x-test-identity', 'commercial')
      .expect(200);
    expect(
      (response.body as { data: { id: string }[] }).data.map((row) => row.id),
    ).toEqual(['own-A']);
    await request(server)
      .get('/crm/opportunities/own-A')
      .set('x-test-identity', 'commercial')
      .expect(200);
    await request(server)
      .get('/crm/opportunities/peer-A')
      .set('x-test-identity', 'commercial')
      .expect(404);
  });
  it.each(['admin', 'secretary'])(
    'allows %s all local records but no foreign detail',
    async (identity) => {
      const response = await request(server)
        .get('/crm/opportunities')
        .set('x-test-identity', identity)
        .expect(200);
      expect((response.body as { meta: { total: number } }).meta.total).toBe(2);
      await request(server)
        .get('/crm/opportunities/peer-A')
        .set('x-test-identity', identity)
        .expect(200);
      await request(server)
        .get('/crm/opportunities/own-B')
        .set('x-test-identity', identity)
        .expect(404);
    },
  );
  it('lets the super administrator open an opportunity from the consolidated list', async () => {
    const response = await request(server)
      .get('/crm/opportunities')
      .set('x-test-identity', 'global')
      .expect(200);
    expect((response.body as { meta: { total: number } }).meta.total).toBe(3);
    await request(server)
      .get('/crm/opportunities/own-B')
      .set('x-test-identity', 'global')
      .expect(200);
  });
  it('uses the switched active role rather than the primary administrator role', async () => {
    await request(server)
      .get('/crm/opportunities/peer-A')
      .set('x-test-identity', 'switched')
      .expect(404);
  });
  it('rejects a role which is not authorized on this module', async () => {
    await request(server)
      .get('/crm/opportunities')
      .set('x-test-identity', 'hr')
      .expect(403);
    expect(opportunity.findMany).not.toHaveBeenCalled();
  });
  it('does not honor a foreign subsidiary supplied as a query parameter', async () => {
    const response = await request(server)
      .get('/crm/opportunities?subsidiaryId=B')
      .set('x-test-identity', 'commercial')
      .expect(200);
    expect(
      (response.body as { data: { id: string }[] }).data.map((row) => row.id),
    ).toEqual(['own-A']);
  });
  it.each(['peer-A', 'own-B'])(
    'refuses update and delete on inaccessible %s',
    async (id) => {
      await request(server)
        .patch(`/crm/opportunities/${id}`)
        .set('x-test-identity', 'commercial')
        .send({ stage: 'WON' })
        .expect(404);
      await request(server)
        .delete(`/crm/opportunities/${id}`)
        .set('x-test-identity', 'commercial')
        .expect(404);
      expect(opportunity.update).not.toHaveBeenCalled();
      expect(opportunity.delete).not.toHaveBeenCalled();
    },
  );
  it('allows an owned stage update and keeps owner and subsidiary on the write', async () => {
    await request(server)
      .patch('/crm/opportunities/own-A')
      .set('x-test-identity', 'commercial')
      .send({ stage: 'WON', userId: 'other', subsidiaryId: 'B' })
      .expect(200);
    expect(opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'own-A', subsidiaryId: 'A', userId: local.id },
      }),
    );
  });
  it('validates a foreign contact on update before writing', async () => {
    await request(server)
      .patch('/crm/opportunities/own-A')
      .set('x-test-identity', 'commercial')
      .send({ contactId: 'contact-B' })
      .expect(404);
    expect(opportunity.update).not.toHaveBeenCalled();
  });
  it('creates a valid opportunity and rejects a foreign account', async () => {
    const body = {
      opportunityName: 'Campaign',
      opportunityValue: 1000,
      closeDate: '2026-11-26',
      stage: OpportunityStage.QUALIFICATION,
      contactId: 'contact-A',
      accountId: 'account-A',
    };
    await request(server)
      .post('/crm/opportunities')
      .set('x-test-identity', 'commercial')
      .send(body)
      .expect(201);
    opportunity.create.mockClear();
    await request(server)
      .post('/crm/opportunities')
      .set('x-test-identity', 'commercial')
      .send({ ...body, contactId: 'contact-B', accountId: 'account-B' })
      .expect(404);
    expect(opportunity.create).not.toHaveBeenCalled();
  });
  it.each([
    { contactId: null },
    { accountId: null },
    { closeDate: null },
    { productIds: null },
  ])(
    'rejects null required relationships or values in a patch',
    async (body) => {
      await request(server)
        .patch('/crm/opportunities/own-A')
        .set('x-test-identity', 'commercial')
        .send(body)
        .expect(400);
      expect(opportunity.update).not.toHaveBeenCalled();
    },
  );
});
