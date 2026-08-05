import { Test, TestingModule } from '@nestjs/testing';
import { SecretariatService } from './secretariat.service';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { LoggerService } from '../common/utils/logger/logger.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole, DocumentCategory, DocumentStatus, SecretariatTaskStatus } from '@prisma/client';

describe('SecretariatService', () => {
  let service: SecretariatService;
  let prismaService: PrismaService;
  let loggerService: LoggerService;

  const mockUser = {
    id: 'user-1',
    role: UserRole.SECRETARY,
    subsidiaryId: 'sub-1',
  };

  const mockAdmin = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    subsidiaryId: 'sub-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretariatService,
        {
          provide: PrismaService,
          useValue: {
            subsidiary: {
              findUnique: jest.fn(),
            },
            companyDocument: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            meeting: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            employee: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            secretariatTask: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn((fn) => fn(prismaService)),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SecretariatService>(SecretariatService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('CompanyDocument', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw BadRequestException if subsidiaryId missing', async () => {
      const dto = { documentName: '', category: DocumentCategory.LEGAL, status: DocumentStatus.DRAFT, subsidiaryId: '' };
      const file = { filename: 'test.pdf' } as Express.Multer.File;

      await expect(
        service.createCompanyDocument(dto, mockUser, file),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file missing', async () => {
      const dto = {
        documentName: 'test',
        category: DocumentCategory.LEGAL,
        status: DocumentStatus.DRAFT,
        subsidiaryId: 'sub-1',
      };

      await expect(
        service.createCompanyDocument(dto, mockUser, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if subsidiary not found', async () => {
      const dto = {
        documentName: 'test',
        category: DocumentCategory.LEGAL,
        status: DocumentStatus.DRAFT,
        subsidiaryId: 'sub-999',
      };
      const file = { filename: 'test.pdf' } as Express.Multer.File;

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createCompanyDocument(dto, mockUser, file),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if secretary tries to create for different subsidiary', async () => {
      const dto = {
        documentName: 'test',
        category: DocumentCategory.LEGAL,
        status: DocumentStatus.DRAFT,
        subsidiaryId: 'sub-2',
      };
      const file = { filename: 'test.pdf' } as Express.Multer.File;

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue({
        id: 'sub-2',
      } as any);

      await expect(
        service.createCompanyDocument(dto, mockUser, file),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create document successfully for admin', async () => {
      const dto = {
        documentName: 'test',
        category: DocumentCategory.LEGAL,
        status: DocumentStatus.DRAFT,
        subsidiaryId: 'sub-1',
      };
      const file = { filename: 'test.pdf' } as Express.Multer.File;
      const mockDocument = {
        id: 'DOC_test123',
        ...dto,
        fileUrl: '/public/uploads/secretariat/test.pdf',
        uploadDate: new Date(),
      };

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue({
        id: 'sub-1',
      } as any);
      jest.spyOn(prismaService.companyDocument, 'create').mockResolvedValue(mockDocument as any);

      const result = await service.createCompanyDocument(dto, mockAdmin, file);

      expect(result).toEqual(mockDocument);
    });
  });

  describe('Meeting', () => {
    it('should throw ForbiddenException if user is not SECRETARY or ADMIN', async () => {
      const data = {
        title: 'Team Meeting',
        meetingDateTime: new Date(),
        subsidiaryId: 'sub-1',
      };

      const invalidUser = { ...mockUser, role: UserRole.CAISSIER };

      await expect(
        service.createMeeting(data, invalidUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create meeting successfully', async () => {
      const data = {
        title: 'Team Meeting',
        meetingDateTime: new Date(),
        subsidiaryId: 'sub-1',
      };
      const mockMeeting = {
        id: 'MTG_test123',
        ...data,
      };

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue({
        id: 'sub-1',
      } as any);
      jest.spyOn(prismaService.meeting, 'create').mockResolvedValue(mockMeeting as any);

      const result = await service.createMeeting(data, mockUser);

      expect(result).toEqual(mockMeeting);
    });
  });

  describe('SecretariatTask', () => {
    it('should create task successfully', async () => {
      const dto = {
        title: 'Complete report',
        description: 'Complete the quarterly report',
        dueDate: new Date(),
        status: SecretariatTaskStatus.TODO,
        subsidiaryId: 'sub-1',
      };
      const mockTask = {
        id: 'SECRETARIATASK_test123',
        ...dto,
      };

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue({
        id: 'sub-1',
      } as any);
      jest.spyOn(prismaService.secretariatTask, 'create').mockResolvedValue(mockTask as any);

      const result = await service.createSecretariatTask(dto, mockUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if secretary tries to create for different subsidiary', async () => {
      const dto = {
        title: 'Complete report',
        description: 'Complete the quarterly report',
        dueDate: new Date(),
        status: SecretariatTaskStatus.TODO,
        subsidiaryId: 'sub-2',
      };

      jest.spyOn(prismaService.subsidiary, 'findUnique').mockResolvedValue({
        id: 'sub-2',
      } as any);

      await expect(
        service.createSecretariatTask(dto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
