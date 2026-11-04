// Local database only. Every fixture and change is rolled back.
require('dotenv').config({ quiet: true });
require('reflect-metadata');
require('ts-node/register');
require('tsconfig-paths/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { SuppliersService } = require('../src/purchase/suppliers/suppliers.service.ts');

async function main() {
  assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Local development database required');
  const prisma = new PrismaClient();
  const marker = `SUPTEST-${randomUUID()}`;
  const rollback = new Error('ROLLBACK_SUPPLIER_CHECK');
  let verified = false;
  try {
    const subsidiaries = await prisma.subsidiary.findMany({ take: 2, select: { id: true } });
    assert(subsidiaries.length, 'A local subsidiary is required');
    const sid = subsidiaries[0].id;
    const treasurySid = subsidiaries[1]?.id ?? sid;
    await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({ data: {
        id: `SUP-${Date.now().toString(36).toUpperCase()}ABC`,
        supplierName: marker, company: marker, email: 'supplier-check@example.test',
        phone: '000', address: 'Test', subsidiaryId: sid,
      } });
      const other = await tx.supplier.create({ data: {
        ...supplier, id: randomUUID(), subsidiaryId: treasurySid,
        supplierName: `${marker}-control`,
      } });
      const item = await tx.item.create({ data: {
        id: randomUUID(), type: 'STOCK_PRODUCT', name: marker,
        category: 'Test', description: 'Rolled back', mainSupplierId: supplier.id,
      } });
      await tx.itemStock.create({ data: { id: randomUUID(), itemId: item.id, subsidiaryId: sid, stock: 18 } });
      const account = await tx.treasuryAccount.create({ data: {
        id: randomUUID(), accountName: marker, accountType: 'SAFE',
        subsidiaryId: treasurySid, currency: 'XAF', balance: '874.50',
      } });
      const order = await tx.purchaseOrder.create({ data: {
        id: randomUUID(), supplierId: supplier.id, supplierName: supplier.supplierName,
        subsidiaryId: sid, orderDate: new Date(), expectedDeliveryDate: new Date(),
        totalAmount: 500, amountPaid: '125.50', status: 'RECEIVED',
        paymentTerms: 'CREDIT', paymentStatus: 'PARTIALLY_PAID',
        purchaseOrderItems: { create: {
          id: randomUUID(), productId: item.id, productName: marker,
          quantity: 10, quantityReceived: 10, purchasePrice: 50,
        } },
        purchaseOrderHistory: { create: { eventName: 'Test fixture' } },
        supplierDebts: { create: {
          id: randomUUID(), supplierName: supplier.supplierName, invoiceId: marker,
          dueDate: new Date(), amount: '374.50', subsidiaryId: sid, status: 'PARTIELLEMENT_PAYE',
        } },
      }, include: { supplierDebts: true } });
      await tx.stockMovement.createMany({ data: [
        { id: randomUUID(), itemId: item.id, subsidiaryId: sid, type: 'PURCHASE_RECEIPT', quantity: 10, purchaseOrderId: order.id },
        { id: randomUUID(), itemId: item.id, subsidiaryId: sid, type: 'SUPPLIER_RETURN', quantity: 2, purchaseOrderId: order.id },
        { id: randomUUID(), itemId: item.id, subsidiaryId: sid, type: 'POSITIVE_ADJUSTMENT', quantity: 10 },
      ] });
      const payment = await tx.financialTransaction.create({ data: {
        id: randomUUID(), transactionDate: new Date(), amount: '125.50',
        financialTransactionType: 'DEPENSE', treasuryAccountId: account.id,
        sourceAccountId: account.id, subsidiaryId: treasurySid,
        relatedDocumentId: order.supplierDebts[0].id,
      } });
      await tx.financialTransaction.createMany({ data: [
        { id: randomUUID(), transactionDate: new Date(), amount: 50, financialTransactionType: 'DEPENSE', treasuryAccountId: account.id, subsidiaryId: treasurySid, relatedDocumentId: order.id, status: 'EN_ATTENTE' },
        { id: randomUUID(), transactionDate: new Date(), amount: 20, financialTransactionType: 'DEPENSE', treasuryAccountId: account.id, subsidiaryId: treasurySid, relatedDocumentId: other.id },
      ] });
      await tx.accountingOutboxEntry.create({ data: {
        id: randomUUID(), eventType: 'SUPPLIER_DEBT_PAYMENT',
        subsidiaryId: treasurySid, payload: { sourceId: payment.id },
      } });
      const journal = await tx.accountingJournal.create({ data: {
        id: randomUUID(), code: randomUUID().slice(0, 8), name: marker, journalType: 'ACHATS',
      } });
      const entry = await tx.journalEntry.create({ data: {
        id: randomUUID(), entryNumber: `${marker}-entry`, entryDate: new Date(),
        description: marker, subsidiaryId: treasurySid, journalId: journal.id,
        sourceType: 'SUPPLIER_DEBT_PAYMENT', sourceId: payment.id,
      } });
      await tx.journalEntry.create({ data: {
        id: randomUUID(), entryNumber: `${marker}-reversal`, entryDate: new Date(),
        description: marker, subsidiaryId: treasurySid, journalId: journal.id,
        reversalOfEntryId: entry.id,
      } });
      const transactionalClient = new Proxy(tx, {
        get(target, key) { return key === '$transaction' ? (callback) => callback(tx) : target[key]; },
      });
      const service = new SuppliersService(transactionalClient);
      const user = { userRole: 'ADMIN', subsidiaryId: sid };
      await service.update(supplier.id, { company: 'Updated company' }, user);
      assert.equal((await tx.supplier.findUnique({ where: { id: supplier.id } })).company, 'Updated company');
      await assert.rejects(service.remove(supplier.id, { ...user, subsidiaryId: 'OTHER-SUBSIDIARY' }), (error) => error.getStatus() === 403);
      await service.remove(supplier.id, user);
      assert.equal(await tx.supplier.count({ where: { id: supplier.id } }), 0);
      assert.equal(await tx.purchaseOrder.count({ where: { id: order.id } }), 0);
      assert.equal(await tx.purchaseOrderItem.count({ where: { purchaseOrderId: order.id } }), 0);
      assert.equal(await tx.purchaseOrderHistory.count({ where: { purchaseOrderId: order.id } }), 0);
      assert.equal(await tx.supplierDebt.count({ where: { purchaseOrderId: order.id } }), 0);
      assert.equal(await tx.financialTransaction.count({ where: { treasuryAccountId: account.id } }), 1);
      assert.equal(await tx.accountingOutboxEntry.count({ where: { payload: { path: ['sourceId'], equals: payment.id } } }), 0);
      assert.equal(await tx.journalEntry.count({ where: { journalId: journal.id } }), 0);
      assert.equal(await tx.stockMovement.count({ where: { itemId: item.id } }), 1);
      assert.equal(String((await tx.itemStock.findUnique({ where: { itemId_subsidiaryId: { itemId: item.id, subsidiaryId: sid } } })).stock), '10');
      assert.equal((await tx.item.findUnique({ where: { id: item.id } })).mainSupplierId, null);
      assert.equal(String((await tx.treasuryAccount.findUnique({ where: { id: account.id } })).balance), '1000');
      assert.equal(await tx.supplier.count({ where: { id: other.id } }), 1);
      verified = true;
      throw rollback;
    }, { timeout: 60000 });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
  assert(verified);
  console.log('PASS: supplier modification, subsidiary isolation, deletion cascades, stock and treasury reversals; all changes rolled back.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
