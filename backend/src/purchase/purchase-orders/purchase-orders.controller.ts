import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  SetMetadata,
  Query,
  } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, RecordPurchasePaymentDto, UpdatePurchaseOrderStatusDto } from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { UserRole } from '@prisma/client';
import { FindAllPurchaseOrdersDto } from './dto/find-all-purchase-orders.dto';
import { ReceiveItemsDto } from './dto/receive-items.dto';

@UseGuards(JwtAuthGuard)
@Controller('purchasing/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) { }

  /**
   * Endpoint pour créer un bon de commande fournisseur
   * Accessible par les responsables achats et les admins.
   */
  @Post()
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Req() req) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, req.user);
  }

  /**
   * Endpoint pour trouver tous les bons de commande fournisseur
   * Accessible par les responsables achats et les admins.
   */
  @Get()
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  findAll(@Req() req, @Query() query: FindAllPurchaseOrdersDto) {
    return this.purchaseOrdersService.findAll(req.user, query);
  }

  /**
   * Endpoint pour trouver un bon de commande fournisseur par son ID
   * Accessible par les responsables achats et les admins.
   */
  @Get(':id')
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  findOne(@Param('id') id: string, @Req() req) {
    return this.purchaseOrdersService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre à jour le statut d'un bon de commande
   * Accessible par les responsables achats et les admins.
   */
  @Patch(':id/status')
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdatePurchaseOrderStatusDto, @Req() req) {
    return this.purchaseOrdersService.updateStatus(id, updateStatusDto, req.user);
  }

  /**
   * Endpoint pour recevoir des articles pour un bon de commande
   * Accessible par les responsables achats et les admins.
   */
  @Post(':id/receive')
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  receiveItems(@Param('id') id: string, @Body() receiveItemsDto: ReceiveItemsDto, @Req() req) {
    return this.purchaseOrdersService.receiveItems(id, receiveItemsDto, req.user);
  }

  /**
   * Endpoint pour enregistrer un paiement pour un bon de commande
   * Accessible par les responsables achats et les admins.
   */
  @Post(':id/payment')
  @SetMetadata('roles', [UserRole.PURCHASING_MANAGER, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
  recordPayment(@Param('id') id: string, @Body() recordPaymentDto: RecordPurchasePaymentDto, @Req() req) {
    return this.purchaseOrdersService.recordPayment(id, recordPaymentDto, req.user);
  }
}

