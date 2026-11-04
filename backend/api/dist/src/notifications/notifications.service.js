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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../common/constants/id-prefixes.const");
const pagination_1 = require("../common/pagination/pagination");
const notifications_sse_service_1 = require("./notifications-sse.service");
let NotificationsService = class NotificationsService {
    prisma;
    sse;
    constructor(prisma, sse) {
        this.prisma = prisma;
        this.sse = sse;
    }
    createNotification(userId, payload, client = this.prisma) {
        return client.notification.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.NOTIFICATION),
                title: payload.title,
                message: payload.message,
                type: payload.type,
                recipientId: userId,
                recipientType: client_1.RecipientType.USER,
                userId,
                orderId: payload.orderId,
                data: payload.data,
                targetRole: payload.targetRole,
            },
        });
    }
    publish(notification) {
        this.sse.push(notification.recipientId, notification);
    }
    async notifyUser(userId, payload) {
        const notification = await this.createNotification(userId, payload);
        this.sse.push(userId, notification);
        return notification;
    }
    async notifyUsersByRole(subsidiaryId, role, payload, recipientId) {
        const users = await this.prisma.user.findMany({
            where: {
                subsidiaryId,
                ...(recipientId ? { id: recipientId } : {}),
                OR: [
                    { userRole: role },
                    { roles: { has: role } },
                    { additionalRoles: { has: role } },
                ],
            },
            select: { id: true },
        });
        return Promise.all(users.map((u) => this.notifyUser(u.id, {
            ...payload,
            targetRole: payload.targetRole ?? role,
        })));
    }
    async getUserNotifications(userId, activeRole, unreadOnly, paginationQuery = {}) {
        const where = {
            recipientId: userId,
            recipientType: client_1.RecipientType.USER,
            OR: [{ targetRole: null }, { targetRole: activeRole }],
            ...(unreadOnly ? { read: false } : {}),
        };
        return (0, pagination_1.paginate)(this.prisma.notification, { where, orderBy: { createdAt: 'desc' } }, paginationQuery);
    }
    async getUnreadCount(userId, activeRole) {
        const count = await this.prisma.notification.count({
            where: {
                recipientId: userId,
                recipientType: client_1.RecipientType.USER,
                read: false,
                OR: [{ targetRole: null }, { targetRole: activeRole }],
            },
        });
        return { count };
    }
    async markAsRead(id, userId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            throw new common_1.NotFoundException(`Notification with ID "${id}" not found.`);
        }
        if (notification.recipientId !== userId) {
            throw new common_1.ForbiddenException('Cette notification ne vous appartient pas.');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }
    async markAllAsRead(userId, activeRole) {
        const result = await this.prisma.notification.updateMany({
            where: {
                recipientId: userId,
                recipientType: client_1.RecipientType.USER,
                read: false,
                OR: [{ targetRole: null }, { targetRole: activeRole }],
            },
            data: { read: true },
        });
        return { count: result.count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_sse_service_1.NotificationsSseService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map