import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';


@Injectable()
export class SubsidiariesService {
  constructor(private prisma: PrismaService, private logger: LoggerService) {}

  async findAll() {
    const subsidiaries = await this.prisma.subsidiary.findMany({
      select: { id: true, subsidiaryName: true, email: true },
    });
    this.logger.log(`Retrieved ${subsidiaries.length} subsidiaries`, 'SubsidiariesService');
    return subsidiaries;
  }
}

