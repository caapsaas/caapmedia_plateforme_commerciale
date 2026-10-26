import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { getActiveRole, isSuperAdmin } from '../auth/role/role-identity';
import {
  resolveScopeContext,
  withSubsidiaryScope,
  assertSubsidiaryAccess,
  resolveEffectiveSubsidiaryId,
} from './subsidiary-scope';

const local = {
  subsidiaryId: 'A',
  role: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
};

describe('Shared role and subsidiary policy', () => {
  it('uses the active role before historical aliases', () => {
    expect(getActiveRole({ ...local, activeRole: UserRole.COMMERCIAL })).toBe(
      UserRole.COMMERCIAL,
    );
    expect(getActiveRole({ userRole: UserRole.ADMIN })).toBe(UserRole.ADMIN);
  });
  it('does not grant consolidation for an inactive financial role', () => {
    expect(
      resolveScopeContext(
        {
          ...local,
          roles: [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
          activeRole: UserRole.ADMIN,
        },
        [UserRole.FINANCIAL_DIRECTOR],
      ).hasGlobalScope,
    ).toBe(false);
  });
  it('grants explicitly allowed consolidation to the active financial role', () => {
    expect(
      resolveScopeContext(
        { ...local, activeRole: UserRole.FINANCIAL_DIRECTOR },
        [UserRole.FINANCIAL_DIRECTOR],
      ).hasGlobalScope,
    ).toBe(true);
  });
  it('preserves the explicit super administrator exception across role switches', () => {
    const user = {
      ...local,
      roles: [UserRole.SUPER_ADMIN],
      activeRole: UserRole.COMMERCIAL,
    };
    expect(isSuperAdmin(user)).toBe(true);
    expect(resolveScopeContext(user).hasGlobalScope).toBe(true);
  });
  it.each(['', '   ', undefined])(
    'fails closed when the subsidiary is %s',
    (subsidiaryId) => {
      expect(() => resolveScopeContext({ ...local, subsidiaryId })).toThrow(
        ForbiddenException,
      );
    },
  );
  it('ignores a foreign branch supplied by a local user', () => {
    expect(
      withSubsidiaryScope({ id: 'record' }, resolveScopeContext(local), 'B'),
    ).toEqual({ id: 'record', subsidiaryId: 'A' });
    expect(() =>
      assertSubsidiaryAccess('B', resolveScopeContext(local)),
    ).toThrow(ForbiddenException);
  });
  it('supports consolidated and filtered super administrator reads', () => {
    const scope = resolveScopeContext({
      ...local,
      roles: [UserRole.SUPER_ADMIN],
    });
    expect(withSubsidiaryScope({}, scope)).toEqual({});
    expect(withSubsidiaryScope({}, scope, 'B')).toEqual({ subsidiaryId: 'B' });
  });
  it('rejects manually constructed contexts without a subsidiary in every helper', () => {
    const scope = { subsidiaryId: '', hasGlobalScope: false };
    expect(() => withSubsidiaryScope({}, scope)).toThrow(ForbiddenException);
    expect(() => resolveEffectiveSubsidiaryId(scope)).toThrow(
      ForbiddenException,
    );
    expect(() => assertSubsidiaryAccess('', scope)).toThrow(ForbiddenException);
  });
});
