import { CommercialParamsService } from './commercial-params.service';
import { PrismaService } from '../../../common/utils/prisma/prisma.service';

describe('CommercialParamsService configuration state', () => {
  it('returns null when margins have not been configured', async () => {
    const prisma = {
      commercialParams: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new CommercialParamsService(
      prisma as unknown as PrismaService,
    );
    await expect(service.findGlobal()).resolves.toBeNull();
  });
});
