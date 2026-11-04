import type { Request } from 'express';
import { MeetingReportsService } from './meeting-reports.service';
import { LoggerService } from '../common/utils/logger/logger.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SecretariatController } from './secretariat.controller';
import { SecretariatService } from './secretariat.service';
import { UserRole } from '@prisma/client';

describe('SecretariatController', () => {
  let controller: SecretariatController;
  let service: SecretariatService;

  const mockUser = {
    id: 'user-1',
    role: UserRole.SECRETARY,
    subsidiaryId: 'sub-1',
  };

  const mockRequest = { user: mockUser } as unknown as Request;
  const mockScope = {
    subsidiaryId: mockUser.subsidiaryId,
    hasGlobalScope: false,
  };

  const mockPaginationQuery = {
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretariatController],
      providers: [
        {
          provide: MeetingReportsService,
          useValue: { complete: jest.fn(), upload: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        {
          provide: SecretariatService,
          useValue: {
            createCompanyDocument: jest.fn(),
            updateCompanyDocument: jest.fn(),
            deleteCompanyDocument: jest.fn(),
            getAllCompanyDocuments: jest.fn(),
            searchCompanyDocuments: jest.fn(),
            createMeeting: jest.fn(),
            updateMeeting: jest.fn(),
            deleteMeeting: jest.fn(),
            getAllMeetings: jest.fn(),
            searchMeetings: jest.fn(),
            addParticipantToMeeting: jest.fn(),
            removeParticipantFromMeeting: jest.fn(),
            createSecretariatTask: jest.fn(),
            updateSecretariatTask: jest.fn(),
            deleteSecretariatTask: jest.fn(),
            getAllSecretariatTasks: jest.fn(),
            searchSecretariatTasks: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SecretariatController>(SecretariatController);
    service = module.get<SecretariatService>(SecretariatService);
  });

  describe('CompanyDocument endpoints', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should call getAllCompanyDocuments', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest
        .spyOn(service, 'getAllCompanyDocuments')
        .mockResolvedValue(mockResult);

      const result = await controller.getAllCompanyDocuments(
        mockRequest,
        mockPaginationQuery,
      );

      expect(service.getAllCompanyDocuments).toHaveBeenCalledWith(
        mockScope,
        mockPaginationQuery,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call searchCompanyDocuments', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest
        .spyOn(service, 'searchCompanyDocuments')
        .mockResolvedValue(mockResult);

      const query = { documentName: 'test', page: 1, limit: 10 };
      const result = await controller.searchCompanyDocuments(
        query,
        mockRequest,
      );

      expect(service.searchCompanyDocuments).toHaveBeenCalledWith(
        query,
        mockScope,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('Meeting endpoints', () => {
    it('should call getAllMeetings', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest.spyOn(service, 'getAllMeetings').mockResolvedValue(mockResult);

      const result = await controller.getAllMeetings(
        mockRequest,
        mockPaginationQuery,
      );

      expect(service.getAllMeetings).toHaveBeenCalledWith(
        mockScope,
        mockPaginationQuery,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call searchMeetings', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest.spyOn(service, 'searchMeetings').mockResolvedValue(mockResult);

      const query = { title: 'test', page: 1, limit: 10 };
      const result = await controller.searchMeetings(query, mockRequest);

      expect(service.searchMeetings).toHaveBeenCalledWith(query, mockScope);
      expect(result).toEqual(mockResult);
    });

    it('should call addParticipantToMeeting', async () => {
      const mockResult = {
        meetingId: 'mtg-1',
        employeeId: 'emp-1',
        meeting: {
          id: 'mtg-1',
          title: 'Test Meeting',
          meetingDateTime: new Date(),
          meetingLocation: 'Office',
          agenda: 'Test agenda',
          minutes: null,
          minutesUpdatedBy: null,
          minutesUpdatedAt: null,
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          subsidiaryId: 'sub-1',
        },
        employee: {
          id: 'emp-1',
          lastName: 'Doe',
          firstName: 'John',
          birthDate: new Date(),
          address: 'Test Address',
          phone: '1234567890',
          email: 'john@test.com',
          nationality: 'Cameroonian',
          socialSecurityNumber: '123456',
          positions: 'Manager',
          department: 'Admin',
          hireDate: new Date(),
          workLocation: 'Office',
          baseSalary: 1000,
          bonus: 100,
          benefits: [],
          lastSalaryAdjustmentDate: null,
          leaveBalance: 20,
          bankName: 'Bank',
          bankAccountNumber: '123456',
          numberDependents: 2,
          situationMatrimony: 'MARRIED',
          cnpsNumber: '123',
          cnpsNumberEncrypted: '456',
          categoryCodeCNPS: 'B',
          taxIdNTif: '789',
          subsidiaryId: 'sub-1',
          managerId: null,
          gender: 'M',
          contractType: 'PERMANENT',
          status: 'ACTIVE',
          paymentMethod: 'BANK_TRANSFER',
        } as any,
      } as any;
      jest
        .spyOn(service, 'addParticipantToMeeting')
        .mockResolvedValue(mockResult);

      const result = await controller.addParticipantToMeeting(
        'mtg-1',
        'emp-1',
        mockRequest,
      );

      expect(service.addParticipantToMeeting).toHaveBeenCalledWith(
        'mtg-1',
        'emp-1',
        mockUser,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call removeParticipantFromMeeting', async () => {
      const mockResult = { message: 'Participant removed successfully' };
      jest
        .spyOn(service, 'removeParticipantFromMeeting')
        .mockResolvedValue(mockResult);

      const result = await controller.removeParticipantFromMeeting(
        'mtg-1',
        'emp-1',
        mockRequest,
      );

      expect(service.removeParticipantFromMeeting).toHaveBeenCalledWith(
        'mtg-1',
        'emp-1',
        mockUser,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('SecretariatTask endpoints', () => {
    it('should call getAllSecretariatTasks', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest
        .spyOn(service, 'getAllSecretariatTasks')
        .mockResolvedValue(mockResult);

      const result = await controller.getAllSecretariatTasks(
        mockRequest,
        mockPaginationQuery,
      );

      expect(service.getAllSecretariatTasks).toHaveBeenCalledWith(
        mockScope,
        mockPaginationQuery,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call searchSecretariatTasks', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      jest
        .spyOn(service, 'searchSecretariatTasks')
        .mockResolvedValue(mockResult);

      const query = { title: 'test', page: 1, limit: 10 };
      const result = await controller.searchSecretariatTasks(
        query,
        mockRequest,
      );

      expect(service.searchSecretariatTasks).toHaveBeenCalledWith(
        query,
        mockScope,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
