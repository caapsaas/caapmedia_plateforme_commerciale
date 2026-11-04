import { DeliveryProforma } from './proforma-pdf.service';
export declare class ProformaMailerService {
    send(quote: DeliveryProforma, pdf: Buffer): Promise<void>;
}
