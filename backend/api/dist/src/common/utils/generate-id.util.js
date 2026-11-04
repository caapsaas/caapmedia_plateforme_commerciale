"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = void 0;
const generateId = (prefix) => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 46656)
        .toString(36)
        .padStart(3, '0')
        .toUpperCase();
    return `${prefix.toUpperCase()}-${ts}${rand}`;
};
exports.generateId = generateId;
//# sourceMappingURL=generate-id.util.js.map