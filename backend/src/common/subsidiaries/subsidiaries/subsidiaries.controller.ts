import { Controller, Get } from '@nestjs/common';
import { SubsidiariesService } from './subsidiaries.service';

@Controller('subsidiaries')
export class SubsidiariesController {
  constructor(private subsidiariesService: SubsidiariesService) {}

  @Get()
  async findAll() {
    return this.subsidiariesService.findAll();
  }
 
}