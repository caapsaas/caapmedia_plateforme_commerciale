import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateTaxBracketDto,
  UpdateTaxBracketDto,
} from '../dto/tax-bracket.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

@Injectable()
export class TaxBracketService {
  private readonly logger = new Logger(TaxBracketService.name);

  constructor(private prisma: PrismaService) {}

  async create(subsidiaryId: string, dto: CreateTaxBracketDto, user?: JwtUser) {
    const config = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
    });

    if (!config) {
      throw new NotFoundException('Payroll configuration not found');
    }

    // Validate overlapping brackets
    await this.validateNonOverlappingBrackets(config.id, dto);

    const bracket = await this.prisma.taxBracket.create({
      data: {
        id: `bracket_${Date.now()}_${Math.random()}`,
        payrollConfigId: config.id,
        ...dto,
      },
    });

    this.logger.warn(
      `[AUDIT] Tax bracket created for subsidiary ${subsidiaryId}: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Created by: ${user?.email || 'unknown'}`,
    );

    return bracket;
  }

  async getByConfigId(configId: string) {
    return this.prisma.taxBracket.findMany({
      where: { payrollConfigId: configId },
      orderBy: { minSalary: 'asc' },
    });
  }

  async getActiveBrackets(configId: string) {
    const now = new Date();
    return this.prisma.taxBracket.findMany({
      where: {
        payrollConfigId: configId,
        effectiveDate: { lte: now },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      orderBy: { minSalary: 'asc' },
    });
  }

  async getTaxableIncome(
    grossSalary: number,
    configId: string,
    deductions: number = 0,
  ): Promise<{ taxableIncome: number; tax: number }> {
    const brackets = await this.getActiveBrackets(configId);
    if (brackets.length === 0) {
      return { taxableIncome: 0, tax: 0 };
    }

    const taxableIncome = Math.max(0, grossSalary - deductions);
    let tax = 0;

    for (const bracket of brackets) {
      const minSalary =
        typeof bracket.minSalary === 'number'
          ? bracket.minSalary
          : bracket.minSalary.toNumber();
      if (taxableIncome <= minSalary) {
        break;
      }

      const maxSalary = bracket.maxSalary
        ? typeof bracket.maxSalary === 'number'
          ? bracket.maxSalary
          : bracket.maxSalary.toNumber()
        : Infinity;
      const rate =
        typeof bracket.rate === 'number'
          ? bracket.rate
          : bracket.rate.toNumber();
      const upperLimit = maxSalary;
      const taxableInBracket = Math.min(taxableIncome, upperLimit) - minSalary;

      if (taxableInBracket > 0) {
        const bracketTax = (taxableInBracket * rate) / 100;
        tax += bracketTax;
      }
    }

    return { taxableIncome, tax };
  }

  async update(bracketId: string, dto: UpdateTaxBracketDto, user?: JwtUser) {
    const bracket = await this.prisma.taxBracket.findUnique({
      where: { id: bracketId },
    });

    if (!bracket) {
      throw new NotFoundException('Tax bracket not found');
    }

    if (dto.minSalary || dto.maxSalary) {
      await this.validateNonOverlappingBrackets(
        bracket.payrollConfigId,
        dto,
        bracketId,
      );
    }

    const updated = await this.prisma.taxBracket.update({
      where: { id: bracketId },
      data: dto,
    });

    this.logger.warn(
      `[AUDIT] Tax bracket updated: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Updated by: ${user?.email || 'unknown'}`,
    );

    return updated;
  }

  async delete(bracketId: string, user?: JwtUser) {
    const bracket = await this.prisma.taxBracket.findUnique({
      where: { id: bracketId },
    });

    if (!bracket) {
      throw new NotFoundException('Tax bracket not found');
    }

    await this.prisma.taxBracket.delete({
      where: { id: bracketId },
    });

    this.logger.warn(
      `[AUDIT] Tax bracket deleted: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Deleted by: ${user?.email || 'unknown'}`,
    );

    return bracket;
  }

  private async validateNonOverlappingBrackets(
    configId: string,
    dto: CreateTaxBracketDto | UpdateTaxBracketDto,
    excludeId?: string,
  ) {
    const existing = await this.prisma.taxBracket.findMany({
      where: {
        payrollConfigId: configId,
        id: excludeId ? { not: excludeId } : undefined,
        effectiveDate: { lte: dto.effectiveDate },
        OR: [{ expiryDate: null }, { expiryDate: { gte: dto.effectiveDate } }],
      },
    });

    for (const bracket of existing) {
      if (this.bracketsOverlap(bracket, dto)) {
        throw new BadRequestException('Tax brackets cannot overlap');
      }
    }
  }

  private bracketsOverlap(
    bracket: any,
    dto: CreateTaxBracketDto | UpdateTaxBracketDto,
  ): boolean {
    const min1 = bracket.minSalary;
    const max1 = bracket.maxSalary || Infinity;
    const min2 = dto.minSalary;
    const max2 = dto.maxSalary || Infinity;

    return !(max1 <= min2 || max2 <= min1);
  }
}
