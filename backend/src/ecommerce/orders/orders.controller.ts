import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ContactJwtAuthGuard } from 'src/common/auth/jwt/contact-jwt.guard';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import {
  CreateOrderDto,
  CreateOrderBySalesRepDto,
  RecordPaymentDto,
  UpdateOrderStatusDto,
  updateProductionStatusDto,
} from './dto/create-order.dto';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('ecommerce/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Endpoint pour créer une commande
   * Exemple d'URL : /ecommerce/orders
   */
  @Post()
  @UseGuards(ContactJwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'designFiles', maxCount: 10 }], {
      storage: diskStorage({
        destination: './public/order_item_img',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @Body() createOrderDto: CreateOrderDto,
    @UploadedFiles() files: { designFiles?: Express.Multer.File[] },
    @Req() req,
  ) {
    // Le DTO est parsé à partir du corps du formulaire, et les fichiers sont injectés.
    return this.ordersService.create(
      createOrderDto,
      req.user,
      files.designFiles,
    );
  }

  /**
   * Endpoint pour créer une commande par un commercial (avec fichiers)
   * Exemple d'URL : /ecommerce/orders/by-salesrep
   */
  @Post('by-salesrep')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'designFiles', maxCount: 10 }], {
      storage: diskStorage({
        destination: './public/order_item_img',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  createBySalesRep(
    @Body() createOrderDto: CreateOrderBySalesRepDto,
    @UploadedFiles() files: { designFiles?: Express.Multer.File[] },
    @Req() req,
  ) {
    return this.ordersService.createBySalesRep(
      createOrderDto,
      req.user,
      files.designFiles,
    );
  }

  /**
   * Endpoint pour créer une commande par un commercial (JSON pur, sans fichiers)
   * Exemple d'URL : /ecommerce/orders/by-salesrep/json
   */
  @Post('by-salesrep/json')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  createBySalesRepJson(
    @Body() createOrderDto: CreateOrderBySalesRepDto,
    @Req() req,
  ) {
    return this.ordersService.createBySalesRep(createOrderDto, req.user, []);
  }

  /**
   * Endpoint pour récupérer toutes les commandes d'une filiale
   * Exemple d'URL : /ecommerce/orders
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
  )
  findAll(@Query() query: FindAllOrdersDto, @Req() req) {
    return this.ordersService.findAll(req.user, query);
  }

  /**
   * Endpoint pour recuperer la liste des creances client
   * Exemple d'url : /ecommerce/orders/credit
   */
  @Get('/credit')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  findAllCredit(@Req() req) {
    return this.ordersService.getAllCustomerCredit(req.user);
  }

  /**
   * Endpoint pour récupérer un crédit client par son ID
   * Exemple d'URL : /ecommerce/orders/credit/:id
   */
  @Get('/credit/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  findOneCredit(@Param('id') id: string, @Req() req) {
    return this.ordersService.getOneCustomerCredit(id, req.user);
  }

  /**
   * Endpoint pour récupérer une commande par son ID
   * Exemple d'URL : /ecommerce/orders/:id
   */
  @Get(':id')
  @UseGuards(ContactJwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    return this.ordersService.findOne(id, req.user);
  }

  /**
   * Endpoint pour récupérer les meilleures ventes
   * Exemple d'URL : /ecommerce/orders/analytics/top-selling
   */
  @Get('analytics/top-selling')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
  )
  findTopSellingProducts(@Req() req) {
    return this.ordersService.getBestSellingProducts(req.user);
  }

  /**
   * Endpoint pour récupérer les commandes par client
   * Exemple d'URL : /ecommerce/orders/customer/:customerId
   */
  @Get('customer/:customerId')
  @UseGuards(ContactJwtAuthGuard)
  findByCustomer(@Param('customerId') customerId: string) {
    return this.ordersService.findGroupsByCustomer(customerId);
  }

  /**
   * Endpoint pour mettre à jour le statut d'une commande
   * Exemple d'URL : /ecommerce/orders/:id/order-status
   */
  @Patch('/order-status/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
  )
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      updateOrderStatusDto,
      req.user,
    );
  }

  /**
   * Endpoint pour mettre à jour le statut de production d'une commande
   * Exemple d'URL : /ecommerce/orders/:id/production-status
   */
  @Patch('/production-status/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  )
  updateProductionStatus(
    @Param('id') id: string,
    @Body() updateProductionStatusDto: updateProductionStatusDto,
    @Req() req,
  ) {
    return this.ordersService.updateProductionStatus(
      id,
      updateProductionStatusDto,
      req.user,
    );
  }

  /**
   * Endpoint pour enregistrer un paiement pour une commande
   * Exemple d'URL : PATCH /ecommerce/orders/:id/payment
   */
  @Patch('/payment/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.CAISSIER)
  recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Req() req,
  ) {
    return this.ordersService.recordPayment(id, recordPaymentDto, req.user);
  }
}
