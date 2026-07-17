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
import { AssetsService } from './assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('finance/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('fixed')
  create(@Body() createDto: CreateFixedAssetDto, @CurrentUser() user: JwtUser) {
    return this.assetsService.create(createDto, user);
  }

  @Get('fixed')
  findAll(@CurrentUser() user: JwtUser) {
    return this.assetsService.findAll(user);
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
