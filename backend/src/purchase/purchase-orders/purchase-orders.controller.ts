import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
  SetMetadata,
  Query,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { FindAllPurchaseOrdersDto } from './dto/find-all-purchase-orders.dto';
import { ReceiveItemsDto } from './dto/receive-items.dto';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('purchasing/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  /**
   * Endpoint pour créer un bon de commande fournisseur
   * Accessible par les responsables achats et les admins.
   */
  @Post()
  @Roles(
    UserRole.PURCHASING_MANAGER,
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
  )
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Req() req) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, req.user);
  }

  /**
   * Endpoint pour trouver tous les bons de commande fournisseur
   * Accessible par les responsables achats et les admins.
   */
  @Get()
  @Roles(
    UserRole.PURCHASING_MANAGER,
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  findAll(@Req() req, @Query() query: FindAllPurchaseOrdersDto) {
    return this.purchaseOrdersService.findAll(req.user, query);
  }

  /**
   * Endpoint pour trouver un bon de commande fournisseur par son ID
   * Accessible par les responsables achats et les admins.
   */
  @Get(':id')
  @Roles(
    UserRole.PURCHASING_MANAGER,
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.purchaseOrdersService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre à jour le statut d'un bon de commande
   * Accessible par les responsables achats et les admins.
   */
  @Patch(':id/status')
  @Roles(
    UserRole.PURCHASING_MANAGER,
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
  )
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdatePurchaseOrderStatusDto,
    @Req() req,
  ) {
    return this.purchaseOrdersService.updateStatus(
      id,
      updateStatusDto,
      req.user,
    );
  }

  /**
   * Endpoint pour recevoir des articles pour un bon de commande
   * Accessible par les responsables achats et les admins.
   */
  @Post(':id/receive')
  @Roles(
    UserRole.PURCHASING_MANAGER,
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
  )
  receiveItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() receiveItemsDto: ReceiveItemsDto,
    @Req() req,
  ) {
    return this.purchaseOrdersService.receiveItems(
      id,
      receiveItemsDto,
      req.user,
    );
  }

  // Paiement d'un bon de commande : voir POST /finance/debts/supplier/:id/pay
  // (DebtsController) — prélève le coffre-fort/la banque, réservé au
  // SUPER_ADMIN. Route retirée d'ici pour n'avoir qu'un seul chemin de
  // paiement (voir purchase-orders.service.ts).
}
