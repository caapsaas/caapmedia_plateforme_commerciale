"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBankDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_bank_dto_1 = require("./create-bank.dto");
class UpdateBankDto extends (0, mapped_types_1.PartialType)(create_bank_dto_1.CreateBankDto) {
}
exports.UpdateBankDto = UpdateBankDto;
//# sourceMappingURL=update-bank.dto.js.map