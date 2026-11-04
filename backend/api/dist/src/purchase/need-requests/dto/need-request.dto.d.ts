export declare class CreateNeedRequestDto {
    title: string;
    description: string;
    estimatedBudget?: number;
    desiredDate?: string;
}
export declare enum NeedDecision {
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class ReviewNeedRequestDto {
    status: NeedDecision;
    rejectionReason?: string;
}
