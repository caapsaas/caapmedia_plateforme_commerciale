import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StockItemsService } from './stock-items.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import {
  CreatePackagingUnitDto,
  CreateStockItemDto,
  UpdatePackagingUnitDto,
  UpdateStockItemDto,
  UpdateStockItemPriceDto,
} from './dto/create-stock-item.dto';

@Controller('purchase/stock-items')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.COMMERCIAL,
  UserRole.CAISSIER,
  UserRole.PURCHASING_MANAGER,
  UserRole.PRODUCTION_DIRECTOR,
  UserRole.FINANCIAL_DIRECTOR,
)
export class StockItemsController {
  constructor(private readonly stockItemsService: StockItemsService) {}

  @Post()
  create(@Body() createStockItemDto: CreateStockItemDto, @Req() req: any) {
    return this.stockItemsService.create(createStockItemDto, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.stockItemsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.stockItemsService.findOne(id, req.user);
  }

  @Patch(':id/update-price')
  updatePrice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateStockItemPriceDto: UpdateStockItemPriceDto,
    @Req() req: any,
  ) {
    return this.stockItemsService.updatePrice(
      id,
      updateStockItemPriceDto,
      req.user,
    );
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateStockItemDto: UpdateStockItemDto,
    @Req() req: any,
  ) {
    return this.stockItemsService.update(id, updateStockItemDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.stockItemsService.remove(id, req.user);
  }

  // --- Unités d'emballage/achat (Chantier 2) ---

  @Get(':id/packaging-units')
  listPackagingUnits(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    return this.stockItemsService.listPackagingUnits(id, req.user);
  }

  @Post(':id/packaging-units')
  addPackagingUnit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePackagingUnitDto,
    @Req() req: any,
  ) {
    return this.stockItemsService.addPackagingUnit(id, dto, req.user);
  }

  @Patch('packaging-units/:packagingUnitId')
  updatePackagingUnit(
    @Param('packagingUnitId', new ParseUUIDPipe()) packagingUnitId: string,
    @Body() dto: UpdatePackagingUnitDto,
  ) {
    return this.stockItemsService.updatePackagingUnit(packagingUnitId, dto);
  }

  @Delete('packaging-units/:packagingUnitId')
  removePackagingUnit(
    @Param('packagingUnitId', new ParseUUIDPipe()) packagingUnitId: string,
  ) {
    return this.stockItemsService.removePackagingUnit(packagingUnitId);
  }
}
