import { Decimal } from '@prisma/client/runtime/library';
import { redactPasswordHashes } from './password-redaction.interceptor';

describe('Password hash redaction', () => {
  it('removes hashes from nested CRM and sales responses without mutating them', () => {
    const response = {
      data: [
        {
          customer: { id: 'client', passwordHash: 'secret' },
          salesRep: { passwordHash: 'staff-secret' },
        },
      ],
      meta: { total: 1 },
    };
    expect(redactPasswordHashes(response)).toEqual({
      data: [{ customer: { id: 'client' }, salesRep: {} }],
      meta: { total: 1 },
    });
    expect(response.data[0].customer.passwordHash).toBe('secret');
  });

  it('preserves dates, financial decimals, binary files and authentication responses', () => {
    const date = new Date();
    const amount = new Decimal('123.45');
    const file = Buffer.from('document');
    const response = {
      date,
      amount,
      file,
      access_token: 'token',
      contact: { passwordHash: 'secret' },
    };
    const safe = redactPasswordHashes(response) as typeof response;
    expect(safe.date).toBe(date);
    expect(safe.amount).toBe(amount);
    expect(safe.file).toBe(file);
    expect(safe.access_token).toBe('token');
    expect(safe.contact).toEqual({});
  });
});
