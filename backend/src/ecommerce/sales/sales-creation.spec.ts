import { CustomerPaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SalesService } from './sales.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Direct sales assembly fees', () => {
  it.each([undefined, 0, 125.5])(
    'preserves assembly fee %s in the order and sale amounts',
    async (assemblyPrice) => {
      const tx = {
        item: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 'service', name: 'Service' }]),
        },
        taxRate: {
          findFirstOrThrow: jest
            .fn()
            .mockResolvedValue({ id: 'tax', rate: new Decimal('0.1925') }),
        },
        contact: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'customer', contactName: 'Client' }),
        },
        order: { create: jest.fn().mockResolvedValue({ id: 'order' }) },
        sale: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };
      const prisma = {
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const specs = {
        getFormDefinition: jest.fn().mockResolvedValue({ groups: [] }),
        validateAgainstDefinition: jest.fn(),
      };
      const service = new SalesService(
        prisma as unknown as PrismaService,
        specs as unknown as ProductSpecsService,
        {
          created: jest.fn(),
          paymentReceived: jest.fn(),
        } as unknown as OrderNotificationsService,
      );
      await service.createDirectSale(
        {
          customerId: 'customer',
          paymentMethod: CustomerPaymentMethod.CASH,
          items: [
            {
              productId: 'service',
              productName: 'Service',
              quantity: 3,
              unitPrice: 100,
              discount: 10,
              assemblyPrice,
            },
          ],
        },
        { id: 'staff', subsidiaryId: 'branch' },
      );
      const subtotal = new Decimal(290).add(assemblyPrice ?? 0);
      const total = subtotal.mul('1.1925');
      expect(tx.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subsidiaryId: 'branch',
          subtotal,
          totalAmount: total,
          orderItems: {
            create: [
              expect.objectContaining({
                assemblyPrice:
                  assemblyPrice == null ? null : new Decimal(assemblyPrice),
                total: subtotal,
              }) as unknown,
            ],
          },
        }) as unknown,
      });
      expect(tx.sale.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ totalPrice: total }) as unknown],
      });
    },
  );
});
