export declare class GenerateThirteenthMonthDto {
    employeeId: string;
    month: string;
    year: string;
}
export declare class ApproveBonusDto {
    bonusId: string;
}
export declare class RecordBonusPaymentDto {
    bonusId: string;
    bankTransferId: string;
    paymentDate?: string;
}
export declare class CancelBonusDto {
    bonusId: string;
    reason: string;
}
export declare class AccumulateChargesDto {
    month: string;
    subsidiaryId?: string;
}
export declare class RecordChargePaymentDto {
    chargePaymentId: string;
    bankTransferId: string;
    paidAmount: number;
    declarationNumber?: string;
}
export declare class CreateSalaryChargeDto {
    month: string;
    paymentMethod: string;
    subsidiaryId?: string;
}
