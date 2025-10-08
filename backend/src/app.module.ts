import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './common/auth/auth.module';
import { SubsidiariesModule } from './common/subsidiaries/subsidiaries.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProductsModule } from './ecommerce/products/products.module';
import { SecretariatModule } from './secretariat/secretariat.module';
import { HrModule } from './hr/hr.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { EquipementModule } from './maintenance/equipement/equipement.module';
import { MaintenanceRecordModule } from './maintenance/maintenance_record/maintenance_record.module';
import { OrdersModule } from './ecommerce/orders/orders.module';
import { TaxesModule } from './ecommerce/taxes/taxes.module';
import { CrmModule } from './crm/crm.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    // La configuration se fait maintenant via un tableau d'objets.
    // ttl est maintenant en millisecondes.
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 secondes
      limit: 10,
    }]),
    ConfigModule.forRoot({ isGlobal: true }), // Charge .env globalement
    CommonModule,
    SecretariatModule,
    AuthModule, // Importer AuthModule ici pour rendre les gardes disponibles globalement
    SubsidiariesModule,
    ProductsModule, 

    HrModule, // Importer AuthModule ici pour rendre les gardes disponibles globalement
    AuthModule,
    SubsidiariesModule,
    SecretariatModule,
    MaintenanceModule, 
    EquipementModule,
    MaintenanceRecordModule,
    OrdersModule,
    TaxesModule,
    CrmModule,
    FinanceModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
