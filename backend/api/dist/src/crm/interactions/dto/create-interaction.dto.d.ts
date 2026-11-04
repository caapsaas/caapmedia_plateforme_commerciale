import { InteractionType } from '@prisma/client';
export declare class CreateInteractionDto {
    contactId: string;
    type: InteractionType;
    notes: string;
}
