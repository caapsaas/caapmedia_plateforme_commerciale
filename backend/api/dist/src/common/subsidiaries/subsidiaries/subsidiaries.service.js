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
exports.SubsidiaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const logger_service_1 = require("../../utils/logger/logger.service");
const file_upload_service_1 = require("../../utils/file-upload.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../utils/generate-id.util");
const id_prefixes_const_1 = require("../../constants/id-prefixes.const");
const pagination_1 = require("../../pagination/pagination");
let SubsidiaryService = class SubsidiaryService {
    prisma;
    logger;
    fileUploadService;
    constructor(prisma, logger, fileUploadService) {
        this.prisma = prisma;
        this.logger = logger;
        this.fileUploadService = fileUploadService;
    }
    hasAdminPrivileges(currentUser) {
        const callerRoles = currentUser?.roles?.length
            ? currentUser.roles
            : currentUser?.role
                ? [currentUser.role]
                : [];
        return (callerRoles.includes(client_1.UserRole.ADMIN) ||
            callerRoles.includes(client_1.UserRole.SUPER_ADMIN));
    }
    hasSuperAdminPrivileges(currentUser) {
        const callerRoles = currentUser?.roles?.length
            ? currentUser.roles
            : currentUser?.role
                ? [currentUser.role]
                : [];
        return callerRoles.includes(client_1.UserRole.SUPER_ADMIN);
    }
    async createSubsidiary(data, currentUser) {
        if (!this.hasSuperAdminPrivileges(currentUser)) {
            this.logger.error(`User ${currentUser.id} is not authorized to create a subsidiary`, 'SubsidiaryService');
            throw new common_1.ForbiddenException('You are not authorized to create a subsidiary');
        }
        const existingSubsidiary = await this.prisma.subsidiary.findUnique({
            where: { email: data.email },
        });
        if (existingSubsidiary) {
            this.logger.error(`Subsidiary with email ${data.email} already exists`, 'SubsidiaryService');
            throw new common_1.ConflictException('Email already in use');
        }
        const subsidiary = await this.prisma.subsidiary.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SUBSIDIARY),
                subsidiaryName: data.subsidiaryName,
                logoSvg: data.logoSvg || '',
                address: data.address,
                phone: data.phone,
                email: data.email,
                ifu: data.ifu,
                rccm: data.rccm,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode,
                shareCapital: Number(data.shareCapital),
                taxRate: data.taxRate !== undefined ? data.taxRate : 0.3,
                isHeadquarter: data.isHeadquarter ?? false,
            },
        });
        this.logger.log(`Subsidiary ${subsidiary.subsidiaryName} created successfully`, 'SubsidiaryService');
        return {
            id: subsidiary.id,
            subsidiaryName: subsidiary.subsidiaryName,
            name: subsidiary.subsidiaryName,
            logoSvg: subsidiary.logoSvg,
            email: subsidiary.email,
            address: subsidiary.address,
            phone: subsidiary.phone,
            ifu: subsidiary.ifu,
            rccm: subsidiary.rccm,
            bankName: subsidiary.bankName,
            accountNumber: subsidiary.accountNumber,
            swiftCode: subsidiary.swiftCode,
            shareCapital: Number(subsidiary.shareCapital),
            taxRate: subsidiary.taxRate.toNumber(),
            isHeadquarter: subsidiary.isHeadquarter,
        };
    }
    async updateSubsidiary(id, data, currentUser) {
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${id} not found`, 'SubsidiaryService');
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        if (!this.hasSuperAdminPrivileges(currentUser)) {
            this.logger.error(`User ${currentUser.id} is not authorized to update subsidiary ${id}`, 'SubsidiaryService');
            throw new common_1.ForbiddenException('You are not authorized to update this subsidiary');
        }
        if (data.email && data.email !== subsidiary.email) {
            const existingSubsidiary = await this.prisma.subsidiary.findUnique({
                where: { email: data.email },
            });
            if (existingSubsidiary) {
                this.logger.error(`Email ${data.email} is already in use`, 'SubsidiaryService');
                throw new common_1.ConflictException('Email already in use');
            }
        }
        const updatedSubsidiary = await this.prisma.subsidiary.update({
            where: { id },
            data: {
                ...data,
                shareCapital: data.shareCapital !== undefined ? Number(data.shareCapital) : undefined,
            },
        });
        this.logger.log(`Subsidiary ${id} updated successfully`, 'SubsidiaryService');
        return {
            id: updatedSubsidiary.id,
            subsidiaryName: updatedSubsidiary.subsidiaryName,
            name: updatedSubsidiary.subsidiaryName,
            logoSvg: updatedSubsidiary.logoSvg,
            email: updatedSubsidiary.email,
            address: updatedSubsidiary.address,
            phone: updatedSubsidiary.phone,
            ifu: updatedSubsidiary.ifu,
            rccm: updatedSubsidiary.rccm,
            bankName: updatedSubsidiary.bankName,
            accountNumber: updatedSubsidiary.accountNumber,
            swiftCode: updatedSubsidiary.swiftCode,
            shareCapital: Number(updatedSubsidiary.shareCapital),
            taxRate: updatedSubsidiary.taxRate.toNumber(),
            isHeadquarter: updatedSubsidiary.isHeadquarter,
        };
    }
    async uploadLogo(id, file, currentUser) {
        const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id } });
        if (!subsidiary) {
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        if (!this.hasSuperAdminPrivileges(currentUser)) {
            throw new common_1.ForbiddenException('You are not authorized to update this subsidiary logo');
        }
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('Aucun fichier fourni pour le logo');
        }
        const { url } = await this.fileUploadService.uploadFile(file.buffer, file.originalname, {
            subfolder: 'subsidiaries',
            maxSizeMb: 5,
            allowedMimes: [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/svg+xml',
                'image/webp',
            ],
        });
        const updated = await this.prisma.subsidiary.update({
            where: { id },
            data: { logoSvg: url },
        });
        return {
            id: updated.id,
            subsidiaryName: updated.subsidiaryName,
            name: updated.subsidiaryName,
            logoSvg: updated.logoSvg,
        };
    }
    async deleteSubsidiary(id, currentUser) {
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${id} not found`, 'SubsidiaryService');
            throw new common_1.NotFoundException('Subsidiary not found');
        }
        if (!this.hasSuperAdminPrivileges(currentUser)) {
            this.logger.error(`User ${currentUser.id} is not authorized to delete subsidiary ${id}`, 'SubsidiaryService');
            throw new common_1.ForbiddenException('You are not authorized to delete this subsidiary');
        }
        const userCount = await this.prisma.user.count({ where: { subsidiaryId: id } });
        if (userCount > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer la filiale car ${userCount} utilisateur(s) lui sont actuellement rattaché(s). Veuillez d'abord réassigner ou supprimer ces utilisateurs.`);
        }
        try {
            await this.prisma.subsidiary.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('Impossible de supprimer cette filiale car des données associées (commandes, stocks, etc.) existent encore.');
            }
            throw error;
        }
        this.logger.log(`Subsidiary ${id} deleted successfully`, 'SubsidiaryService');
        return { message: 'Subsidiary deleted successfully' };
    }
    async getAllSubsidiaries(currentUser, paginationQuery = {}) {
        const isGlobalScope = this.hasAdminPrivileges(currentUser);
        const where = isGlobalScope ? {} : { id: currentUser.subsidiaryId };
        if (paginationQuery.search && paginationQuery.search.trim() !== '') {
            const term = paginationQuery.search.trim();
            where.OR = [
                { subsidiaryName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { address: { contains: term, mode: 'insensitive' } },
            ];
        }
        const result = await (0, pagination_1.paginate)(this.prisma.subsidiary, { where, orderBy: { subsidiaryName: 'asc' } }, paginationQuery);
        this.logger.log(`Retrieved ${result.data.length} subsidiaries`, 'SubsidiaryService');
        return {
            ...result,
            data: result.data.map((subsidiary) => ({
                id: subsidiary.id,
                subsidiaryName: subsidiary.subsidiaryName,
                name: subsidiary.subsidiaryName,
                logoSvg: subsidiary.logoSvg,
                email: subsidiary.email,
                address: subsidiary.address,
                phone: subsidiary.phone,
                ifu: subsidiary.ifu,
                rccm: subsidiary.rccm,
                bankName: subsidiary.bankName,
                accountNumber: subsidiary.accountNumber,
                swiftCode: subsidiary.swiftCode,
                shareCapital: Number(subsidiary.shareCapital),
                taxRate: subsidiary.taxRate.toNumber(),
                isHeadquarter: subsidiary.isHeadquarter,
            })),
        };
    }
    async searchSubsidiaries(query, currentUser) {
        const isGlobalScope = this.hasAdminPrivileges(currentUser);
        const where = isGlobalScope ? {} : { id: currentUser.subsidiaryId };
        if (query.subsidiaryName) {
            where.subsidiaryName = {
                contains: query.subsidiaryName,
                mode: 'insensitive',
            };
        }
        if (query.email) {
            where.email = { contains: query.email, mode: 'insensitive' };
        }
        if (query.search && query.search.trim() !== '') {
            const term = query.search.trim();
            where.OR = [
                { subsidiaryName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
            ];
        }
        const result = await (0, pagination_1.paginate)(this.prisma.subsidiary, { where, orderBy: { subsidiaryName: 'asc' } }, query);
        this.logger.log(`Found ${result.data.length} subsidiaries matching query`, 'SubsidiaryService');
        return {
            ...result,
            data: result.data.map((subsidiary) => ({
                id: subsidiary.id,
                subsidiaryName: subsidiary.subsidiaryName,
                name: subsidiary.subsidiaryName,
                logoSvg: subsidiary.logoSvg,
                email: subsidiary.email,
                address: subsidiary.address,
                phone: subsidiary.phone,
                ifu: subsidiary.ifu,
                rccm: subsidiary.rccm,
                bankName: subsidiary.bankName,
                accountNumber: subsidiary.accountNumber,
                swiftCode: subsidiary.swiftCode,
                shareCapital: Number(subsidiary.shareCapital),
                taxRate: subsidiary.taxRate.toNumber(),
                isHeadquarter: subsidiary.isHeadquarter,
            })),
        };
    }
};
exports.SubsidiaryService = SubsidiaryService;
exports.SubsidiaryService = SubsidiaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        file_upload_service_1.FileUploadService])
], SubsidiaryService);
//# sourceMappingURL=subsidiaries.service.js.map