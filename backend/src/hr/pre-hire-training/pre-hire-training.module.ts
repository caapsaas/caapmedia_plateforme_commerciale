import { Module } from '@nestjs/common';
import { PreHireTrainingController } from './pre-hire-training.controller';
import { PreHireTrainingService } from './pre-hire-training.service';
import { EmployeeModule } from '../employee/employee.module';

@Module({ imports: [EmployeeModule], controllers: [PreHireTrainingController], providers: [PreHireTrainingService] })
export class PreHireTrainingModule {}
