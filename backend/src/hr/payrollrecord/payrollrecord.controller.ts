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
import {
  CreatePayrollRecordDto,
  UpdatePayrollRecordDto,
} from './dto/payrollrecord.dto';
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
  constructor(private readonly payrollRecordService: PayrollRecordService) {}

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
  findAll(
    @Request() req: any,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('subsidiaryId') subsidiaryIdFilter?: string,
  ) {
    const ctx = resolveScopeContext(req.user);
    const targetSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
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
