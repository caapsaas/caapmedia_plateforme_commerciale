import { BadRequestException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { EmailService } from '../../common/utils/email/email.service';

describe('Occasional customer portal access', () => {
  it.each(['enablePortalAccess', 'resetContactPassword'] as const)(
    'requires an email before %s',
    async (method) => {
      const prisma = {
        contact: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'contact',
            email: null,
            subsidiaryId: 'branch',
          }),
          update: jest.fn(),
        },
      };
      const emails = {
        sendWelcomeEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
      };
      const service = new ContactsService(
        prisma as unknown as PrismaService,
        {} as JwtService,
        emails as unknown as EmailService,
      );
      await expect(
        service[method]('contact', {
          id: 'staff',
          subsidiaryId: 'branch',
          userRole: UserRole.ADMIN,
        } as User),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.contact.update).not.toHaveBeenCalled();
      expect(emails.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(emails.sendPasswordResetEmail).not.toHaveBeenCalled();
    },
  );
});
