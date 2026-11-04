"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const logger_service_1 = require("../../utils/logger/logger.service");
const bcrypt = __importStar(require("bcryptjs"));
const client_1 = require("@prisma/client");
const nodemailer = __importStar(require("nodemailer"));
const crypto_1 = require("crypto");
const refresh_token_service_1 = require("./refresh-token.service");
const generate_id_util_1 = require("../../utils/generate-id.util");
const id_prefixes_const_1 = require("../../constants/id-prefixes.const");
const pagination_1 = require("../../pagination/pagination");
let AuthService = class AuthService {
    prisma;
    jwtService;
    logger;
    refreshTokenService;
    constructor(prisma, jwtService, logger, refreshTokenService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = logger;
        this.refreshTokenService = refreshTokenService;
    }
    assertCanAssignSuperAdmin(roles, currentUser) {
        if (!roles.includes(client_1.UserRole.SUPER_ADMIN))
            return;
        const callerRoles = currentUser?.roles?.length
            ? currentUser.roles
            : currentUser?.role
                ? [currentUser.role]
                : [];
        if (!callerRoles.includes(client_1.UserRole.SUPER_ADMIN)) {
            throw new common_1.ForbiddenException('Seul un SUPER_ADMIN peut attribuer ce rôle');
        }
    }
    hasAdminPrivileges(currentUser) {
        if (currentUser?.roles?.includes(client_1.UserRole.SUPER_ADMIN))
            return true;
        return (currentUser?.activeRole ?? currentUser?.role) === client_1.UserRole.ADMIN;
    }
    hasGlobalAdminPrivileges(currentUser) {
        const callerRoles = currentUser?.roles?.length
            ? currentUser.roles
            : currentUser?.role
                ? [currentUser.role]
                : [];
        return callerRoles.includes(client_1.UserRole.SUPER_ADMIN);
    }
    async register(userName, email, password, role, subsidiaryId, additionalRoles = [], currentUser) {
        this.assertCanAssignSuperAdmin([role, ...additionalRoles], currentUser);
        if (!subsidiaryId || subsidiaryId.trim() === '') {
            this.logger.error('Subsidiary ID is required for registration', 'AuthService');
            throw new common_1.BadRequestException('Subsidiary ID is required');
        }
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiary) {
            this.logger.error(`Subsidiary with ID ${subsidiaryId} not found`, 'AuthService');
            throw new common_1.NotFoundException('Invalid subsidiary ID');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            this.logger.error(`User with email ${email} already exists`, 'AuthService');
            throw new common_1.ConflictException('Email already in use');
        }
        if (!password) {
            this.logger.error('Password is required for registration', 'AuthService');
            throw new common_1.BadRequestException('Password is required');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const dedupedAdditionalRoles = additionalRoles.filter((r) => r !== role);
        const user = await this.prisma.user.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.USER),
                userName,
                email,
                passwordHash,
                userRole: role,
                additionalRoles: dedupedAdditionalRoles,
                roles: [role, ...dedupedAdditionalRoles],
                subsidiaryId,
            },
        });
        this.logger.log(`User ${email} registered successfully`, 'AuthService');
        return { message: 'User registered successfully', userId: user.id };
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { subsidiary: true },
        });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            this.logger.error(`Invalid credentials for email ${email}`, 'AuthService');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.twoFactorEnabled) {
            const pendingToken = this.jwtService.sign({ sub: user.id, type: 'pending_2fa' }, { expiresIn: '5m' });
            this.logger.log(`User ${email} password OK, 2FA requise`, 'AuthService');
            return { twoFactorRequired: true, pendingToken };
        }
        this.logger.log(`User ${email} logged in successfully`, 'AuthService');
        return {
            twoFactorRequired: false,
            user,
            subsidiary: user.subsidiary,
        };
    }
    async issueTokens(user, meta = {}) {
        const roles = user.roles.length > 0
            ? user.roles
            : [
                user.userRole,
                ...user.additionalRoles.filter((r) => r !== user.userRole),
            ];
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.userRole,
            roles,
            subsidiaryId: user.subsidiaryId,
        };
        const accessToken = this.jwtService.sign(payload);
        const { token: refreshToken } = await this.refreshTokenService.issue(user.id, meta);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                userName: user.userName,
                userRole: user.userRole,
                role: user.userRole,
                activeRole: user.activeRole ?? user.userRole,
                roles,
                additionalRoles: user.additionalRoles,
                subsidiaryId: user.subsidiaryId,
                twoFactorEnabled: user.twoFactorEnabled,
            },
        };
    }
    async refresh(presentedRefreshToken, meta = {}) {
        const { userId, issued } = await this.refreshTokenService.rotate(presentedRefreshToken, meta);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { subsidiary: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur introuvable');
        }
        const roles = user.roles.length > 0
            ? user.roles
            : [
                user.userRole,
                ...user.additionalRoles.filter((r) => r !== user.userRole),
            ];
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.userRole,
            roles,
            subsidiaryId: user.subsidiaryId,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken, refreshToken: issued.token };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'If the account exists, a reset link has been sent.' };
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const frontendUrl = process.env.FRONTEND_URL;
        if (!smtpHost || !smtpUser || !smtpPass || !frontendUrl) {
            this.logger.error('Password reset email configuration is incomplete (SMTP_HOST, SMTP_USER, SMTP_PASS, FRONTEND_URL).', 'AuthService');
            throw new Error('Password reset email service is not configured.');
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        await this.prisma.$transaction([
            this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
            this.prisma.passwordResetToken.create({
                data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
            }),
        ]);
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
        const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
        await transporter.sendMail({
            from: process.env.SMTP_FROM || smtpUser,
            to: user.email,
            subject: 'CaapMedia — Réinitialisation de votre mot de passe',
            text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure et utilisable une seule fois) :\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez ce message.`,
            html: `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, cliquez sur le lien ci-dessous. Il est valable une heure et ne peut être utilisé qu'une fois.</p><p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p><p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>`,
        });
        this.logger.log(`Password reset email sent to user ${user.id}`, 'AuthService');
        return { message: 'If the account exists, a reset link has been sent.' };
    }
    async resetPassword(token, password) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
            throw new common_1.BadRequestException('This password reset link is invalid or has expired.');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await this.prisma.$transaction(async (tx) => {
            const consumed = await tx.passwordResetToken.updateMany({
                where: { id: reset.id, usedAt: null, expiresAt: { gt: new Date() } },
                data: { usedAt: new Date() },
            });
            if (consumed.count !== 1)
                throw new common_1.BadRequestException('This password reset link is invalid or has expired.');
            await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
            await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId, id: { not: reset.id } } });
            await tx.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } });
        });
        return { message: 'Password updated successfully.' };
    }
    async updateUser(id, data, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            this.logger.error(`User with ID ${id} not found`, 'AuthService');
            throw new common_1.NotFoundException('User not found');
        }
        const isSelf = currentUser.id === id;
        const changesAccess = data.userRole !== undefined ||
            data.additionalRoles !== undefined ||
            data.subsidiaryId !== undefined;
        const isAdmin = this.hasAdminPrivileges(currentUser);
        const hasGlobalAccess = this.hasGlobalAdminPrivileges(currentUser);
        if (isSelf && changesAccess) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas modifier vos propres rôles ou votre filiale');
        }
        if (!isSelf && !isAdmin) {
            throw new common_1.ForbiddenException('Seuls les administrateurs peuvent gérer les comptes des utilisateurs');
        }
        if (data.userRole !== undefined || data.additionalRoles !== undefined) {
            this.assertCanAssignSuperAdmin([
                data.userRole ?? user.userRole,
                ...(data.additionalRoles ?? user.additionalRoles),
            ], currentUser);
        }
        if (!hasGlobalAccess && user.subsidiaryId !== currentUser.subsidiaryId) {
            throw new common_1.ForbiddenException('You can only manage users from your own subsidiary');
        }
        if (data.subsidiaryId) {
            const subsidiary = await this.prisma.subsidiary.findUnique({
                where: { id: data.subsidiaryId },
            });
            if (!subsidiary) {
                this.logger.error(`Subsidiary with ID ${data.subsidiaryId} not found`, 'AuthService');
                throw new common_1.NotFoundException('Invalid subsidiary ID');
            }
            if (!hasGlobalAccess && data.subsidiaryId !== user.subsidiaryId) {
                this.logger.error(`User ${currentUser.id} cannot update subsidiary for user ${id}`, 'AuthService');
                throw new common_1.ForbiddenException('You cannot update the subsidiary of this user');
            }
        }
        if (data.email && data.email.trim() !== '' && data.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingUser) {
                this.logger.error(`Email ${data.email} is already in use`, 'AuthService');
                throw new common_1.ConflictException('Email already in use');
            }
        }
        const updateData = { ...data };
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }
        if (data.additionalRoles !== undefined || data.userRole !== undefined) {
            const primaryRole = data.userRole ?? user.userRole;
            const additionalRoles = (data.additionalRoles ?? user.additionalRoles).filter((r) => r !== primaryRole);
            updateData.additionalRoles = additionalRoles;
            updateData.roles = [primaryRole, ...additionalRoles];
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { subsidiary: true },
        });
        this.logger.log(`User ${id} updated successfully`, 'AuthService');
        return {
            id: updatedUser.id,
            userName: updatedUser.userName,
            email: updatedUser.email,
            userRole: updatedUser.userRole,
            additionalRoles: updatedUser.additionalRoles,
            subsidiaryId: updatedUser.subsidiaryId,
            subsidiary: updatedUser.subsidiary
                ? {
                    id: updatedUser.subsidiary.id,
                    subsidiaryName: updatedUser.subsidiary.subsidiaryName,
                    name: updatedUser.subsidiary.subsidiaryName,
                }
                : null,
        };
    }
    async deleteUser(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            this.logger.error(`User with ID ${id} not found`, 'AuthService');
            throw new common_1.NotFoundException('User not found');
        }
        const isAdmin = this.hasAdminPrivileges(currentUser);
        const hasGlobalAccess = this.hasGlobalAdminPrivileges(currentUser);
        if (!isAdmin) {
            this.logger.error(`User ${currentUser.id} is not authorized to delete user ${id}`, 'AuthService');
            throw new common_1.ForbiddenException('You are not authorized to delete this user');
        }
        if (currentUser.id === id) {
            throw new common_1.BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
        }
        if (!hasGlobalAccess && user.subsidiaryId !== currentUser.subsidiaryId) {
            this.logger.error(`User ${currentUser.id} cannot delete user from another subsidiary`, 'AuthService');
            throw new common_1.ForbiddenException('You cannot delete a user from another subsidiary');
        }
        const [journalCount, cashRemittanceCount, externalTxCount, prefinancementCount, proformaCount,] = await Promise.all([
            this.prisma.journalEntry.count({ where: { createdBy: id } }),
            this.prisma.cashRemittance.count({ where: { createdByUserId: id } }),
            this.prisma.externalFinancialTransaction.count({
                where: { createdBy: id },
            }),
            this.prisma.prefinancementAccount.count({ where: { userId: id } }),
            this.prisma.proforma.count({ where: { createdBy: id } }),
        ]);
        if (journalCount > 0 ||
            cashRemittanceCount > 0 ||
            externalTxCount > 0 ||
            prefinancementCount > 0 ||
            proformaCount > 0) {
            throw new common_1.BadRequestException("Cet utilisateur ne peut pas être supprimé car il est auteur d'écritures comptables, de transactions financières ou de devis proforma enregistrés. Modifiez plutôt ses rôles pour restreindre ses accès.");
        }
        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.account.updateMany({
                    where: { salesRepId: id },
                    data: { salesRepId: null },
                });
                await tx.contact.updateMany({
                    where: { salesRepId: id },
                    data: { salesRepId: null },
                });
                await tx.sale.updateMany({
                    where: { salesRepId: id },
                    data: { salesRepId: null },
                });
                await tx.order.updateMany({
                    where: { salesRepId: id },
                    data: { salesRepId: null },
                });
                await tx.treasuryAccount.updateMany({
                    where: { cashierId: id },
                    data: { cashierId: null },
                });
                await tx.meeting.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: null },
                });
                await tx.secretariatTask.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: null },
                });
                await tx.companyDocument.updateMany({
                    where: { createdBy: id },
                    data: { createdBy: null },
                });
                await tx.equipementCostConfig.updateMany({
                    where: { updatedById: id },
                    data: { updatedById: null },
                });
                await tx.commercialParams.updateMany({
                    where: { updatedById: id },
                    data: { updatedById: null },
                });
                await tx.accountingAccessRequest.updateMany({
                    where: { reviewedBy: id },
                    data: { reviewedBy: null },
                });
                await tx.cashRemittance.updateMany({
                    where: { receivedByUserId: id },
                    data: { receivedByUserId: null },
                });
                await tx.crmTask.deleteMany({ where: { userId: id } });
                await tx.interaction.deleteMany({ where: { userId: id } });
                await tx.user.delete({ where: { id } });
            });
            this.logger.log(`User ${id} deleted successfully`, 'AuthService');
            return { message: 'User deleted successfully' };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('Impossible de supprimer cet utilisateur en raison de dépendances existantes dans le système.');
            }
            throw error;
        }
    }
    async getAllUsers(currentUser, paginationQuery = {}) {
        const hasGlobalAccess = this.hasGlobalAdminPrivileges(currentUser);
        const where = {};
        if (hasGlobalAccess) {
            if (paginationQuery.subsidiaryId) {
                where.subsidiaryId = paginationQuery.subsidiaryId;
            }
        }
        else {
            where.subsidiaryId = currentUser.subsidiaryId;
        }
        if (paginationQuery.search && paginationQuery.search.trim() !== '') {
            const term = paginationQuery.search.trim();
            where.OR = [
                { userName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
            ];
        }
        const result = await (0, pagination_1.paginate)(this.prisma.user, { where, include: { subsidiary: true }, orderBy: { userName: 'asc' } }, paginationQuery);
        this.logger.log(`Retrieved ${result.data.length} users`, 'AuthService');
        return {
            ...result,
            data: result.data.map((user) => ({
                id: user.id,
                userName: user.userName,
                email: user.email,
                userRole: user.userRole,
                additionalRoles: user.additionalRoles,
                subsidiaryId: user.subsidiaryId,
                subsidiary: user.subsidiary
                    ? {
                        id: user.subsidiary.id,
                        subsidiaryName: user.subsidiary.subsidiaryName,
                        name: user.subsidiary.subsidiaryName,
                    }
                    : null,
            })),
        };
    }
    async searchUsers(query, currentUser) {
        const hasGlobalAccess = this.hasGlobalAdminPrivileges(currentUser);
        const where = {};
        if (hasGlobalAccess) {
            if (query.subsidiaryId) {
                where.subsidiaryId = query.subsidiaryId;
            }
        }
        else {
            where.subsidiaryId = currentUser.subsidiaryId;
        }
        if (query.email) {
            where.email = { contains: query.email, mode: 'insensitive' };
        }
        if (query.userName) {
            where.userName = { contains: query.userName, mode: 'insensitive' };
        }
        if (query.userRole) {
            where.userRole = query.userRole;
        }
        if (query.search && query.search.trim() !== '') {
            const term = query.search.trim();
            where.OR = [
                { userName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
            ];
        }
        const result = await (0, pagination_1.paginate)(this.prisma.user, { where, include: { subsidiary: true }, orderBy: { userName: 'asc' } }, query);
        this.logger.log(`Found ${result.data.length} users matching query`, 'AuthService');
        return {
            ...result,
            data: result.data.map((user) => ({
                id: user.id,
                userName: user.userName,
                email: user.email,
                userRole: user.userRole,
                additionalRoles: user.additionalRoles,
                subsidiaryId: user.subsidiaryId,
                subsidiary: user.subsidiary
                    ? {
                        id: user.subsidiary.id,
                        subsidiaryName: user.subsidiary.subsidiaryName,
                        name: user.subsidiary.subsidiaryName,
                    }
                    : null,
            })),
        };
    }
    async logout(user, presentedRefreshToken) {
        if (presentedRefreshToken) {
            await this.refreshTokenService.revoke(presentedRefreshToken);
        }
        this.logger.log(`User ${user.email} logged out successfully`, 'AuthService');
        return { message: 'Logged out successfully' };
    }
    async getProfileUser(user) {
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: user.subsidiaryId },
        });
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                userName: true,
                email: true,
                userRole: true,
                additionalRoles: true,
                roles: true,
                activeRole: true,
                subsidiaryId: true,
                twoFactorEnabled: true,
            },
        });
        if (!fullUser) {
            throw new Error('User not found');
        }
        const roles = fullUser.roles.length > 0
            ? fullUser.roles
            : [
                fullUser.userRole,
                ...fullUser.additionalRoles.filter((r) => r !== fullUser.userRole),
            ];
        const mappedUser = {
            ...fullUser,
            role: fullUser.userRole,
            activeRole: fullUser.activeRole ?? fullUser.userRole,
            roles,
        };
        this.logger.log(`Profile retrieved for user ${user.email}`, 'AuthService');
        return {
            user: mappedUser,
            subsidiary: subsidiary,
        };
    }
    async switchRole(userId, requestedRole) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        const availableRoles = user.roles.length > 0
            ? user.roles
            : [
                user.userRole,
                ...user.additionalRoles.filter((r) => r !== user.userRole),
            ];
        if (!availableRoles.includes(requestedRole)) {
            throw new common_1.ForbiddenException('Vous ne possédez pas ce rôle');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { activeRole: requestedRole },
            select: {
                id: true,
                userName: true,
                email: true,
                userRole: true,
                additionalRoles: true,
                roles: true,
                activeRole: true,
                subsidiaryId: true,
                twoFactorEnabled: true,
            },
        });
        this.logger.log(`User ${user.email} switched active role to ${requestedRole}`, 'AuthService');
        return {
            user: {
                ...updated,
                role: updated.userRole,
                activeRole: updated.activeRole ?? updated.userRole,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                email: true,
                userRole: true,
                subsidiaryId: true,
                subsidiary: {
                    select: {
                        id: true,
                        subsidiaryName: true,
                        logoSvg: true,
                    },
                },
            },
        });
        if (!user) {
            this.logger.error(`Profile for user ID ${userId} not found`, 'AuthService');
            throw new common_1.NotFoundException('User profile not found');
        }
        this.logger.log(`Profile retrieved for user ${user.email}`, 'AuthService');
        return user;
    }
    async findOneById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { subsidiary: true },
        });
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        logger_service_1.LoggerService,
        refresh_token_service_1.RefreshTokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map