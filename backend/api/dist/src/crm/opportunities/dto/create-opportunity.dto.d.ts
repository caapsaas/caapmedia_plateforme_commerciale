import { OpportunityStage, OpportunitySource } from '@prisma/client';
export declare class CreateOpportunityDto {
    opportunityName: string;
    opportunityValue: number;
    closeDate: string;
    contactId: string;
    accountId: string;
    stage: OpportunityStage;
    sourceOpportunity?: OpportunitySource;
    productIds?: string[];
}
