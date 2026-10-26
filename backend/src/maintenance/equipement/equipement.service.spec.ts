import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EquipementService } from './equipement.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const local: JwtUser = {
  id: 'staff',
  email: 'staff@example.test',
  role: UserRole.ADMIN,
  activeRole: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
  subsidiaryId: 'A',
};
const globalUser: JwtUser = { ...local, roles: [UserRole.SUPER_ADMIN] };
const record = { id: 'equipment', subsidiaryId: 'B' };

describe('Equipment subsidiary isolation', () => {
  const equipment = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };
  const service = new EquipementService({
    equipment,
  } as unknown as PrismaService);
  beforeEach(() => {
    jest.resetAllMocks();
    equipment.findUnique.mockImplementation(
      ({ where }: { where: { subsidiaryId?: string } }) =>
        Promise.resolve(
          !where.subsidiaryId || where.subsidiaryId === record.subsidiaryId
            ? record
            : null,
        ),
    );
    equipment.findMany.mockResolvedValue([]);
    equipment.update.mockResolvedValue(record);
    equipment.delete.mockResolvedValue(record);
  });

  it.each(['read', 'update', 'delete'])(
    'rejects a foreign equipment %s without writing',
    async (action) => {
      const operation =
        action === 'read'
          ? service.findOne('equipment', local)
          : action === 'update'
            ? service.update('equipment', { equipmentName: 'changed' }, local)
            : service.remove('equipment', local);
      await expect(operation).rejects.toBeInstanceOf(NotFoundException);
      expect(equipment.update).not.toHaveBeenCalled();
      expect(equipment.delete).not.toHaveBeenCalled();
    },
  );
  it('allows local reads and keeps the subsidiary predicate on writes', async () => {
    const user = { ...local, subsidiaryId: 'B' };
    await service.update(
      'equipment',
      { equipmentName: 'changed', subsidiaryId: 'A' },
      user,
    );
    expect(equipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'equipment', subsidiaryId: 'B' },
        data: {
          equipmentName: 'changed',
          acquisitionValue: undefined,
          status: undefined,
        },
      }),
    );
    await service.remove('equipment', user);
    expect(equipment.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'equipment', subsidiaryId: 'B' },
      }),
    );
  });
  it('allows explicit super administrator access to another branch', async () => {
    await expect(service.findOne('equipment', globalUser)).resolves.toEqual(
      record,
    );
    await service.update('equipment', { equipmentName: 'changed' }, globalUser);
    expect(equipment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'equipment' } }),
    );
  });
  it('forces local lists to the authenticated subsidiary', async () => {
    await service.findAll(local, 'B');
    expect(equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { subsidiaryId: 'A' } }),
    );
  });
  it('applies consolidation to searches as well as lists', async () => {
    await service.search({}, globalUser);
    expect(equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
  it('fails closed when the identity lacks its subsidiary', async () => {
    await expect(
      service.findAll({ ...local, subsidiaryId: '' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(equipment.findMany).not.toHaveBeenCalled();
  });
});
