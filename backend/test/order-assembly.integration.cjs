// Run manually with: node test/order-assembly.integration.cjs
// Exercises the generated client and local database; every write is rolled back.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
const prefix = `ASSEMBLY-CHECK-${randomUUID()}`;
const rollback = new Error('ROLLBACK_ASSEMBLY_CHECK');

async function main() {
  const source = await prisma.order.findFirst({
    select: {
      customerId: true,
      subsidiaryId: true,
      taxRateId: true,
      salesRepId: true,
    },
  });
  assert(source, 'A reference order is required in the local database.');

  try {
    await prisma.$transaction(async (tx) => {
      for (const [index, assemblyPrice] of [null, 0, 125.5].entries()) {
        const fee =
          assemblyPrice === null ? null : new Prisma.Decimal(assemblyPrice);
        const total = new Prisma.Decimal(100)
          .mul(3)
          .sub(10)
          .add(fee ?? 0);
        const taxAmount = total.mul('0.1925');
        const order = await tx.order.create({
          data: {
            ...source,
            id: `${prefix}-${index}`,
            customerName: 'Assembly integration check (rolled back)',
            paymentDueDate: new Date(),
            source: 'MANUAL',
            subtotal: total,
            taxAmount,
            totalAmount: total.add(taxAmount),
            taxRateValue: '0.1925',
            applyTax: true,
            status: 'PENDING_VALIDATION',
            productionStatus: 'PREPRESS',
            paymentStatus: 'UNPAID',
            paymentMethod: null,
            orderItems: {
              create: {
                id: `${prefix}-ITEM-${index}`,
                quantity: 3,
                unitPrice: 100,
                discount: 10,
                assemblyPrice: fee,
                total,
                productOptions: {
                  create: {
                    id: `${prefix}-OPTION-${index}`,
                    optionType: 'format',
                    optionValue: 'A4',
                  },
                },
              },
            },
          },
          include: { orderItems: { include: { productOptions: true } } },
        });
        const line = order.orderItems[0];
        assert.equal(
          line.assemblyPrice?.toString() ?? null,
          fee?.toString() ?? null,
        );
        assert(line.total.equals(total));
        assert(
          order.totalAmount.equals(total.add(taxAmount).toDecimalPlaces(2)),
        );
        assert.equal(line.productOptions[0].optionValue, 'A4');
      }
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal(
    await prisma.order.count({ where: { id: { startsWith: prefix } } }),
    0,
  );
  console.log(
    'PASS: assembly fees null, zero and positive; totals, options and rollback verified.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
