// Local integration check. All test orders, payments, sales and history roll back.
require('dotenv').config({ quiet: true });
require('reflect-metadata');
require('ts-node/register');
require('tsconfig-paths/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient, UserRole } = require('@prisma/client');
const { OrdersService } = require('../src/ecommerce/orders/orders.service.ts');

const prisma = new PrismaClient();
const id = `WORKFLOW-CHECK-${randomUUID()}`;
const rollback = new Error('ROLLBACK_WORKFLOW_CHECK');

async function main() {
  const reference = await prisma.order.findFirst({
    select: {
      customerId: true,
      subsidiaryId: true,
      taxRateId: true,
      salesRepId: true,
    },
  });
  const product = await prisma.item.findFirst({
    where: { type: 'SERVICE' },
    select: { id: true },
  });
  assert(
    reference && product,
    'A reference order and service are required in the local database.',
  );
  try {
    await prisma.$transaction(
      async (tx) => {
        const transactionalClient = new Proxy(tx, {
          get(target, property) {
            return property === '$transaction'
              ? (callback) => callback(tx)
              : target[property];
          },
        });
        const events = [];
        const service = new OrdersService(
          transactionalClient,
          {},
          {
            created: async () => events.push('created'),
            statusChanged: async () => events.push('status'),
            productionChanged: async () => events.push('production'),
            paymentReceived: async () => events.push('payment'),
          },
        );
        await tx.order.create({
          data: {
            ...reference,
            id,
            customerName: 'Workflow integration check (rolled back)',
            paymentDueDate: new Date(),
            source: 'MANUAL',
            subtotal: 100,
            taxAmount: 20,
            totalAmount: 120,
            taxRateValue: '0.2',
            status: 'PENDING_VALIDATION',
            productionStatus: 'PREPRESS',
            paymentStatus: 'UNPAID',
            amountPaid: 0,
            orderItems: {
              create: {
                id: `${id}-ITEM`,
                productId: product.id,
                quantity: 1,
                unitPrice: 100,
                discount: 0,
                total: 100,
              },
            },
          },
        });
        const commercial = {
          id: reference.salesRepId,
          subsidiaryId: reference.subsidiaryId,
          activeRole: UserRole.COMMERCIAL,
        };
        const director = {
          ...commercial,
          activeRole: UserRole.PRODUCTION_DIRECTOR,
        };
        let order = await service.recordPayment(
          id,
          { amount: 25, paymentMethod: 'CASH' },
          commercial,
        );
        assert.equal(order.status, 'PENDING_VALIDATION');
        assert.equal(order.amountPaid, 25);
        await assert.rejects(
          service.updateOrderStatus(id, { status: 'CANCELLED' }, commercial),
          (error) => error.getStatus() === 409,
        );
        await assert.rejects(
          service.updateOrderStatus(
            id,
            { status: 'IN_PRODUCTION' },
            commercial,
          ),
          (error) => error.getStatus() === 403,
        );
        await service.validateForProduction(id, director);
        await assert.rejects(
          service.updateProductionStatus(
            id,
            { productionStatus: 'READY_FOR_DELIVERY' },
            director,
          ),
          (error) => error.getStatus() === 409,
        );
        for (const stage of ['PRINTING', 'FINISHING', 'READY_FOR_DELIVERY']) {
          await service.updateProductionStatus(
            id,
            { productionStatus: stage },
            director,
          );
        }
        const ready = await tx.order.findUniqueOrThrow({ where: { id } });
        assert.equal(ready.status, 'PENDING_DELIVERY');
        assert.equal(ready.productionStatus, 'READY_FOR_DELIVERY');
        await service.updateOrderStatus(
          id,
          { status: 'DELIVERED' },
          commercial,
        );
        await assert.rejects(
          service.updateOrderStatus(id, { status: 'COMPLETED' }, commercial),
          (error) => error.getStatus() === 409,
        );
        order = await service.recordPayment(
          id,
          { amount: 95, paymentMethod: 'CASH' },
          commercial,
        );
        assert.equal(order.status, 'DELIVERED');
        assert.equal(order.paymentStatus, 'PAID');
        assert.equal(order.amountPaid, 120);
        await service.updateOrderStatus(
          id,
          { status: 'COMPLETED' },
          commercial,
        );
        await assert.rejects(
          service.updateOrderStatus(id, { status: 'IN_PRODUCTION' }, director),
          (error) => error.getStatus() === 409,
        );
        assert.equal(
          await tx.orderProductionHistory.count({ where: { orderId: id } }),
          3,
        );
        assert.equal(await tx.sale.count({ where: { orderId: id } }), 1);
        assert.equal(events.filter((event) => event === 'payment').length, 2);
        throw rollback;
      },
      { timeout: 20000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal(await prisma.order.count({ where: { id } }), 0);
  assert.equal(await prisma.sale.count({ where: { orderId: id } }), 0);
  console.log(
    'PASS: payment, approval, sequential production, delivery, paid closure and rollback verified on PostgreSQL.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
