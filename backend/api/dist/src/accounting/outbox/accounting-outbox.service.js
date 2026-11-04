"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingOutboxService = void 0;
const common_1 = require("@nestjs/common");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let AccountingOutboxService = class AccountingOutboxService {
    async enqueue(tx, dto) {
        await tx.accountingOutboxEntry.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGOUTBOXENTRY),
                eventType: dto.eventType,
                payload: dto.payload,
                subsidiaryId: dto.subsidiaryId,
            },
        });
    }
};
exports.AccountingOutboxService = AccountingOutboxService;
exports.AccountingOutboxService = AccountingOutboxService = __decorate([
    (0, common_1.Injectable)()
], AccountingOutboxService);
//# sourceMappingURL=accounting-outbox.service.js.map