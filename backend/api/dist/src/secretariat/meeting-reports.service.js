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
var MeetingReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingReportsService = exports.MEETING_REPORT_TYPES = exports.MEETING_REPORT_MAX_SIZE = void 0;
exports.validateMeetingReport = validateMeetingReport;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("../common/utils/prisma/prisma.service");
const document_storage_1 = require("../common/utils/document-storage");
const subsidiary_scope_1 = require("../common/utils/subsidiary-scope");
const role_identity_1 = require("../common/auth/role/role-identity");
exports.MEETING_REPORT_MAX_SIZE = 10 * 1024 * 1024;
exports.MEETING_REPORT_TYPES = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const PREFIX = `${document_storage_1.PRIVATE_DOCUMENT_PREFIX}meeting-reports/`;
function validateMeetingReport(file) {
    const extension = (0, path_1.extname)(file.originalname).toLowerCase();
    const buffer = file.buffer;
    if (!buffer?.length ||
        buffer.length > exports.MEETING_REPORT_MAX_SIZE ||
        !exports.MEETING_REPORT_TYPES[extension] ||
        exports.MEETING_REPORT_TYPES[extension] !== file.mimetype) {
        throw new common_1.BadRequestException('Un rapport PDF ou Word de 10 Mo maximum est requis.');
    }
    const valid = extension === '.pdf'
        ? buffer.subarray(0, 5).toString() === '%PDF-'
        : extension === '.doc'
            ? buffer
                .subarray(0, 8)
                .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
            : isWordArchive(buffer);
    if (!valid)
        throw new common_1.BadRequestException('Le contenu du rapport ne correspond pas au format annoncé.');
}
function isWordArchive(buffer) {
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50)
        return false;
    const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (end < 0 || end + 22 > buffer.length)
        return false;
    const directoryEnd = buffer.readUInt32LE(end + 16) + buffer.readUInt32LE(end + 12);
    let offset = buffer.readUInt32LE(end + 16);
    if (directoryEnd > end)
        return false;
    const names = new Set();
    while (offset < directoryEnd) {
        if (offset + 46 > directoryEnd ||
            buffer.readUInt32LE(offset) !== 0x02014b50)
            return false;
        const length = buffer.readUInt16LE(offset + 28);
        const entryEnd = offset +
            46 +
            length +
            buffer.readUInt16LE(offset + 30) +
            buffer.readUInt16LE(offset + 32);
        if (entryEnd > directoryEnd || buffer.readUInt16LE(offset + 8) & 1)
            return false;
        names.add(buffer.subarray(offset + 46, offset + 46 + length).toString('utf8'));
        offset = entryEnd;
    }
    return (names.has('[Content_Types].xml') &&
        names.has('word/document.xml') &&
        ![...names].some((name) => /vbaProject\.bin$/i.test(name)));
}
let MeetingReportsService = MeetingReportsService_1 = class MeetingReportsService {
    prisma;
    logger = new common_1.Logger(MeetingReportsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async authorizedMeeting(id, user) {
        const allowed = [client_1.UserRole.ADMIN, client_1.UserRole.SECRETARY];
        if (!(0, role_identity_1.isSuperAdmin)(user) && !allowed.includes((0, role_identity_1.getActiveRole)(user)))
            throw new common_1.ForbiddenException();
        const meeting = await this.prisma.meeting.findUnique({ where: { id } });
        if (!meeting)
            throw new common_1.NotFoundException('Réunion introuvable.');
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(meeting.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
        if (meeting.meetingDateTime > new Date())
            throw new common_1.BadRequestException('La réunion n’a pas encore commencé.');
        return meeting;
    }
    async complete(id, user) {
        const meeting = await this.authorizedMeeting(id, user);
        if (meeting.completedAt)
            return meeting;
        await this.prisma.meeting.updateMany({
            where: { id, subsidiaryId: meeting.subsidiaryId, completedAt: null },
            data: { completedAt: new Date() },
        });
        return this.prisma.meeting.findUniqueOrThrow({ where: { id } });
    }
    async upload(id, file, user) {
        const meeting = await this.authorizedMeeting(id, user);
        if (!meeting.completedAt)
            throw new common_1.BadRequestException('Terminez la réunion avant de joindre son rapport.');
        if (!file)
            throw new common_1.BadRequestException('Un fichier de rapport est requis.');
        validateMeetingReport(file);
        const filename = `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`;
        const directory = (0, path_1.join)(document_storage_1.PRIVATE_DOCUMENT_ROOT, 'meeting-reports');
        const path = (0, path_1.join)(directory, filename);
        await fs_1.promises.mkdir(directory, { recursive: true, mode: 0o700 });
        await fs_1.promises.writeFile(path, file.buffer, { flag: 'wx', mode: 0o600 });
        try {
            const updated = await this.prisma.meeting.updateMany({
                where: {
                    id,
                    subsidiaryId: meeting.subsidiaryId,
                    completedAt: { not: null },
                    minutesFileUrl: meeting.minutesFileUrl,
                },
                data: {
                    minutesFileUrl: `${PREFIX}${filename}`,
                    minutesFileName: (0, path_1.basename)(file.originalname.replace(/\\/g, '/'))
                        .replace(/\p{Cc}/gu, '')
                        .slice(0, 255),
                    minutesUpdatedBy: user.id,
                    minutesUpdatedAt: new Date(),
                },
            });
            if (updated.count !== 1)
                throw new common_1.ConflictException('Le rapport a changé. Actualisez la réunion avant de réessayer.');
        }
        catch (error) {
            await fs_1.promises.unlink(path);
            throw error;
        }
        if (meeting.minutesFileUrl?.startsWith(PREFIX)) {
            const oldFilename = meeting.minutesFileUrl.slice(PREFIX.length);
            if (/^[a-f0-9-]{36}\.(pdf|doc|docx)$/.test(oldFilename)) {
                try {
                    await fs_1.promises.unlink((0, path_1.join)(directory, oldFilename));
                }
                catch (error) {
                    if (error.code !== 'ENOENT')
                        this.logger.warn('Unable to clean up the previous meeting report.');
                }
            }
        }
        return this.prisma.meeting.findUniqueOrThrow({ where: { id } });
    }
};
exports.MeetingReportsService = MeetingReportsService;
exports.MeetingReportsService = MeetingReportsService = MeetingReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeetingReportsService);
//# sourceMappingURL=meeting-reports.service.js.map