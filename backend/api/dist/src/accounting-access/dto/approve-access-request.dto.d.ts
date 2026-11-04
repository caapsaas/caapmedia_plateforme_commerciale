export declare enum AccessDurationUnit {
    HOURS = "HOURS",
    DAYS = "DAYS"
}
export declare class ApproveAccessRequestDto {
    duration: number;
    unit: AccessDurationUnit;
}
