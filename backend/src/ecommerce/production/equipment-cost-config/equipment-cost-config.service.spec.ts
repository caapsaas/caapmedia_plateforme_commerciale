import { Prisma, UserRole } from '@prisma/client';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import type { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { EquipmentCostConfigService } from './equipment-cost-config.service';

describe('EquipmentCostConfigService production equipment', () => {
  const findMany = jest.fn();
  const service = new EquipmentCostConfigService({
    equipment: { findMany },
  } as unknown as PrismaService);
  const cashier = { role: UserRole.CAISSIER, subsidiaryId: 'branch' } as JwtUser;

  beforeEach(() => {
    findMany.mockReset();
  });

  it('includes new operational machines without a rate for the cashier branch', async () => {
    const equipment = {
      equipmentName: 'Presse',
      status: 'OPERATIONAL',
      subsidiaryId: 'branch',
      subsidiary: { subsidiaryName: 'Agence' },
    };
    const zeroRate = new Prisma.Decimal(0);
    findMany.mockResolvedValue([
      { ...equipment, id: 'new-machine', costConfig: null },
      {
        ...equipment,
        id: 'configured-machine',
        costConfig: { id: 'config', hourlyRate: zeroRate },
      },
    ]);

    const result = await service.findConfigured('other-branch', cashier, true);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'OPERATIONAL', subsidiaryId: 'branch' },
      }),
    );
    expect(result.map(({ id, hourlyRate }) => [id, hourlyRate])).toEqual([
      ['new-machine', null],
      ['configured-machine', zeroRate],
    ]);
  });

  it('retains the rate filter for callers requesting configured machines', async () => {
    findMany.mockResolvedValue([]);

    await service.findConfigured(undefined, cashier);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'OPERATIONAL',
          subsidiaryId: 'branch',
          costConfig: { isNot: null },
        },
      }),
    );
  });

  it('includes unpriced machines only from the commercial user branch', async () => {
    findMany.mockResolvedValue([]);
    const commercial = { ...cashier, role: UserRole.COMMERCIAL };

    await service.findConfigured(undefined, commercial, true);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'OPERATIONAL',
          OR: [{ costConfig: { isNot: null } }, { subsidiaryId: 'branch' }],
        },
      }),
    );
  });
});
