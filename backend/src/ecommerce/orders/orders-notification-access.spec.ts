import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
import { OrdersService } from './orders.service';

describe('Staff order details opened from notifications', () => {
  const order = {
    id: 'order',
    subsidiaryId: 'A',
    salesRepId: 'seller',
    orderItems: [],
  };
  const findUnique = jest.fn();
  const service = new OrdersService(
    { order: { findUnique } } as unknown as PrismaService,
    {} as ProductSpecsService,
    {} as OrderNotificationsService,
  );
  const user = {
    id: 'seller',
    subsidiaryId: 'A',
    role: UserRole.COMMERCIAL,
    activeRole: UserRole.COMMERCIAL,
    roles: [UserRole.COMMERCIAL],
  } as JwtUser;
  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockImplementation(
      ({ where }: { where: { subsidiaryId?: string; salesRepId?: string } }) =>
        Promise.resolve(
          (!where.subsidiaryId || where.subsidiaryId === order.subsidiaryId) &&
            (!where.salesRepId || where.salesRepId === order.salesRepId)
            ? order
            : null,
        ),
    );
  });
  it('opens only the commercial’s own order', async () => {
    await expect(service.findOne('order', user)).resolves.toHaveProperty(
      'id',
      'order',
    );
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order', subsidiaryId: 'A', salesRepId: 'seller' },
      }),
    );
    await expect(
      service.findOne('order', { ...user, id: 'other-seller' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('allows the production director to open local orders, but refuses foreign ones', async () => {
    const director = {
      ...user,
      role: UserRole.PRODUCTION_DIRECTOR,
      activeRole: UserRole.PRODUCTION_DIRECTOR,
    };
    await expect(service.findOne('order', director)).resolves.toHaveProperty(
      'id',
      'order',
    );
    await expect(
      service.findOne('order', { ...director, subsidiaryId: 'B' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('fails closed when the staff subsidiary is missing', async () => {
    await expect(
      service.findOne('order', { ...user, subsidiaryId: '' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
