import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('fixed')
  create(@Body() createDto: CreateFixedAssetDto, @CurrentUser() user: JwtUser) {
    return this.assetsService.create(createDto, user);
  }

  @Get('fixed')
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.assetsService.findAll(user, paginationQuery);
  }

  @Get('fixed/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.assetsService.findOne(id, user);
  }

  @Patch('fixed/:id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFixedAssetDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.assetsService.update(id, updateDto, user);
  }

  @Delete('fixed/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.assetsService.remove(id, user);
  }
}
