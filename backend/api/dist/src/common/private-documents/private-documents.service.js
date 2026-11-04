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
exports.PrivateDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("../utils/prisma/prisma.service");
const document_storage_1 = require("../utils/document-storage");
const subsidiary_scope_1 = require("../utils/subsidiary-scope");
const role_identity_1 = require("../auth/role/role-identity");
const client_1 = require("@prisma/client");
let PrivateDocumentsService = class PrivateDocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        for (const [oldFolder, category] of [
            ['employee-documents', 'employee-documents'],
            ['uploads/secretariat', 'secretariat'],
        ]) {
            const source = (0, path_1.resolve)(process.cwd(), 'public', oldFolder);
            const target = (0, path_1.resolve)(document_storage_1.PRIVATE_DOCUMENT_ROOT, category);
            await fs_1.promises.mkdir(target, { recursive: true, mode: 0o700 });
            let entries;
            try {
                entries = await fs_1.promises.readdir(source);
            }
            catch (error) {
                if (error.code === 'ENOENT')
                    continue;
                throw error;
            }
            for (const entry of entries) {
                const destination = (0, path_1.join)(target, entry);
                try {
                    await fs_1.promises.lstat(destination);
                }
                catch (error) {
                    if (error.code !== 'ENOENT')
                        throw error;
                    await fs_1.promises.rename((0, path_1.join)(source, entry), destination);
                    continue;
                }
                throw new Error(`Private document migration collision: ${category}/${entry}`);
            }
        }
    }
    async resolveFile(category, filename, subsidiaryId, user) {
        const segments = [
            category,
            ...(subsidiaryId ? [subsidiaryId] : []),
            filename,
        ];
        if (!['employee-documents', 'secretariat', 'meeting-reports'].includes(category) ||
            segments.some((segment) => !/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/.test(segment))) {
            throw new common_1.NotFoundException();
        }
        const permitted = category === 'employee-documents'
            ? [client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER]
            : [client_1.UserRole.ADMIN, client_1.UserRole.SECRETARY];
        if (!(0, role_identity_1.isSuperAdmin)(user) && !permitted.includes((0, role_identity_1.getActiveRole)(user))) {
            throw new common_1.ForbiddenException();
        }
        const suffix = segments.join('/');
        const currentUrl = `${document_storage_1.PRIVATE_DOCUMENT_PREFIX}${suffix}`;
        const legacyUrl = category === 'secretariat'
            ? `/public/uploads/secretariat/${filename}`
            : `/public/${suffix}`;
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        if (category === 'meeting-reports') {
            if (subsidiaryId)
                throw new common_1.NotFoundException();
            const meeting = await this.prisma.meeting.findFirst({
                where: { minutesFileUrl: currentUrl },
                select: { subsidiaryId: true },
            });
            if (!meeting)
                throw new common_1.NotFoundException();
            (0, subsidiary_scope_1.assertSubsidiaryAccess)(meeting.subsidiaryId, ctx);
        }
        else if (category === 'secretariat') {
            if (subsidiaryId)
                throw new common_1.NotFoundException();
            const document = await this.prisma.companyDocument.findFirst({
                where: { fileUrl: { in: [currentUrl, legacyUrl] } },
                select: { subsidiaryId: true },
            });
            if (!document)
                throw new common_1.NotFoundException();
            (0, subsidiary_scope_1.assertSubsidiaryAccess)(document.subsidiaryId, ctx);
        }
        else {
            const documents = await this.prisma.employeeDocument.findMany({
                where: { url: { in: [currentUrl, legacyUrl] } },
                select: { employee: { select: { subsidiaryId: true } } },
            });
            if (documents.length) {
                for (const document of documents)
                    (0, subsidiary_scope_1.assertSubsidiaryAccess)(document.employee.subsidiaryId, ctx);
            }
            else {
                if (!subsidiaryId)
                    throw new common_1.NotFoundException();
                (0, subsidiary_scope_1.assertSubsidiaryAccess)(subsidiaryId, ctx);
            }
        }
        try {
            const root = await fs_1.promises.realpath(document_storage_1.PRIVATE_DOCUMENT_ROOT);
            const path = await fs_1.promises.realpath((0, path_1.resolve)(root, ...segments));
            const rel = (0, path_1.relative)(root, path);
            if (rel.startsWith('..') ||
                (0, path_1.isAbsolute)(rel) ||
                !(await fs_1.promises.stat(path)).isFile())
                throw new common_1.NotFoundException();
            return path;
        }
        catch (error) {
            if (error.code === 'ENOENT')
                throw new common_1.NotFoundException();
            throw error;
        }
    }
};
exports.PrivateDocumentsService = PrivateDocumentsService;
exports.PrivateDocumentsService = PrivateDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrivateDocumentsService);
//# sourceMappingURL=private-documents.service.js.map