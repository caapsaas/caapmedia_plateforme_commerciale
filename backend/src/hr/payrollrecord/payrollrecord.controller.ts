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
import { SubsidiaryGuard } from '../../common/auth/subsidiary/subsidiary.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { UserRole } from '@prisma/client';

@Controller('hr/payroll-records')
@UseGuards(JwtAuthGuard, RoleGuard, SubsidiaryGuard)
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
    const subsidiaryId = req.user.subsidiaryId;

    const isSuperAdmin =
      req.user.userRole === UserRole.SUPER_ADMIN ||
      req.user.additionalRoles?.includes(UserRole.SUPER_ADMIN) ||
      req.user.roles?.includes(UserRole.SUPER_ADMIN);

    if (subsidiaryId !== req.user.subsidiaryId && !isSuperAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cette filiale");
    }

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
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    const targetSubsidiaryId = subsidiaryId || req.user.subsidiaryId;

    const isSuperAdmin =
      req.user.userRole === UserRole.SUPER_ADMIN ||
      req.user.additionalRoles?.includes(UserRole.SUPER_ADMIN) ||
      req.user.roles?.includes(UserRole.SUPER_ADMIN);

    if (targetSubsidiaryId !== req.user.subsidiaryId && !isSuperAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cette filiale");
    }

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
    const isSuperAdmin =
      req.user.userRole === UserRole.SUPER_ADMIN ||
      req.user.additionalRoles?.includes(UserRole.SUPER_ADMIN) ||
      req.user.roles?.includes(UserRole.SUPER_ADMIN);

    if (!isSuperAdmin) {
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
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    const targetSubsidiaryId = subsidiaryId || req.user.subsidiaryId;

    const isSuperAdmin =
      req.user.userRole === UserRole.SUPER_ADMIN ||
      req.user.additionalRoles?.includes(UserRole.SUPER_ADMIN) ||
      req.user.roles?.includes(UserRole.SUPER_ADMIN);

    if (targetSubsidiaryId !== req.user.subsidiaryId && !isSuperAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cette filiale");
    }

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
    const targetSubsidiaryId = body.subsidiaryId || req.user.subsidiaryId;

    const isSuperAdmin =
      req.user.userRole === UserRole.SUPER_ADMIN ||
      req.user.additionalRoles?.includes(UserRole.SUPER_ADMIN) ||
      req.user.roles?.includes(UserRole.SUPER_ADMIN);

    if (targetSubsidiaryId !== req.user.subsidiaryId && !isSuperAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cette filiale");
    }

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
  update(
    @Param('id') id: string, // ✅ corrigé (avant: @Param() id)
    @Body() dto: UpdatePayrollRecordDto,
  ) {
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
    @Param('id') id: string, // ✅ corrigé (avant: @Param() id)
    @Body() body: { signature: string },
    @Request() req: any,
  ) {
    const user = req.user;
    const isHrOrAdmin =
      user.roles?.includes('HR_MANAGER') ||
      user.roles?.includes('ADMIN') ||
      user.userRole === 'HR_MANAGER' ||
      user.userRole === 'ADMIN';

    if (!isHrOrAdmin) {
      const record = await this.payrollRecordService.findOne(id);
      if (record.employeeId !== user.id) {
        throw new ForbiddenException(
          'Vous ne pouvez signer que votre propre fiche de paie',
        );
      }
    }

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
  remove(@Param('id') id: string) {
    // Pas de ParseUUIDPipe
    return this.payrollRecordService.remove(id);
  }
}
