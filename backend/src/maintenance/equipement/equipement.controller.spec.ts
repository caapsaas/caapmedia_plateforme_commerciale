import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole, ProformaStatus } from '@prisma/client';
import request from 'supertest';
import type { Server } from 'http';
import { EquipementController } from './equipement.controller';
import { EquipementService } from './equipement.service';
import { ProformasController } from '../../crm/proformas/proformas.controller';
import { ProformasService } from '../../crm/proformas/proformas.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const equipmentId = '11111111-1111-4111-8111-111111111111';
const local: JwtUser = {
  id: 'staff',
  email: 'staff@example.test',
  role: UserRole.ADMIN,
  activeRole: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
  subsidiaryId: 'A',
};
const identities: Record<string, JwtUser> = {
  A: local,
  B: { ...local, id: 'staff-B', subsidiaryId: 'B' },
  global: { ...local, roles: [UserRole.SUPER_ADMIN] },
  commercial: {
    ...local,
    activeRole: UserRole.COMMERCIAL,
    roles: [UserRole.ADMIN, UserRole.COMMERCIAL],
  },
};
type Filter = { id?: string; subsidiaryId?: string };

describe('HTTP subsidiary boundaries (real controllers, services and RoleGuard)', () => {
  let app: INestApplication;
  let server: Server;
  const equipment = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const proforma = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = { equipment, proforma, $transaction: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EquipementController, ProformasController],
      providers: [
        EquipementService,
        ProformasService,
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
    jest.resetAllMocks();
    equipment.findUnique.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(
        !where.subsidiaryId || where.subsidiaryId === 'B'
          ? { id: equipmentId, subsidiaryId: 'B' }
          : null,
      ),
    );
    proforma.findUnique.mockImplementation(({ where }: { where: Filter }) =>
      Promise.resolve(
        !where.subsidiaryId || where.subsidiaryId === 'B'
          ? { id: 'quote', subsidiaryId: 'B', status: ProformaStatus.DRAFT }
          : null,
      ),
    );
    equipment.update.mockResolvedValue({
      id: equipmentId,
      subsidiaryId: 'B',
      equipmentName: 'Updated',
    });
    equipment.delete.mockResolvedValue({ id: equipmentId, subsidiaryId: 'B' });
  });

  it('returns 404 for a foreign equipment and permits its owning branch', async () => {
    await request(server)
      .get(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'A')
      .expect(404);
    await request(server)
      .get(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'B')
      .expect(200);
  });
  it('preserves explicit consolidated reads for super administrators', async () => {
    await request(server)
      .get(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'global')
      .expect(200);
    await request(server)
      .get('/crm/proformas/quote')
      .set('x-test-identity', 'global')
      .expect(200);
  });
  it('rejects foreign equipment mutations before any write', async () => {
    await request(server)
      .patch(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'A')
      .send({ equipmentName: 'Updated' })
      .expect(404);
    await request(server)
      .delete(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'A')
      .expect(404);
    expect(equipment.update).not.toHaveBeenCalled();
    expect(equipment.delete).not.toHaveBeenCalled();
  });
  it('allows a local equipment update with its branch predicate', async () => {
    await request(server)
      .patch(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'B')
      .send({ equipmentName: 'Updated' })
      .expect(200);
    expect(equipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: equipmentId, subsidiaryId: 'B' },
      }),
    );
  });
  it('uses the active role instead of an inactive administrator role', async () => {
    await request(server)
      .get(`/equipements/${equipmentId}`)
      .set('x-test-identity', 'commercial')
      .expect(403);
    expect(equipment.findUnique).not.toHaveBeenCalled();
  });
  it('checks proforma identifiers against the authenticated staff branch', async () => {
    await request(server)
      .get('/crm/proformas/quote')
      .set('x-test-identity', 'A')
      .expect(404);
    await request(server)
      .get('/crm/proformas/quote')
      .set('x-test-identity', 'B')
      .expect(200);
    await request(server)
      .patch('/crm/proformas/quote')
      .set('x-test-identity', 'A')
      .send({ notes: 'Updated' })
      .expect(404);
    await request(server)
      .delete('/crm/proformas/quote')
      .set('x-test-identity', 'A')
      .expect(404);
    expect(proforma.update).not.toHaveBeenCalled();
    expect(proforma.delete).not.toHaveBeenCalled();
  });
  it.each(['send', 'mark-viewed', 'accept', 'reject'])(
    'scopes the proforma %s action before side effects',
    async (action) => {
      await request(server)
        .post(`/crm/proformas/quote/${action}`)
        .set('x-test-identity', 'A')
        .expect(404);
      expect(proforma.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );
});
