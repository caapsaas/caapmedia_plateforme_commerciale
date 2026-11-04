"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const private_documents_module_1 = require("./common/private-documents/private-documents.module");
const need_requests_module_1 = require("./purchase/need-requests/need-requests.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./common/utils/prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./common/auth/auth.module");
const subsidiaries_module_1 = require("./common/subsidiaries/subsidiaries.module");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const products_module_1 = require("./ecommerce/products/products.module");
const secretariat_module_1 = require("./secretariat/secretariat.module");
const hr_module_1 = require("./hr/hr.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const equipement_module_1 = require("./maintenance/equipement/equipement.module");
const maintenance_record_module_1 = require("./maintenance/maintenance_record/maintenance_record.module");
const orders_module_1 = require("./ecommerce/orders/orders.module");
const taxes_module_1 = require("./ecommerce/taxes/taxes.module");
const crm_module_1 = require("./crm/crm.module");
const sales_module_1 = require("./ecommerce/sales/sales.module");
const finance_module_1 = require("./finance/finance.module");
const purchase_module_1 = require("./purchase/purchase.module");
const ecommerce_module_1 = require("./ecommerce/ecommerce.module");
const analytics_module_1 = require("./statistics/analytics/analytics.module");
const statistics_module_1 = require("./statistics/statistics.module");
const newsletter_module_1 = require("./newsletter/newsletter.module");
const accounting_module_1 = require("./accounting/accounting.module");
const accounting_access_module_1 = require("./accounting-access/accounting-access.module");
const notifications_module_1 = require("./notifications/notifications.module");
const env_validation_1 = require("./config/env.validation");
const configuration_module_1 = require("./configuration/configuration.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 300,
                },
            ]),
            config_1.ConfigModule.forRoot({ isGlobal: true, validate: env_validation_1.validate }),
            prisma_module_1.PrismaModule,
            private_documents_module_1.PrivateDocumentsModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            subsidiaries_module_1.SubsidiariesModule,
            ecommerce_module_1.EcommerceModule,
            secretariat_module_1.SecretariatModule,
            hr_module_1.HrModule,
            maintenance_module_1.MaintenanceModule,
            equipement_module_1.EquipementModule,
            maintenance_record_module_1.MaintenanceRecordModule,
            orders_module_1.OrdersModule,
            taxes_module_1.TaxesModule,
            crm_module_1.CrmModule,
            sales_module_1.SalesModule,
            products_module_1.ProductsModule,
            finance_module_1.FinanceModule,
            purchase_module_1.PurchaseModule,
            need_requests_module_1.NeedRequestsModule,
            analytics_module_1.AnalyticsModule,
            statistics_module_1.StatisticsModule,
            newsletter_module_1.NewsletterModule,
            accounting_module_1.AccountingModule,
            accounting_access_module_1.AccountingAccessModule,
            notifications_module_1.NotificationsModule,
            configuration_module_1.ConfigurationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map