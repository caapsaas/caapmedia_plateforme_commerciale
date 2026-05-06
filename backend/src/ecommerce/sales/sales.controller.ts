import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { UserRole } from '@prisma/client';
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto } from './dto/find-all-sales.dto';

@Controller('ecommerce/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Endpoint pour créer une vente directe (au comptoir)
   * Accessible par les caissiers, admins, et directeurs financiers.
   */
  @Post('direct')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.CAISSIER, UserRole.ADMIN])
  createDirectSale(
    @Body() createDirectSaleDto: CreateDirectSaleDto,
    @Req() req,
  ) {
    return this.salesService.createDirectSale(createDirectSaleDto, req.user);
  }

  /**
   * Endpoint pour récupérer toutes les ventes avec filtres.
   * Accessible par les caissiers, admins
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.CAISSIER, UserRole.ADMIN])
  findAll(@Query() query: FindAllSalesDto, @Req() req) {
    return this.salesService.findAll(req.user, query);
  }
}
