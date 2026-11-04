"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIVATE_DOCUMENT_PREFIX = exports.PRIVATE_DOCUMENT_ROOT = void 0;
exports.secretariatDestination = secretariatDestination;
const fs_1 = require("fs");
const path_1 = require("path");
exports.PRIVATE_DOCUMENT_ROOT = (0, path_1.resolve)(process.cwd(), 'private', 'documents');
exports.PRIVATE_DOCUMENT_PREFIX = '/api-caapmedia/private-documents/';
function secretariatDestination(_req, _file, callback) {
    const destination = (0, path_1.resolve)(exports.PRIVATE_DOCUMENT_ROOT, 'secretariat');
    try {
        (0, fs_1.mkdirSync)(destination, { recursive: true, mode: 0o700 });
        callback(null, destination);
    }
    catch (error) {
        callback(error, destination);
    }
}
//# sourceMappingURL=document-storage.js.map