import { UserRole } from '@prisma/client';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExternalTransactionService } from './external-transaction.service';
import { CreateExternalTransactionDto } from './dto/create-external-transaction.dto';
import { UpdateExternalTransactionDto } from './dto/update-external-transaction.dto';
import { FindExternalTransactionsDto } from './dto/find-external-transactions.dto';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { financeSubsidiaryId } from '../finance-scope';
import {
  ActiveRoles,
  CurrentUser,
} from '../../common/auth/role/role.decorator';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';

@ApiTags('external-transactions')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('finance/external-transactions')
export class ExternalTransactionController {
  constructor(
    private readonly externalTransactionService: ExternalTransactionService,
  ) {}

  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle transaction externe' })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async create(
    @Body() createDto: CreateExternalTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.externalTransactionService.create({
      ...createDto,
      createdBy: user.id,
      subsidiaryId:
        financeSubsidiaryId(user, createDto.subsidiaryId) ?? user.subsidiaryId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les transactions externes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des transactions récupérée avec succès.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrer par type de transaction',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtrer par catégorie',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Rechercher dans description ou référence',
  })
  async findAll(
    @Query() query: FindExternalTransactionsDto,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.externalTransactionService.findAll({
      ...query,
      subsidiaryId: financeSubsidiaryId(user, query.subsidiaryId),
    });
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Récupérer les statistiques des transactions externes',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès.',
  })
  @ApiQuery({
    name: 'subsidiaryId',
    required: true,
    description: 'ID de la filiale',
  })
  async getStatistics(
    @Query('subsidiaryId') subsidiaryId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.externalTransactionService.getStatistics(
      financeSubsidiaryId(user, subsidiaryId ?? user.subsidiaryId) ??
        user.subsidiaryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une transaction externe par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction récupérée avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.externalTransactionService.findOne(
      id,
      financeSubsidiaryId(user),
    );
  }

  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une transaction externe' })
  @ApiResponse({
    status: 200,
    description: 'Transaction mise à jour avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExternalTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.externalTransactionService.update(
      id,
      updateDto,
      financeSubsidiaryId(user),
    );
  }

  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @Patch(':id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider une transaction externe' })
  @ApiResponse({ status: 200, description: 'Transaction validée avec succès.' })
  @ApiResponse({
    status: 400,
    description: 'Transaction déjà validée ou annulée.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async validate(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.externalTransactionService.validate(
      id,
      financeSubsidiaryId(user),
      user.id,
    );
  }

  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une transaction externe' })
  @ApiResponse({ status: 200, description: 'Transaction annulée avec succès.' })
  @ApiResponse({ status: 400, description: 'Transaction déjà annulée.' })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.externalTransactionService.cancel(
      id,
      financeSubsidiaryId(user),
    );
  }

  @ActiveRoles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une transaction externe' })
  @ApiResponse({
    status: 200,
    description: 'Transaction supprimée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une transaction validée.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.externalTransactionService.remove(
      id,
      financeSubsidiaryId(user),
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Patch(':id/admin-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mettre à jour une transaction validée (Admin/Directeur Financier uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction mise à jour avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Accès refusé ou transaction non trouvée.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() updateDto: UpdateExternalTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.externalTransactionService.adminUpdate(
      id,
      updateDto,
      user.subsidiaryId,
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Delete(':id/admin-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Supprimer une transaction validée (Admin/Directeur Financier uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction supprimée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Accès refusé ou transaction non trouvée.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async adminRemove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.externalTransactionService.adminRemove(
      id,
      user.subsidiaryId,
    );
  }
}
