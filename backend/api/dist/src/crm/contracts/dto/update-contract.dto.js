"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContractDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_contract_dto_1 = require("./create-contract.dto");
class UpdateContractDto extends (0, mapped_types_1.PartialType)(create_contract_dto_1.CreateContractDto) {
}
exports.UpdateContractDto = UpdateContractDto;
//# sourceMappingURL=update-contract.dto.js.map