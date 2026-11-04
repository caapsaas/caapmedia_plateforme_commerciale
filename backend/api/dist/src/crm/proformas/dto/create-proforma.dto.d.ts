export declare class ProformaItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    description?: string;
}
export declare class CreateProformaDto {
    leadId: string;
    opportunityId?: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientCompany?: string;
    items: ProformaItemDto[];
    taxRate: number;
    notes?: string;
    validityDays?: number;
}
