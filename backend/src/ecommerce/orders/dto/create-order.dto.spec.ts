import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderBySalesRepDto } from './create-order.dto';
import { formatValidationErrors } from '../../../common/utils/validation-errors';

describe('Order production validation', () => {
  const draft = {
    customerId: 'CTC-123',
    customerName: 'Client',
    paymentDueDate: '2026-11-26',
    paymentMethod: 'PAY_ON_DELIVERY',
    source: 'MANUAL',
    items: [
      {
        productId: 'PRD-123',
        quantity: 1,
        unitPrice: 120,
      productionSummary: {
        totalProductionCost: 100,
        marginPercent: 150,
        finalPrice: 250,
      },
        productionSteps: [
          {
            equipmentId: 'EQP-123',
            equipmentNameSnapshot: 'Machine',
            stepOrder: 1,
            estimatedTimeHours: 1,
            hourlyRateSnapshot: 100,
            calculatedCost: 100,
          },
        ],
      },
    ],
  };

  it('accepts semantic equipment identifiers in nested items', async () => {
    expect(
      await validate(plainToInstance(CreateOrderBySalesRepDto, draft)),
    ).toEqual([]);
  });

  it('reports the exact nested field when an equipment identifier is empty', async () => {
    const invalid = structuredClone(draft);
    invalid.items[0].productionSteps[0].equipmentId = '';
    const errors = await validate(
      plainToInstance(CreateOrderBySalesRepDto, invalid),
    );
    expect(formatValidationErrors(errors)).toContain(
      'items.0.productionSteps.0.equipmentId: equipmentId should not be empty',
    );
  });
});
