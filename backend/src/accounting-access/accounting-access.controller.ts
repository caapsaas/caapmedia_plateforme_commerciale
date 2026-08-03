import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AccountingAccessService } from './accounting-access.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { RejectAccessRequestDto } from './dto/reject-access-request.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounting-access')
export class AccountingAccessController {
  constructor(private readonly accessService: AccountingAccessService) {}

  @Get()
  findAll(@Req() req: any, @Query() paginationQuery: PaginationQueryDto) {
    return this.accessService.findAll(req.user, paginationQuery);
  }

  @Get('my-status')
  myStatus(@Req() req: any) {
    return this.accessService.myStatus(req.user);
  }

  @Get('pending-count')
  countPending(@Req() req: any) {
    return this.accessService.countPending(req.user);
  }

  @Post('request')
  createRequest(@Body() dto: CreateAccessRequestDto, @Req() req: any) {
    return this.accessService.createRequest(req.user, dto);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveAccessRequestDto,
    @Req() req: any,
  ) {
    return this.accessService.approve(id, dto, req.user);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectAccessRequestDto,
    @Req() req: any,
  ) {
    return this.accessService.reject(id, dto, req.user);
  }
}
