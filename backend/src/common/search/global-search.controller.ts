import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CurrentUser } from '../auth/role/role.decorator';
import type { JwtUser } from '../auth/jwt/jwt-user.interface';
import { GlobalSearchService } from './global-search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  search(@Query('q') query: string, @CurrentUser() user: JwtUser) {
    return this.globalSearchService.search(query, user);
  }
}
