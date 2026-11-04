import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerPaymentMethod, OrderSource } from '@prisma/client';
import { CreateOrderBySalesRepDto } from './create-order.dto';

const base = {
  paymentDueDate: '2026-11-30',
  paymentMethod: CustomerPaymentMethod.PAY_ON_DELIVERY,
  source: OrderSource.MANUAL,
  items: [],
};

describe('Occasional order customer validation', () => {
  it.each([false, true])(
    'validates and trims occasional customer input (multipart: %s)',
    async (multipart) => {
      const customer = {
        name: ' Client ',
        phone: ' +237 699000000 ',
        email: '',
      };
      const dto = plainToInstance(CreateOrderBySalesRepDto, {
        ...base,
        occasionalCustomer: multipart ? JSON.stringify(customer) : customer,
      });
      expect(await validate(dto)).toEqual([]);
      expect(dto.occasionalCustomer).toMatchObject({
        name: 'Client',
        phone: '+237 699000000',
      });
      expect(dto.occasionalCustomer?.email).toBeUndefined();
    },
  );

  it.each([
    { name: ' ', phone: '699000000' },
    { name: 'Client', phone: 'wrong' },
    { name: 'Client', phone: '699000000', email: 'wrong' },
    'invalid-json',
  ])('rejects invalid customer details: %p', async (occasionalCustomer) => {
    const dto = plainToInstance(CreateOrderBySalesRepDto, {
      ...base,
      occasionalCustomer,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('still requires an existing customer when occasional details are absent', async () => {
    const dto = plainToInstance(CreateOrderBySalesRepDto, base);
    expect((await validate(dto)).map((error) => error.property)).toContain(
      'customerId',
    );
  });
});
