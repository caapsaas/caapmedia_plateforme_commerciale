import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { JwtUser } from '../jwt/jwt-user.interface';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private logger;
    constructor(prisma: PrismaService, logger: LoggerService);
    validate(payload: any): Promise<JwtUser | null>;
}
export {};
