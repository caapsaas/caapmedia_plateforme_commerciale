"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretariatService = void 0;
const role_identity_1 = require("../common/auth/role/role-identity");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../src/common/utils/prisma/prisma.service");
const logger_service_1 = require("../../src/common/utils/logger/logger.service");
const email_service_1 = require("../common/utils/email/email.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../src/common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../src/common/constants/id-prefixes.const");
const pagination_1 = require("../common/pagination/pagination");
const subsidiary_scope_1 = require("../common/utils/subsidiary-scope");
let SecretariatService = class SecretariatService {
    prisma;
    logger;
    emailService;
    constructor(prisma, logger, emailService) {
        this.prisma = prisma;
        this.logger = logger;
        this.emailService = emailService;
    }
    formatTaskDate(task) {
        if (task?.dueDate && task.dueDate instanceof Date) {
            return {
                ...task,
                dueDate: task.dueDate.toISOString().split('T')[0],
            };
        }
        return task;
    }
    formatTasksInResult(result) {
        if (Array.isArray(result.data)) {
            result.data = result.data.map((task) => this.formatTaskDate(task));
        }
        return result;
    }
    async createCompanyDocument(dto, currentUser, file) {
        const subsidiaryId = dto.subsidiaryId || currentUser.subsidiaryId;
        this.logger.log(`Attempting to create document "${dto.documentName}" for subsidiary ${subsidiaryId}`, 'SecretariatService');
        if (!dto || !subsidiaryId) {
            this.logger.error('Invalid or missing data provided (subsidiaryId required)', 'SecretariatService');
            throw new common_1.BadRequestException('Invalid or missing data (subsidiaryId required)');
        }
        if (!file) {
            this.logger.error('File is missing for document creation', 'SecretariatService');
            throw new common_1.BadRequestException('A file is required to create the document');
        }
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${subsidiaryId} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(subsidiary.id, (0, subsidiary_scope_1.resolveScopeContext)(currentUser));
        const fileUrl = `/api-caapmedia/private-documents/secretariat/${file.filename}`;
        const document = await this.prisma.companyDocument.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.COMPANYDOCUMENT),
                documentName: dto.documentName,
                category: dto.category,
                status: dto.status,
                fileUrl: fileUrl,
                subsidiaryId: subsidiaryId,
                createdBy: currentUser.id,
            },
        });
        this.logger.log(`Company document ${document.documentName} created successfully for subsidiary ${subsidiaryId}`, 'createCompanyDocument');
        return document;
    }
    async updateCompanyDocument(id, dto, currentUser, file) {
        const document = await this.prisma.companyDocument.findUnique({
            where: { id },
        });
        if (!document) {
            this.logger.error(`Company document with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Company document not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!(0, role_identity_1.isSuperAdmin)(currentUser) &&
            !allowedRoles.includes((0, role_identity_1.getActiveRole)(currentUser))) {
            this.logger.error(`User ${currentUser.id} is not authorized to update company document ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to update this company document');
        }
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(currentUser);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(document.subsidiaryId, ctx);
        const updateData = { ...dto };
        if (file) {
            updateData.fileUrl = `/api-caapmedia/private-documents/secretariat/${file.filename}`;
        }
        if (Object.keys(updateData).length === 0) {
            return document;
        }
        const updatedDocument = await this.prisma.companyDocument.update({
            where: { id },
            data: updateData,
        });
        this.logger.log(`Company document ${id} updated successfully`, 'SecretariatService');
        return updatedDocument;
    }
    async deleteCompanyDocument(id, currentUser) {
        const document = await this.prisma.companyDocument.findUnique({
            where: { id },
        });
        if (!document) {
            this.logger.error(`Company document with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Company document not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!(0, role_identity_1.isSuperAdmin)(currentUser) &&
            !allowedRoles.includes((0, role_identity_1.getActiveRole)(currentUser))) {
            this.logger.error(`User ${currentUser.id} is not authorized to delete company document ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to delete this company document');
        }
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(currentUser);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(document.subsidiaryId, ctx);
        await this.prisma.companyDocument.delete({ where: { id } });
        this.logger.log(`Company document ${id} deleted successfully`, 'SecretariatService');
        return { message: 'Company document deleted successfully' };
    }
    async getAllCompanyDocuments(ctx, paginationQuery = {}) {
        let where = {};
        if (paginationQuery.search) {
            where.documentName = {
                contains: paginationQuery.search,
                mode: 'insensitive',
            };
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.companyDocument, {
            where,
            include: {
                subsidiary: true,
                creator: { select: { id: true, userName: true } },
            },
            orderBy: { createdAt: 'desc' },
        }, paginationQuery);
        this.logger.log(`Retrieved ${result.data.length} company documents`, 'SecretariatService');
        return result;
    }
    async archiveCompanyDocument(id, currentUser) {
        const document = await this.prisma.companyDocument.findUnique({
            where: { id },
        });
        if (!document) {
            this.logger.error(`Company document with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Company document not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!(0, role_identity_1.isSuperAdmin)(currentUser) &&
            !allowedRoles.includes((0, role_identity_1.getActiveRole)(currentUser))) {
            this.logger.error(`User ${currentUser.id} is not authorized to archive company document ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to archive this company document');
        }
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(currentUser);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(document.subsidiaryId, ctx);
        const archivedDocument = await this.prisma.companyDocument.update({
            where: { id },
            data: { status: client_1.DocumentStatus.ARCHIVED },
        });
        this.logger.log(`Company document ${id} archived successfully`, 'SecretariatService');
        return archivedDocument;
    }
    async searchCompanyDocuments(query, ctx) {
        let where = {};
        if (!query.includeArchived) {
            where.status = { not: client_1.DocumentStatus.ARCHIVED };
        }
        if (query.documentName) {
            where.documentName = {
                contains: query.documentName,
                mode: 'insensitive',
            };
        }
        if (query.category) {
            where.category = query.category;
        }
        if (query.status) {
            where.status = query.status;
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.companyDocument, {
            where,
            include: {
                subsidiary: true,
                creator: { select: { id: true, userName: true } },
            },
            orderBy: { createdAt: 'desc' },
        }, query);
        this.logger.log(`Found ${result.data.length} company documents matching query`, 'SecretariatService');
        return result;
    }
    async createMeeting(data, currentUser) {
        const subsidiaryId = data.subsidiaryId || currentUser.subsidiaryId;
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to create a meeting`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to create a meeting');
        }
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${subsidiaryId} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        if (currentUser.role !== client_1.UserRole.ADMIN &&
            currentUser.subsidiaryId !== subsidiaryId) {
            this.logger.error(`User ${currentUser.id} cannot create meeting for subsidiary ${subsidiaryId}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Cannot create a meeting for another subsidiary');
        }
        const { meeting, participants } = await this.prisma.$transaction(async (tx) => {
            const createdMeeting = await tx.meeting.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.MEETING),
                    title: data.title,
                    meetingDateTime: data.meetingDateTime,
                    meetingLocation: data.meetingLocation,
                    agenda: data.agenda,
                    subsidiaryId: subsidiaryId,
                    createdBy: currentUser.id,
                },
            });
            let employees = [];
            if (data.participantIds && data.participantIds.length > 0) {
                employees = await tx.employee.findMany({
                    where: {
                        id: { in: data.participantIds },
                        subsidiaryId: subsidiaryId,
                    },
                    select: { email: true, firstName: true, lastName: true },
                });
                if (employees.length !== data.participantIds.length) {
                    this.logger.error(`Some employees not found or not from subsidiary ${subsidiaryId}`, 'SecretariatService');
                    throw new common_1.BadRequestException('Some employees not found or do not belong to the meeting subsidiary');
                }
                const participantData = data.participantIds.map((employeeId) => ({
                    meetingId: createdMeeting.id,
                    employeeId,
                }));
                await tx.meetingParticipant.createMany({
                    data: participantData,
                    skipDuplicates: true,
                });
            }
            return { meeting: createdMeeting, participants: employees };
        });
        this.logger.log(`Meeting ${meeting.title} created successfully`, 'SecretariatService');
        await this.sendMeetingInvitations(meeting, participants, currentUser.id);
        return meeting;
    }
    async sendMeetingInvitations(meeting, participants, organizerId) {
        if (participants.length === 0)
            return;
        try {
            const organizer = await this.prisma.user.findUnique({
                where: { id: organizerId },
                select: { userName: true },
            });
            for (const participant of participants) {
                this.emailService.sendMeetingInvitationEmail(participant.email, `${participant.firstName} ${participant.lastName}`, {
                    title: meeting.title,
                    meetingDateTime: meeting.meetingDateTime,
                    meetingLocation: meeting.meetingLocation,
                    agenda: meeting.agenda,
                    organizerName: organizer?.userName,
                });
            }
            this.logger.log(`${participants.length} meeting invitation(s) sent for meeting ${meeting.id}`, 'SecretariatService');
        }
        catch (error) {
            this.logger.error(`Failed to send meeting invitations for meeting ${meeting.id}: ${error instanceof Error ? error.message : String(error)}`, 'SecretariatService');
        }
    }
    async updateMeeting(id, data, currentUser) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id },
            include: { subsidiary: true },
        });
        if (!meeting) {
            this.logger.error(`Meeting with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Meeting not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to update meeting ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to update this meeting');
        }
        const ctx = {
            subsidiaryId: currentUser.subsidiaryId,
            hasGlobalScope: currentUser.role === client_1.UserRole.ADMIN,
        };
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(meeting.subsidiaryId, ctx);
        if (!data || Object.keys(data).length === 0) {
            return meeting;
        }
        const updatedMeeting = await this.prisma.$transaction(async (tx) => {
            const updateData = {};
            if (data.title)
                updateData.title = data.title;
            if (data.meetingDateTime)
                updateData.meetingDateTime = data.meetingDateTime;
            if (data.meetingLocation !== undefined)
                updateData.meetingLocation = data.meetingLocation;
            if (data.agenda !== undefined)
                updateData.agenda = data.agenda;
            if (data.minutes !== undefined) {
                updateData.minutes = data.minutes;
                updateData.minutesUpdatedBy = currentUser.id;
                updateData.minutesUpdatedAt = new Date();
            }
            const updated = await tx.meeting.update({
                where: { id },
                data: updateData,
            });
            if (data.participantIds !== undefined) {
                await tx.meetingParticipant.deleteMany({ where: { meetingId: id } });
                if (data.participantIds.length > 0) {
                    const employees = await tx.employee.findMany({
                        where: {
                            id: { in: data.participantIds },
                            subsidiaryId: meeting.subsidiaryId,
                        },
                    });
                    if (employees.length !== data.participantIds.length) {
                        this.logger.error(`Some employees not found or not from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
                        throw new common_1.BadRequestException('Some employees not found or do not belong to the specified subsidiary');
                    }
                    const participantData = data.participantIds.map((employeeId) => ({
                        meetingId: id,
                        employeeId,
                    }));
                    await tx.meetingParticipant.createMany({
                        data: participantData,
                        skipDuplicates: true,
                    });
                }
            }
            return updated;
        });
        this.logger.log(`Meeting ${id} updated successfully`, 'SecretariatService');
        return updatedMeeting;
    }
    async deleteMeeting(id, currentUser) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id },
            include: { subsidiary: true },
        });
        if (!meeting) {
            this.logger.error(`Meeting with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Meeting not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to delete meeting ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to delete this meeting');
        }
        const ctx = {
            subsidiaryId: currentUser.subsidiaryId,
            hasGlobalScope: currentUser.role === client_1.UserRole.ADMIN,
        };
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(meeting.subsidiaryId, ctx);
        await this.prisma.meeting.delete({ where: { id } });
        this.logger.log(`Meeting ${id} deleted successfully`, 'SecretariatService');
        return { message: 'Meeting deleted successfully' };
    }
    async getAllMeetings(ctx, paginationQuery = {}) {
        let where = {};
        if (paginationQuery.search) {
            where.title = { contains: paginationQuery.search, mode: 'insensitive' };
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.meeting, {
            where,
            include: {
                subsidiary: true,
                creator: { select: { id: true, userName: true } },
                participants: {
                    include: { employee: true },
                },
            },
            orderBy: { meetingDateTime: 'desc' },
        }, paginationQuery);
        this.logger.log(`Retrieved ${result.data.length} meetings`, 'SecretariatService');
        return result;
    }
    async searchMeetings(query, ctx) {
        let where = {};
        if (query.title) {
            where.title = { contains: query.title, mode: 'insensitive' };
        }
        if (query.meetingDateTime) {
            where.meetingDateTime = query.meetingDateTime;
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.meeting, {
            where,
            include: {
                subsidiary: true,
                creator: { select: { id: true, userName: true } },
                participants: {
                    include: { employee: true },
                },
            },
            orderBy: { meetingDateTime: 'desc' },
        }, query);
        this.logger.log(`Found ${result.data.length} meetings matching query`, 'SecretariatService');
        return result;
    }
    async addParticipantToMeeting(meetingId, employeeId, currentUser) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { subsidiary: true },
        });
        if (!meeting) {
            this.logger.error(`Meeting with ID ${meetingId} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Meeting not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Not authorized to add participants to this meeting');
        }
        if (currentUser.role !== client_1.UserRole.ADMIN &&
            currentUser.subsidiaryId !== meeting.subsidiaryId) {
            throw new common_1.ForbiddenException('Cannot add participants to a meeting from another subsidiary');
        }
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee || employee.subsidiaryId !== meeting.subsidiaryId) {
            this.logger.error(`Employee ${employeeId} not found or not from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
            throw new common_1.BadRequestException("Employee not found or does not belong to the meeting's subsidiary");
        }
        try {
            const participant = await this.prisma.meetingParticipant.create({
                data: { meetingId, employeeId },
                include: { employee: true, meeting: true },
            });
            this.logger.log(`Participant ${employeeId} added to meeting ${meetingId}`, 'SecretariatService');
            return participant;
        }
        catch (error) {
            if (error.code === 'P2002') {
                this.logger.warn(`Employee ${employeeId} already participant in meeting ${meetingId}`, 'SecretariatService');
                throw new common_1.BadRequestException('Employee is already a participant in this meeting');
            }
            throw error;
        }
    }
    async removeParticipantFromMeeting(meetingId, employeeId, currentUser) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { subsidiary: true },
        });
        if (!meeting) {
            this.logger.error(`Meeting with ID ${meetingId} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Meeting not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Not authorized to remove participants from this meeting');
        }
        if (currentUser.role !== client_1.UserRole.ADMIN &&
            currentUser.subsidiaryId !== meeting.subsidiaryId) {
            throw new common_1.ForbiddenException('Cannot remove participants from a meeting from another subsidiary');
        }
        await this.prisma.meetingParticipant.delete({
            where: {
                meetingId_employeeId: { meetingId, employeeId },
            },
        });
        this.logger.log(`Participant ${employeeId} removed from meeting ${meetingId}`, 'SecretariatService');
        return { message: 'Participant removed successfully' };
    }
    async createSecretariatTask(dto, currentUser) {
        const subsidiaryId = dto.subsidiaryId || currentUser.subsidiaryId;
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to create a secretariat task`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to create a secretariat task');
        }
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${subsidiaryId} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        if (currentUser.role !== client_1.UserRole.ADMIN &&
            currentUser.subsidiaryId !== subsidiaryId) {
            this.logger.error(`User ${currentUser.id} cannot create task for subsidiary ${subsidiaryId}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Cannot create a task for another subsidiary');
        }
        if (dto.assignedToId) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: dto.assignedToId },
            });
            if (!employee) {
                this.logger.error(`Employee with ID ${dto.assignedToId} not found`, 'SecretariatService');
                throw new common_1.NotFoundException('Assigned employee not found');
            }
        }
        const task = await this.prisma.secretariatTask.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SECRETARIATASK),
                ...dto,
                subsidiaryId: subsidiaryId,
                dueDate: new Date(dto.dueDate),
                createdBy: currentUser.id,
            },
            include: {
                subsidiary: true,
                assignedTo: true,
                creator: { select: { id: true, userName: true } },
            },
        });
        this.logger.log(`Secretariat task ${task.title} created successfully`, 'SecretariatService');
        return task;
    }
    async updateSecretariatTask(id, dto, currentUser) {
        const task = await this.prisma.secretariatTask.findUnique({
            where: { id },
        });
        if (!task) {
            this.logger.error(`Secretariat task with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Secretariat task not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to update secretariat task ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to update this secretariat task');
        }
        const ctx = {
            subsidiaryId: currentUser.subsidiaryId,
            hasGlobalScope: currentUser.role === client_1.UserRole.ADMIN,
        };
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(task.subsidiaryId, ctx);
        if (!dto || Object.keys(dto).length === 0) {
            return task;
        }
        if (dto.assignedToId) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: dto.assignedToId },
            });
            if (!employee) {
                this.logger.error(`Employee with ID ${dto.assignedToId} not found`, 'SecretariatService');
                throw new common_1.NotFoundException('Assigned employee not found');
            }
        }
        const updatedTask = await this.prisma.secretariatTask.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
            },
            include: { subsidiary: true, assignedTo: true },
        });
        this.logger.log(`Secretariat task ${id} updated successfully`, 'SecretariatService');
        return updatedTask;
    }
    async deleteSecretariatTask(id, currentUser) {
        const task = await this.prisma.secretariatTask.findUnique({
            where: { id },
        });
        if (!task) {
            this.logger.error(`Secretariat task with ID ${id} not found`, 'SecretariatService');
            throw new common_1.NotFoundException('Secretariat task not found');
        }
        const allowedRoles = [client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN];
        if (!allowedRoles.includes(currentUser.role)) {
            this.logger.error(`User ${currentUser.id} is not authorized to delete secretariat task ${id}`, 'SecretariatService');
            throw new common_1.ForbiddenException('Not authorized to delete this secretariat task');
        }
        const ctx = {
            subsidiaryId: currentUser.subsidiaryId,
            hasGlobalScope: currentUser.role === client_1.UserRole.ADMIN,
        };
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(task.subsidiaryId, ctx);
        await this.prisma.secretariatTask.delete({ where: { id } });
        this.logger.log(`Secretariat task ${id} deleted successfully`, 'SecretariatService');
        return { message: 'Secretariat task deleted successfully' };
    }
    async getAllSecretariatTasks(ctx, paginationQuery = {}) {
        let where = {};
        if (paginationQuery.search) {
            where.title = { contains: paginationQuery.search, mode: 'insensitive' };
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.secretariatTask, {
            where,
            include: {
                subsidiary: true,
                assignedTo: true,
                creator: { select: { id: true, userName: true } },
            },
            orderBy: { dueDate: 'asc' },
        }, paginationQuery);
        this.logger.log(`Retrieved ${result.data.length} secretariat tasks`, 'SecretariatService');
        return this.formatTasksInResult(result);
    }
    async searchSecretariatTasks(query, ctx) {
        let where = {};
        if (query.title) {
            where.title = { contains: query.title, mode: 'insensitive' };
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.dueDate) {
            where.dueDate = query.dueDate;
        }
        where = (0, subsidiary_scope_1.withSubsidiaryScope)(where, ctx);
        const result = await (0, pagination_1.paginate)(this.prisma.secretariatTask, {
            where,
            include: {
                subsidiary: true,
                assignedTo: true,
                creator: { select: { id: true, userName: true } },
            },
            orderBy: { dueDate: 'asc' },
        }, query);
        this.logger.log(`Found ${result.data.length} secretariat tasks matching query`, 'SecretariatService');
        return this.formatTasksInResult(result);
    }
};
exports.SecretariatService = SecretariatService;
exports.SecretariatService = SecretariatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        email_service_1.EmailService])
], SecretariatService);
//# sourceMappingURL=secretariat.service.js.map