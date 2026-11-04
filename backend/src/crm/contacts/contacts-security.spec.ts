import { ContactsService } from './contacts.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { EmailService } from '../../common/utils/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ContactStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Contact credential exposure', () => {
  const contact = {
    id: 'contact',
    email: 'client@example.test',
    contactName: 'Client',
    status: ContactStatus.ACTIVE,
    subsidiaryId: 'branch-A',
    salesRepId: 'seller',
    passwordHash: bcrypt.hashSync('test-password', 4),
  };
  const prisma = {
    contact: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const emails = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
  const service = new ContactsService(
    prisma as unknown as PrismaService,
    { sign: () => 'contact-token' } as unknown as JwtService,
    emails as unknown as EmailService,
  );
  const user = {
    id: 'seller',
    subsidiaryId: 'branch-A',
    userRole: UserRole.ADMIN,
  } as User;

  beforeEach(() => jest.clearAllMocks());

  it('does not return password hashes on portal login', async () => {
    prisma.contact.findUnique.mockResolvedValue(contact);
    const response = await service.loginContact({
      email: contact.email,
      password: 'test-password',
    });
    expect(response.access_token).toBe('contact-token');
    expect(response.contact).not.toHaveProperty('passwordHash');
    expect(contact.passwordHash).toMatch(/^\$2/);
  });

  it('excludes credential fields from CRM list and detail database queries', async () => {
    const { passwordHash: _hash, ...safe } = contact;
    void _hash;
    prisma.contact.findMany.mockResolvedValue([safe]);
    prisma.contact.count.mockResolvedValue(1);
    prisma.contact.findUnique.mockResolvedValue(safe);
    const list = await service.findAll(user, {});
    const detail = await service.findOne(contact.id, user);
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { passwordHash: true } }),
    );
    expect(prisma.contact.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { passwordHash: true } }),
    );
    expect(list.data[0]).not.toHaveProperty('passwordHash');
    expect(detail).not.toHaveProperty('passwordHash');
  });

  it('removes hashes from newly created contact responses', async () => {
    prisma.contact.findUnique.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue(contact);
    const response = await service.create(
      { email: contact.email, contactName: 'Client' } as never,
      user,
    );
    expect(response).not.toHaveProperty('passwordHash');
    expect(emails.sendWelcomeEmail).toHaveBeenCalled();
  });
});
