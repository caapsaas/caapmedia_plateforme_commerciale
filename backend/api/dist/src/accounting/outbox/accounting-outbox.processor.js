"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AccountingOutboxProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingOutboxProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const journalization_service_1 = require("../journalization/journalization.service");
let AccountingOutboxProcessor = AccountingOutboxProcessor_1 = class AccountingOutboxProcessor {
    prisma;
    journalizationService;
    logger = new common_1.Logger(AccountingOutboxProcessor_1.name);
    MAX_ATTEMPTS = 5;
    BATCH_SIZE = 50;
    constructor(prisma, journalizationService) {
        this.prisma = prisma;
        this.journalizationService = journalizationService;
    }
    async processPending() {
        this.logger.debug('🔄 Outbox processor - cycle de traitement');
        try {
            const pending = await this.prisma.accountingOutboxEntry.findMany({
                where: {
                    status: client_1.AccountingOutboxStatus.PENDING,
                    attempts: { lt: this.MAX_ATTEMPTS },
                },
                take: this.BATCH_SIZE,
                orderBy: { createdAt: 'asc' },
            });
            if (pending.length === 0) {
                this.logger.debug('✅ Aucune entrée en attente');
                return;
            }
            this.logger.log(`📋 ${pending.length} entrée(s) à traiter`);
            let successCount = 0;
            let failureCount = 0;
            for (const entry of pending) {
                try {
                    await this.processEntry(entry);
                    successCount++;
                }
                catch (error) {
                    failureCount++;
                    await this.handleError(entry, error);
                }
            }
            this.logger.log(`✅ Cycle terminé: ${successCount} succès, ${failureCount} erreurs`);
        }
        catch (error) {
            this.logger.error(`❌ Erreur critique dans outbox processor: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async processEntry(entry) {
        this.logger.log(`⚙️ Traitement entry ${entry.id} - Type: ${entry.eventType}`);
        await this.dispatch(entry.eventType, entry.payload, entry.subsidiaryId);
        await this.prisma.accountingOutboxEntry.update({
            where: { id: entry.id },
            data: {
                status: client_1.AccountingOutboxStatus.PROCESSED,
                processedAt: new Date(),
            },
        });
        this.logger.log(`✅ Entry ${entry.id} traitée avec succès`);
    }
    async dispatch(eventType, payload, subsidiaryId) {
        const typedPayload = payload;
        switch (eventType) {
            case 'PAYROLL_ENTRY':
                await this.handlePayrollEntry(typedPayload, subsidiaryId);
                break;
            case 'BONUS_ENTRY':
                await this.handleBonusEntry(typedPayload, subsidiaryId);
                break;
            case 'CHARGE_PAYMENT_ENTRY':
                await this.handleChargePaymentEntry(typedPayload, subsidiaryId);
                break;
            default:
                throw new Error(`Type d'événement inconnu: ${eventType}`);
        }
    }
    async handlePayrollEntry(payload, subsidiaryId) {
        const { userId, operationDate, amount, description, sourceId } = payload;
        if (!sourceId) {
            throw new Error('sourceId (payrollRecordId) manquant dans payload PAYROLL_ENTRY');
        }
        if (!amount || amount <= 0) {
            throw new Error(`amount invalide dans payload PAYROLL_ENTRY: ${amount}`);
        }
        this.logger.log(`📝 Générer écriture comptable pour fiche ${sourceId}`);
        await this.journalizationService.journalize({
            subsidiaryId,
            userId: userId || 'system',
            operationDate: operationDate ? new Date(operationDate) : new Date(),
            amount,
            description: description || `Engagement de paie`,
            sourceType: 'PAYROLL_ACCRUAL',
            sourceId,
        });
        this.logger.log(`✅ Écriture comptable créée pour fiche ${sourceId}`);
    }
    async handleBonusEntry(payload, subsidiaryId) {
        const { userId, operationDate, amount, description, sourceId } = payload;
        if (!sourceId) {
            throw new Error('sourceId (payrollBonusId) manquant dans payload BONUS_ENTRY');
        }
        if (!amount || amount <= 0) {
            throw new Error(`amount invalide dans payload BONUS_ENTRY: ${amount}`);
        }
        this.logger.log(`📝 Générer écriture comptable pour paiement bonus ${sourceId}`);
        await this.journalizationService.journalize({
            subsidiaryId,
            userId: userId || 'system',
            operationDate: operationDate ? new Date(operationDate) : new Date(),
            amount,
            description: description || `Paiement de bonus`,
            sourceType: 'BONUS_PAYMENT',
            sourceId,
        });
        this.logger.log(`✅ Écriture comptable créée pour paiement bonus ${sourceId}`);
    }
    async handleChargePaymentEntry(payload, subsidiaryId) {
        const { userId, operationDate, amount, description, sourceId } = payload;
        if (!sourceId) {
            throw new Error('sourceId (chargePaymentId) manquant dans payload CHARGE_PAYMENT_ENTRY');
        }
        if (!amount || amount <= 0) {
            throw new Error(`amount invalide dans payload CHARGE_PAYMENT_ENTRY: ${amount}`);
        }
        this.logger.log(`📝 Générer écriture comptable pour paiement charge ${sourceId}`);
        await this.journalizationService.journalize({
            subsidiaryId,
            userId: userId || 'system',
            operationDate: operationDate ? new Date(operationDate) : new Date(),
            amount,
            description: description || `Paiement de charge patronale`,
            sourceType: 'PAYROLL_CHARGE_PAYMENT',
            sourceId,
        });
        this.logger.log(`✅ Écriture comptable créée pour paiement charge ${sourceId}`);
    }
    async handleError(entry, error) {
        const newAttempts = entry.attempts + 1;
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`⚠️ Entry ${entry.id} échouée (tentative ${newAttempts}/${this.MAX_ATTEMPTS}): ${errorMessage}`);
        const newStatus = newAttempts >= this.MAX_ATTEMPTS
            ? client_1.AccountingOutboxStatus.FAILED
            : client_1.AccountingOutboxStatus.PENDING;
        await this.prisma.accountingOutboxEntry.update({
            where: { id: entry.id },
            data: {
                attempts: newAttempts,
                lastError: errorMessage,
                status: newStatus,
            },
        });
        if (newStatus === client_1.AccountingOutboxStatus.FAILED) {
            this.logger.error(`🚨 Entry ${entry.id} FAILED après ${this.MAX_ATTEMPTS} tentatives - ACTION MANUELLE REQUISE`);
        }
    }
};
exports.AccountingOutboxProcessor = AccountingOutboxProcessor;
__decorate([
    (0, schedule_1.Cron)('*/20 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountingOutboxProcessor.prototype, "processPending", null);
exports.AccountingOutboxProcessor = AccountingOutboxProcessor = AccountingOutboxProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journalization_service_1.JournalizationService])
], AccountingOutboxProcessor);
//# sourceMappingURL=accounting-outbox.processor.js.map