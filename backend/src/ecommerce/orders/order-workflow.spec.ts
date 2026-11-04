import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  ProductionStatus,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  assertOrderTransition,
  nextOrderStatusForProduction,
} from './order-workflow';

describe('Order workflow rules', () => {
  const state = {
    status: OrderStatus.PENDING_VALIDATION,
    productionStatus: ProductionStatus.PREPRESS,
    paymentStatus: PaymentStatus.UNPAID,
    amountPaid: new Decimal(0),
    totalAmount: new Decimal(100),
  };
  const director = { activeRole: UserRole.PRODUCTION_DIRECTOR };

  it.each([
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.FINANCIAL_DIRECTOR,
  ])('prevents %s from bypassing production approval', (activeRole) => {
    expect(() =>
      assertOrderTransition(state, OrderStatus.IN_PRODUCTION, {
        activeRole,
        roles: [UserRole.PRODUCTION_DIRECTOR],
      }),
    ).toThrow(ForbiddenException);
  });
  it('allows the production director to approve even when payment is outstanding', () => {
    expect(() =>
      assertOrderTransition(state, OrderStatus.IN_PRODUCTION, director),
    ).not.toThrow();
  });
  it('prevents cancelling an order after even a partial collection', () => {
    expect(() =>
      assertOrderTransition(
        { ...state, amountPaid: new Decimal(1) },
        OrderStatus.CANCELLED,
        { activeRole: UserRole.COMMERCIAL },
      ),
    ).toThrow(ConflictException);
  });
  it.each([
    OrderStatus.IN_PRODUCTION,
    OrderStatus.PENDING_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ])('prevents reverting or cancelling a %s order', (status) => {
    for (const target of [
      OrderStatus.NEW,
      OrderStatus.PENDING_VALIDATION,
      OrderStatus.CANCELLED,
    ]) {
      if (status !== target)
        expect(() =>
          assertOrderTransition({ ...state, status }, target, director),
        ).toThrow(ConflictException);
    }
  });
  it('rejects premature delivery and finishing without manufacturing', () => {
    expect(() =>
      assertOrderTransition(state, OrderStatus.DELIVERED, director),
    ).toThrow(ConflictException);
    expect(() =>
      nextOrderStatusForProduction(state, ProductionStatus.PRINTING, director),
    ).toThrow(ConflictException);
  });
  it('enforces sequential production and synchronises the ready-for-delivery state', () => {
    const printing = {
      ...state,
      status: OrderStatus.IN_PRODUCTION,
      productionStatus: ProductionStatus.PRINTING,
    };
    expect(() =>
      nextOrderStatusForProduction(
        printing,
        ProductionStatus.PREPRESS,
        director,
      ),
    ).toThrow(ConflictException);
    expect(() =>
      nextOrderStatusForProduction(
        printing,
        ProductionStatus.READY_FOR_DELIVERY,
        director,
      ),
    ).toThrow(ConflictException);
    expect(
      nextOrderStatusForProduction(
        printing,
        ProductionStatus.FINISHING,
        director,
      ),
    ).toBe(OrderStatus.IN_PRODUCTION);
    expect(
      nextOrderStatusForProduction(
        { ...printing, productionStatus: ProductionStatus.FINISHING },
        ProductionStatus.READY_FOR_DELIVERY,
        director,
      ),
    ).toBe(OrderStatus.PENDING_DELIVERY);
  });
  it('allows delivery followed by closure only after full payment', () => {
    const ready = {
      ...state,
      status: OrderStatus.PENDING_DELIVERY,
      productionStatus: ProductionStatus.READY_FOR_DELIVERY,
    };
    const commercial = { activeRole: UserRole.COMMERCIAL };
    expect(() =>
      assertOrderTransition(ready, OrderStatus.DELIVERED, commercial),
    ).not.toThrow();
    const delivered = { ...ready, status: OrderStatus.DELIVERED };
    expect(() =>
      assertOrderTransition(delivered, OrderStatus.COMPLETED, commercial),
    ).toThrow(ConflictException);
    expect(() =>
      assertOrderTransition(
        {
          ...delivered,
          paymentStatus: PaymentStatus.PAID,
          amountPaid: new Decimal(100),
        },
        OrderStatus.COMPLETED,
        commercial,
      ),
    ).not.toThrow();
  });
});
