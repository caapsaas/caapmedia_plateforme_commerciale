import { Prisma } from '@prisma/client';
export type DeliveryProforma = Prisma.ProformaGetPayload<{
    include: {
        items: {
            include: {
                product: true;
            };
        };
        subsidiary: true;
    };
}>;
export declare function proformaFilename(number: string): string;
export declare function money(value: Prisma.Decimal | number | string): string;
export declare class ProformaPdfService {
    render(quote: DeliveryProforma): Promise<Buffer>;
}
