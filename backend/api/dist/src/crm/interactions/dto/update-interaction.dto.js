"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInteractionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_interaction_dto_1 = require("./create-interaction.dto");
class UpdateInteractionDto extends (0, mapped_types_1.PartialType)(create_interaction_dto_1.CreateInteractionDto) {
}
exports.UpdateInteractionDto = UpdateInteractionDto;
//# sourceMappingURL=update-interaction.dto.js.map