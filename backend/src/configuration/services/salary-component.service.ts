import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '../dto/salary-component.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

@Injectable()
export class SalaryComponentService {
  private readonly logger = new Logger(SalaryComponentService.name);

  constructor(private prisma: PrismaService) {}

  async create(subsidiaryId: string, dto: CreateSalaryComponentDto, user?: JwtUser) {
    const config = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
    });

    if (!config) {
      throw new NotFoundException('Payroll configuration not found');
    }

    const component = await this.prisma.salaryComponent.create({
      data: {
        id: `comp_${Date.now()}_${Math.random()}`,
        payrollConfigId: config.id,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        rate: dto.rate,
        fixedAmount: dto.fixedAmount,
        contributionType: dto.contributionType,
        displayOrder: dto.displayOrder || 0,
      },
    });

    this.logger.warn(
      `[AUDIT] Salary component created: ${component.name} (${component.type}) for subsidiary ${subsidiaryId}. Created by: ${user?.email || 'unknown'}`,
    );

    return component;
  }

  async getByConfigId(configId: string) {
    return this.prisma.salaryComponent.findMany({
      where: { payrollConfigId: configId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getActiveByConfigId(configId: string) {
    return this.prisma.salaryComponent.findMany({
      where: { payrollConfigId: configId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async update(componentId: string, dto: UpdateSalaryComponentDto, user?: JwtUser) {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException('Salary component not found');
    }

    const updated = await this.prisma.salaryComponent.update({
      where: { id: componentId },
      data: dto,
    });

    this.logger.warn(
      `[AUDIT] Salary component updated: ${component.name}. Updated by: ${user?.email || 'unknown'}`,
    );

    return updated;
  }

  async delete(componentId: string, user?: JwtUser) {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException('Salary component not found');
    }

    await this.prisma.salaryComponent.delete({
      where: { id: componentId },
    });

    this.logger.warn(
      `[AUDIT] Salary component deleted: ${component.name}. Deleted by: ${user?.email || 'unknown'}`,
    );

    return component;
  }

  async deactivate(componentId: string, user?: JwtUser) {
    return this.update(componentId, { isActive: false }, user);
  }

  async reorder(components: { id: string; displayOrder: number }[], user?: JwtUser) {
    const updates = components.map((comp) =>
      this.prisma.salaryComponent.update({
        where: { id: comp.id },
        data: { displayOrder: comp.displayOrder },
      }),
    );

    const result = await Promise.all(updates);
    this.logger.warn(
      `[AUDIT] Salary components reordered (${components.length} items). Reordered by: ${user?.email || 'unknown'}`,
    );

    return result;
  }
}
