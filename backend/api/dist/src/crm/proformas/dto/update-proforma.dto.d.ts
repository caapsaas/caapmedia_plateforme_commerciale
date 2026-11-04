import { ProformaItemDto } from './create-proforma.dto';
export declare class UpdateProformaDto {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    clientCompany?: string;
    items?: ProformaItemDto[];
    taxRate?: number;
    notes?: string;
}
