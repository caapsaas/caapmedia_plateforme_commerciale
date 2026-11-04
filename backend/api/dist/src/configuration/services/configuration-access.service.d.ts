import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
export declare class ConfigurationAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertSubsidiaryAccess;
    assertConfigAccess(configId: string, user: JwtUser): Promise<void>;
    assertSubsidiaryConfigAccess(subsidiaryId: string, user: JwtUser): Promise<void>;
    assertTaxBracketAccess(bracketId: string, user: JwtUser): Promise<void>;
    assertSalaryComponentAccess(componentId: string, user: JwtUser): Promise<void>;
    assertAllowanceRuleAccess(ruleId: string, user: JwtUser): Promise<void>;
}
