import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { PayrollBonusAndChargeService } from './payroll-bonus-and-charge.service';
import { PayrollCumulativeService } from './payroll-cumulative.service';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import {
  CreatePayrollRecordDto,
  UpdatePayrollRecordDto,
} from './dto/payrollrecord.dto';
import {
  GenerateThirteenthMonthDto,
  ApproveBonusDto,
  RecordBonusPaymentDto,
  CancelBonusDto,
  AccumulateChargesDto,
  RecordChargePaymentDto,
} from './dto/payroll-bonus-and-charge.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import {
  resolveScopeContext,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
} from '../../common/utils/subsidiary-scope';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

@Controller('hr/payroll-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PayrollRecordController {
  constructor(
    private readonly payrollRecordService: PayrollRecordService,
    private readonly bonusAndChargeService: PayrollBonusAndChargeService,
    private readonly cumulativeService: PayrollCumulativeService,
    private readonly calculator: CameroonPayrollCalculatorService,
  ) {}

  // ============================================================
  // CRÉATION
  // ============================================================

  /**
   * Créer une fiche de paie manuellement
   * POST /hr/payroll-records
   */
  @Post()
  @Roles('HR_MANAGER', 'ADMIN')
  create(@Body() dto: CreatePayrollRecordDto, @Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);

    return this.payrollRecordService.create(dto, dto.employeeId, subsidiaryId);
  }

  // ============================================================
  // LECTURE
  // ============================================================

  /**
   * Liste toutes les fiches de paie de la filiale de l'utilisateur
   * GET /hr/payroll-records
   */
  @Get()
  @Roles('HR_MANAGER', 'ADMIN')
  findAll(@Request() req: any, @Query() query: any) {
    const paginationQuery = new PaginationQueryDto();
    paginationQuery.page = query.page ? Number(query.page) : 1;
    paginationQuery.limit = query.limit ? Number(query.limit) : 10;
    paginationQuery.search = query.search;

    const ctx = resolveScopeContext(req.user);
    const targetSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      query.subsidiaryId,
    );

    return this.payrollRecordService.findAll(
      targetSubsidiaryId,
      paginationQuery,
    );
  }

  /**
   * Vue globale : toutes les fiches de paie de toutes les filiales (SUPER_ADMIN uniquement)
   * GET /hr/payroll-records/global
   */
  @Get('global')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('SUPER_ADMIN')
  findAllGlobal(@Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    if (!ctx.hasGlobalScope) {
      throw new ForbiddenException('Accès réservé au SUPER_ADMIN');
    }

    return this.payrollRecordService.findAllGlobal();
  }

  /**
   * Récupérer les fiches de paie d'une période précise
   * GET /hr/payroll-records/by-period?period=2026-07
   */
  @Get('by-period')
  @Roles('HR_MANAGER', 'ADMIN')
  findByPeriod(
    @Query('period') period: string,
    @Request() req: any,
    @Query('subsidiaryId') subsidiaryIdFilter?: string,
  ) {
    const ctx = resolveScopeContext(req.user);
    const targetSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );

    return this.payrollRecordService.findByPeriod(targetSubsidiaryId, period);
  }

  /**
   * Récupérer l'historique de paie d'un employé
   * GET /hr/payroll-records/by-employee/:employeeId
   */
  @Get('by-employee/:employeeId')
  @Roles('HR_MANAGER', 'ADMIN')
  findByEmployee(@Param('employeeId') employeeId: string) {
    // Pas de ParseUUIDPipe : les IDs du projet ne sont pas des UUID
    return this.payrollRecordService.findByEmployee(employeeId);
  }

  /**
   * Récupérer une fiche de paie par ID
   * GET /hr/payroll-records/:id
   */
  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  findOne(@Param('id') id: string) {
    // Pas de ParseUUIDPipe
    return this.payrollRecordService.findOne(id);
  }

  // ============================================================
  // TRAITEMENT DE PAIE (génération automatique)
  // ============================================================

  /**
   * Générer automatiquement les fiches de paie pour tous les employés actifs
   * POST /hr/payroll-records/process
   */
  @Post('process')
  @Roles('HR_MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  processPayroll(
    @Body()
    body: {
      period: string;
      subsidiaryId?: string;
      riskGroup?: 'A' | 'B' | 'C';
      applyCfc?: boolean;
      applyFne?: boolean;
      forceRegenerate?: boolean; // Regénérer même si une fiche existe déjà
    },
    @Request() req: any,
  ) {
    const ctx = resolveScopeContext(req.user);
    const targetSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      body.subsidiaryId,
    );

    return this.payrollRecordService.processPayroll(
      targetSubsidiaryId,
      body.period,
      {
        riskGroup: body.riskGroup,
        applyCfc: body.applyCfc,
        applyFne: body.applyFne,
        forceRegenerate: body.forceRegenerate,
      },
    );
  }

  /**
   * Simuler le calcul de paie d'un employé (sans sauvegarder)
   * POST /hr/payroll-records/simulate
   */
  @Post('simulate')
  @Roles('HR_MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  simulatePayroll(
    @Body()
    body: {
      employeeId: string;
      bonus?: number;
      allowances?: number;
      overtime?: number;
      riskGroup?: 'A' | 'B' | 'C';
    },
  ) {
    return this.payrollRecordService.simulatePayroll(body.employeeId, {
      bonus: body.bonus,
      allowances: body.allowances,
      overtime: body.overtime,
      riskGroup: body.riskGroup,
    });
  }

  /**
   * Simuler le calcul inverse : net → base (pour formulaire employé)
   * POST /hr/payroll-records/simulate-net-to-gross
   */
  @Post('simulate-net-to-gross')
  @Roles('HR_MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  simulateNetToGross(
    @Body()
    body: {
      targetNetSalary: number;
      bonus?: number;
      riskGroup?: 'A' | 'B' | 'C';
    },
  ) {
    const result = this.calculator.calculateFromNetSalary({
      targetNetSalary: body.targetNetSalary,
      bonus: body.bonus ?? 0,
      riskGroup: body.riskGroup ?? 'A',
      applyCfc: true,
      applyFne: true,
    });
    return result;
  }

  // ============================================================
  // MISE À JOUR
  // ============================================================

  /**
   * Modifier une fiche de paie (uniquement si non payée)
   * PATCH /hr/payroll-records/:id
   */
  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollRecordDto,
    @Request() req: any,
  ) {
    const record = await this.payrollRecordService.findOne(id);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return this.payrollRecordService.update(id, dto);
  }

  /**
   * Signer une fiche de paie → passe en statut PAID
   * PATCH /hr/payroll-records/:id/sign
   */
  @Patch(':id/sign')
  @Roles('HR_MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async signPayrollRecord(
    @Param('id') id: string,
    @Body() body: { signature: string },
    @Request() req: any,
  ) {
    const record = await this.payrollRecordService.findOne(id);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return this.payrollRecordService.signPayrollRecord(id, body.signature);
  }

  // ============================================================
  // BONUS & CHARGES (GESTION UNIFIÉE)
  // ============================================================

  /**
   * Générer le 13e mois pour un employé
   * POST /hr/payroll-records/bonus/thirteenth-month
   */
  @Post('bonus/thirteenth-month')
  @Roles('HR_MANAGER', 'ADMIN')
  async generateThirteenthMonth(
    @Body() dto: GenerateThirteenthMonthDto,
    @Request() req: any,
  ) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.generateThirteenthMonth(
      dto.employeeId,
      dto.month,
      dto.year,
    );
  }

  /**
   * Lister les bonus en attente d'approbation
   * GET /hr/payroll-records/bonus/pending
   */
  @Get('bonus/pending')
  @Roles('HR_MANAGER', 'ADMIN')
  async getPendingBonuses(@Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.getPendingBonuses(subsidiaryId);
  }

  /**
   * Lister les bonus en attente de paiement
   * GET /hr/payroll-records/bonus/approved
   */
  @Get('bonus/approved')
  @Roles('HR_MANAGER', 'ADMIN')
  async getApprovedBonuses(@Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.getApprovedBonuses(subsidiaryId);
  }

  /**
   * Approuver un bonus (PENDING → APPROVED)
   * POST /hr/payroll-records/bonus/:bonusId/approve
   */
  @Post('bonus/:bonusId/approve')
  @Roles('HR_MANAGER', 'ADMIN')
  async approveBonus(@Param('bonusId') bonusId: string, @Request() req: any) {
    return this.bonusAndChargeService.approveBonus(bonusId, req.user.id);
  }

  /**
   * Enregistrer le paiement d'un bonus (APPROVED → PAID)
   * POST /hr/payroll-records/bonus/:bonusId/pay
   */
  @Post('bonus/:bonusId/pay')
  @Roles('HR_MANAGER', 'ADMIN')
  async recordBonusPayment(
    @Param('bonusId') bonusId: string,
    @Body() dto: RecordBonusPaymentDto,
  ) {
    return this.bonusAndChargeService.recordBonusPayment(
      bonusId,
      dto.bankTransferId,
      dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
    );
  }

  /**
   * Annuler un bonus
   * POST /hr/payroll-records/bonus/:bonusId/cancel
   */
  @Post('bonus/:bonusId/cancel')
  @Roles('HR_MANAGER', 'ADMIN')
  async cancelBonus(
    @Param('bonusId') bonusId: string,
    @Body() dto: CancelBonusDto,
  ) {
    return this.bonusAndChargeService.cancelBonus(bonusId, dto.reason);
  }

  /**
   * Extraire les bonus des fiches de paie et créer des PayrollBonus
   * POST /hr/payroll-records/bonus/extract-from-payroll
   */
  @Post('bonus/extract-from-payroll')
  @Roles('HR_MANAGER', 'ADMIN')
  async extractBonusesFromPayroll(
    @Body() dto: { month: string },
    @Request() req: any,
  ) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.extractBonusesFromPayroll(
      subsidiaryId,
      dto.month,
    );
  }

  /**
   * Accumuler les charges patronales pour un mois
   * POST /hr/payroll-records/charges/accumulate
   */
  @Post('charges/accumulate')
  @Roles('HR_MANAGER', 'ADMIN')
  async accumulateCharges(
    @Body() dto: AccumulateChargesDto,
    @Request() req: any,
  ) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx, dto.subsidiaryId);
    return this.bonusAndChargeService.accumulateEmployerCharges(
      subsidiaryId,
      dto.month,
    );
  }

  /**
   * Lister les charges en retard
   * GET /hr/payroll-records/charges/overdue
   */
  @Get('charges/overdue')
  @Roles('HR_MANAGER', 'ADMIN')
  async getOverdueCharges(@Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.getOverdueCharges(subsidiaryId);
  }

  /**
   * Lister les charges dues ce mois-ci
   * GET /hr/payroll-records/charges/due-this-month
   */
  @Get('charges/due-this-month')
  @Roles('HR_MANAGER', 'ADMIN')
  async getChargesDueThisMonth(@Request() req: any) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.getChargesDueThisMonth(subsidiaryId);
  }

  /**
   * Résumé des charges pour une période
   * GET /hr/payroll-records/charges/summary?startMonth=2024-01&endMonth=2024-12
   */
  @Get('charges/summary')
  @Roles('HR_MANAGER', 'ADMIN')
  async getChargesSummary(
    @Query('startMonth') startMonth: string,
    @Query('endMonth') endMonth: string,
    @Request() req: any,
  ) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.bonusAndChargeService.getChargesSummary(
      subsidiaryId,
      startMonth,
      endMonth,
    );
  }

  /**
   * Enregistrer le paiement d'une charge
   * POST /hr/payroll-records/charges/:chargePaymentId/pay
   */
  @Post('charges/:chargePaymentId/pay')
  @Roles('HR_MANAGER', 'ADMIN')
  async recordChargePayment(
    @Param('chargePaymentId') chargePaymentId: string,
    @Body() dto: RecordChargePaymentDto,
  ) {
    return this.bonusAndChargeService.recordChargePayment(
      chargePaymentId,
      dto.bankTransferId,
      dto.paidAmount,
      dto.declarationNumber,
    );
  }

  // ============================================================
  // CUMULS & DÉTAILS DÉDUCTIONS (Phase 3-4)
  // ============================================================

  /**
   * Obtenir le cumul annuel d'un employé
   * GET /hr/payroll-records/cumulative/:employeeId?year=2026
   */
  @Get('cumulative/:employeeId')
  @Roles('HR_MANAGER', 'ADMIN')
  async getAnnualCumulative(
    @Param('employeeId') employeeId: string,
    @Query('year') year?: string,
  ) {
    const queryYear = year || new Date().getFullYear().toString();
    return this.cumulativeService.getAnnualCumulative(employeeId, queryYear);
  }

  /**
   * Obtenir les détails de déductions d'une fiche de paie
   * GET /hr/payroll-records/:payrollRecordId/deduction-details
   */
  @Get(':payrollRecordId/deduction-details')
  @Roles('HR_MANAGER', 'ADMIN')
  async getDeductionDetails(
    @Param('payrollRecordId') payrollRecordId: string,
    @Request() req: any,
  ) {
    // Vérifier l'accès subsidiaire
    const payroll = await this.payrollRecordService.findOne(payrollRecordId);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(payroll.subsidiaryId, ctx);

    return this.cumulativeService.getDeductionDetails(payrollRecordId);
  }

  // ============================================================
  // SUPPRESSION
  // ============================================================

  /**
   * Supprimer une fiche de paie (uniquement si non payée)
   * DELETE /hr/payroll-records/:id
   */
  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  async remove(@Param('id') id: string, @Request() req: any) {
    const record = await this.payrollRecordService.findOne(id);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return this.payrollRecordService.remove(id);
  }
}
