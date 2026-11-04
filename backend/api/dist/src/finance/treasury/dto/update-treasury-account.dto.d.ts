declare class UpdateableTreasuryAccount {
    accountName: string;
    cashierId?: string;
    accountCode?: string;
    accountNumber?: string;
}
declare const UpdateTreasuryAccountDto_base: import("@nestjs/mapped-types").MappedType<Partial<UpdateableTreasuryAccount>>;
export declare class UpdateTreasuryAccountDto extends UpdateTreasuryAccountDto_base {
}
export {};
