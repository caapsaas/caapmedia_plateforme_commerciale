import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateStockMovementDto,
  FindStockMovementsDto,
  InventoryAdjustmentDto,
  WithdrawForOrderDto,
} from './dto/stock-movement.dto';

const READ_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PURCHASING_MANAGER,
  UserRole.PRODUCTION_DIRECTOR,
  UserRole.FINANCIAL_DIRECTOR,
];
const MANAGE_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PURCHASING_MANAGER,
];
// "Prélever les matières" — réservé au responsable de production existant,
// pas de nouveau rôle "Magasinier" créé pour ce chantier (décision actée).
const WITHDRAW_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PRODUCTION_DIRECTOR,
];

@Controller('purchase/stock-movements')
@UseGuards(JwtAuthGuard, RoleGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  @Roles(...READ_ROLES)
  findAll(@Query() query: FindStockMovementsDto, @Req() req: any) {
    return this.stockMovementsService.findAll(req.user, query);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@Body() dto: CreateStockMovementDto, @Req() req: any) {
    return this.stockMovementsService.createManual(dto, req.user);
  }

  @Post('inventory-adjustment')
  @Roles(...MANAGE_ROLES)
  adjustInventory(@Body() dto: InventoryAdjustmentDto, @Req() req: any) {
    return this.stockMovementsService.adjustInventory(dto, req.user);
  }

  @Post('withdraw-for-order')
  @Roles(...WITHDRAW_ROLES)
  withdrawForOrder(@Body() dto: WithdrawForOrderDto, @Req() req: any) {
    return this.stockMovementsService.withdrawForOrder(dto, req.user);
  }
}
