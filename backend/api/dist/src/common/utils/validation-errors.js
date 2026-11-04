"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = formatValidationErrors;
function formatValidationErrors(errors, parent = '') {
    return errors.flatMap((error) => {
        const path = parent ? `${parent}.${error.property}` : error.property;
        return [
            ...Object.values(error.constraints ?? {}).map((message) => `${path}: ${message}`),
            ...formatValidationErrors(error.children ?? [], path),
        ];
    });
}
//# sourceMappingURL=validation-errors.js.map