import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance/banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  create(@Body() createDto: CreateBankDto, @CurrentUser() user: JwtUser) {
    return this.bankService.create(createDto, user);
  }

  @Get()
  findAll() {
    return this.bankService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBankDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.bankService.update(id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.bankService.remove(id, user);
  }
}
