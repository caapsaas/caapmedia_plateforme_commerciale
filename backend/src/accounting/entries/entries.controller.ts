import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import type { CreateJournalEntryDto } from './entries.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import type { JournalEntryStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('accounting/entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  create(@Body() dto: CreateJournalEntryDto, @Req() req: any) {
    return this.entriesService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('fiscalYearId') fiscalYearId?: string,
    @Query('status') status?: string,
  ) {
    return this.entriesService.findAll(req.user, fiscalYearId, status as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.entriesService.findOne(id, req.user);
  }

  @Patch(':id/post')
  post(@Param('id') id: string, @Req() req: any) {
    return this.entriesService.post(id, req.user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.entriesService.cancel(id, req.user);
  }
}
