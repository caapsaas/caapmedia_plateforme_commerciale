import { Strategy } from 'passport-jwt';
import { PrismaService } from "../../utils/prisma/prisma.service";
type JwtPayload = {
    sub: string;
    email: string;
    type: 'contact';
};
declare const ContactJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class ContactJwtStrategy extends ContactJwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        subsidiaryId: string | null;
        status: import("@prisma/client").$Enums.ContactStatus | null;
        contactName: string;
        company: string;
        since: Date;
        isOccasional: boolean;
        isVerified: boolean;
        accountId: string | null;
        salesRepId: string | null;
    }>;
}
export {};
