import type { Response } from 'express';
import { ProformaDeliveryService } from './proforma-delivery.service';
export declare class ProformaShareController {
    private readonly delivery;
    constructor(delivery: ProformaDeliveryService);
    download(token: string, response: Response): Promise<void>;
}
