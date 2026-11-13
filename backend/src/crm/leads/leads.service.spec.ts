import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LeadStatus, OpportunityStage, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { LeadsService } from './leads.service';

describe('LeadsService conversion', () => {
  const user = {
    id: 'user-1',
    email: 'commercial@example.test',
    subsidiaryId: 'douala',
    userRole: UserRole.COMMERCIAL,
  } as User;
  const lead = {
    id: 'lead-1',
    leadName: 'Marie N.',
    company: ' Société ABC ',
    sector: 'Commerce',
    email: 'marie@example.test',
    phone: '671890184',
    salesRepId: 'employee-1',
    subsidiaryId: user.subsidiaryId,
    status: LeadStatus.QUALIFIED,
  };
  const account = { id: 'account-1' };
  const contact = { id: 'contact-1', tempPassword: 'temporary' };
  const opportunity = { id: 'opportunity-1' };
  const tx = {
    account: { upsert: jest.fn().mockResolvedValue(account) },
    opportunity: { create: jest.fn().mockResolvedValue(opportunity) },
    lead: { delete: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    employee: { findUnique: jest.fn().mockResolvedValue({ id: 'employee-1' }) },
    lead: { findUnique: jest.fn().mockResolvedValue(lead) },
    $transaction: jest.fn((run: (client: typeof tx) => Promise<unknown>) =>
      run(tx),
    ),
  };
  const contacts = {
    create: jest.fn().mockResolvedValue(contact),
    sendWelcomeEmail: jest.fn(),
  };
  let service: LeadsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ContactsService, useValue: contacts },
      ],
    }).compile();
    service = module.get(LeadsService);
  });

  it('links the contact and opportunity to the company account in one transaction', async () => {
    await expect(service.convert(lead.id, user)).resolves.toMatchObject({
      account,
      contact,
      opportunity,
    });
    expect(tx.account.upsert.mock.calls[0]?.[0]).toMatchObject({
      where: {
        accountName_subsidiaryId: {
          accountName: 'Société ABC',
          subsidiaryId: user.subsidiaryId,
        },
      },
      update: {},
      create: { industry: lead.sector, salesRepId: user.id },
    });
    expect(contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: account.id,
        contactName: lead.leadName,
      }),
      user,
      tx,
    );
    expect(tx.opportunity.create.mock.calls[0]?.[0]).toMatchObject({
      data: {
        accountId: account.id,
        contactId: contact.id,
        stage: OpportunityStage.QUALIFICATION,
      },
    });
    expect(tx.lead.delete).toHaveBeenCalledWith({ where: { id: lead.id } });
    expect(contacts.sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps the lead and skips the welcome email when the contact cannot be created', async () => {
    contacts.create.mockRejectedValueOnce(new Error('Duplicate contact'));
    await expect(service.convert(lead.id, user)).rejects.toThrow(
      'Duplicate contact',
    );
    expect(tx.lead.delete).not.toHaveBeenCalled();
    expect(contacts.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('rejects a lead from a different subsidiary before starting the conversion', async () => {
    prisma.lead.findUnique.mockResolvedValueOnce({
      ...lead,
      subsidiaryId: 'other',
    });
    await expect(service.convert(lead.id, user)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
