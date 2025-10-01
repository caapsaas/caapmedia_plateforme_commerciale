import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    CommonModule,  
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, PrismaService], // Prisma global, mais listé pour clarté
  exports: [EmployeeService]
})

export class EmployeeModule {}
