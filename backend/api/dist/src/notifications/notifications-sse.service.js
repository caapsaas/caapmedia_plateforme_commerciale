"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsSseService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let NotificationsSseService = class NotificationsSseService {
    streams = new Map();
    getOrCreateStream(userId) {
        let stream = this.streams.get(userId);
        if (!stream) {
            stream = new rxjs_1.Subject();
            this.streams.set(userId, stream);
        }
        return stream;
    }
    subscribe(userId, activeRole) {
        const heartbeat = (0, rxjs_1.interval)(30_000).pipe((0, rxjs_1.map)(() => ({ type: 'heartbeat', data: {} })));
        const notifications = this.getOrCreateStream(userId).pipe((0, rxjs_1.filter)((event) => {
            const { targetRole } = event.data;
            return targetRole == null || targetRole === activeRole;
        }));
        return (0, rxjs_1.merge)(notifications, heartbeat);
    }
    push(userId, notification) {
        this.streams
            .get(userId)
            ?.next({ type: 'notification', data: notification });
    }
    pushToUsers(userIds, notification) {
        for (const userId of userIds)
            this.push(userId, notification);
    }
};
exports.NotificationsSseService = NotificationsSseService;
exports.NotificationsSseService = NotificationsSseService = __decorate([
    (0, common_1.Injectable)()
], NotificationsSseService);
//# sourceMappingURL=notifications-sse.service.js.map