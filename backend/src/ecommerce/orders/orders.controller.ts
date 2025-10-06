import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CreateOrderDto, UpdateProductionStatusDto } from './dto/create-order.dto';
import { FindAllOrdersDto } from './dto/find-all-orders.dto'; 
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';


@Controller('ecommerce/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'designFiles', maxCount: 10 } // 'designFiles' est le nom du champ pour les fichiers
  ], {
    storage: diskStorage({
      destination: './public/order_item_img',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  create(
    @Body() createOrderDto: CreateOrderDto, 
    @UploadedFiles() files: { designFiles?: Express.Multer.File[] },
    @Req() req
  ) {
    // Le DTO est parsé à partir du corps du formulaire, et les fichiers sont injectés.
    return this.ordersService.create(createOrderDto, req.user, files.designFiles);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_DIRECTOR, UserRole.FINANCIAL_DIRECTOR])
  findAll(@Query() query: FindAllOrdersDto, @Req() req) {
    return this.ordersService.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @Get('analytics/top-selling')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_DIRECTOR, UserRole.FINANCIAL_DIRECTOR])
  findTopSellingProducts(@Req() req) {
    return this.ordersService.getBestSellingProducts(req.user);
  }

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  findByCustomer(@Param('customerId') customerId: string) {
    return this.ordersService.findGroupsByCustomer(customerId);
  }

  @Patch(':id/production-status')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.PRODUCTION_DIRECTOR, UserRole.FINANCIAL_DIRECTOR])
  updateProductionStatus(
    @Param('id') id: string,
    @Body() updateProductionStatusDto: UpdateProductionStatusDto,
    @Req() req) {
    return this.ordersService.updateProductionStatus(id, updateProductionStatusDto, req.user);
  }
}
