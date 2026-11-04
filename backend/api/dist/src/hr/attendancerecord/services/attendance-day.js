"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceDayBounds = attendanceDayBounds;
function attendanceDayBounds(now) {
    const local = new Date(now.getTime() + 3600000);
    const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
        3600000;
    return {
        start: new Date(start),
        end: new Date(start + 86400000),
        late: local.getUTCHours() * 60 + local.getUTCMinutes() > 510,
    };
}
//# sourceMappingURL=attendance-day.js.map