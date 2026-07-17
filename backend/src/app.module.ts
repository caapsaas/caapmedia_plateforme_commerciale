import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/utils/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './common/auth/auth.module';
import { SubsidiariesModule } from './common/subsidiaries/subsidiaries.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProductsModule } from './ecommerce/products/products.module';
import { SecretariatModule } from './secretariat/secretariat.module';
import { HrModule } from './hr/hr.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { EquipementModule } from './maintenance/equipement/equipement.module';
import { MaintenanceRecordModule } from './maintenance/maintenance_record/maintenance_record.module';
import { OrdersModule } from './ecommerce/orders/orders.module';
import { TaxesModule } from './ecommerce/taxes/taxes.module';
import { CrmModule } from './crm/crm.module';
import { SalesModule } from './ecommerce/sales/sales.module';
import { FinanceModule } from './finance/finance.module';
import { PurchaseModule } from './purchase/purchase.module';
import { EcommerceModule } from './ecommerce/ecommerce.module';
import { AnalyticsModule } from './statistics/analytics/analytics.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { AccountingModule } from './accounting/accounting.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // La configuration se fait maintenant via un tableau d'objets.
    // ttl est maintenant en millisecondes.
    // Defaut global genereux (couvre le trafic normal d'un dashboard: chargement
    // de page = plusieurs GET en parallele, et une IP de bureau est souvent
    // partagee par plusieurs employes via NAT). Les endpoints sensibles
    // (login, refresh, forgot-password) ont leur propre @Throttle() plus
    // strict qui prend le dessus sur ce defaut, voir auth.controller.ts.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 300,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, validate }), // Charge .env globalement, échoue au démarrage si invalide
    PrismaModule,
    CommonModule,
    SecretariatModule,
    AuthModule,
    SubsidiariesModule,
    EcommerceModule,

    HrModule,
    AuthModule,
    SubsidiariesModule,
    SecretariatModule,
    MaintenanceModule,
    EquipementModule,
    MaintenanceRecordModule,
    OrdersModule,
    TaxesModule,
    CrmModule,
    SalesModule,
    ProductsModule,
    FinanceModule,
    PurchaseModule,
    AnalyticsModule,
    StatisticsModule,
    NewsletterModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerModule.forRoot() ne fait qu'enregistrer la config: sans ce
    // guard applique globalement, aucune limite n'est jamais appliquee
    // (@Throttle() sur une route n'a d'effet que si ce guard tourne).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
