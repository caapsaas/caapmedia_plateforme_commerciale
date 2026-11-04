import { PayNeedRequestDto } from './dto/pay-need-request.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  CreateNeedRequestDto,
  ReviewNeedRequestDto,
} from './dto/need-request.dto';
import { NeedRequestsService } from './need-requests.service';

@Controller('purchasing/need-requests')
@UseGuards(JwtAuthGuard)
export class NeedRequestsController {
  constructor(private readonly service: NeedRequestsService) {}
  @Get()
  list(@Req() req: Request & { user: JwtUser }) {
    return this.service.findAll(req.user);
  }
  @Post()
  create(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: CreateNeedRequestDto,
  ) {
    return this.service.create(req.user, dto);
  }
  @Get(':id/payment-account')
  paymentAccount(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
  ) {
    return this.service.paymentAccount(req.user, id);
  }
  @Post(':id/pay')
  pay(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: PayNeedRequestDto,
  ) {
    return this.service.pay(req.user, id, dto);
  }
  @Patch(':id/review')
  review(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: ReviewNeedRequestDto,
  ) {
    return this.service.review(req.user, id, dto);
  }
}
