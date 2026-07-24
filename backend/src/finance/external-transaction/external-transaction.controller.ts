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
  Request,
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
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';

@ApiTags('external-transactions')
@UseGuards(JwtAuthGuard)
@Controller('finance/external-transactions')
export class ExternalTransactionController {
  constructor(
    private readonly externalTransactionService: ExternalTransactionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle transaction externe' })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async create(@Body() createDto: CreateExternalTransactionDto) {
    return await this.externalTransactionService.create(createDto);
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
    @Query('subsidiaryId') subsidiaryId: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return await this.externalTransactionService.findAll(subsidiaryId, {
      type,
      category,
      status: status as any,
      startDate,
      endDate,
      search,
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
  async getStatistics(@Query('subsidiaryId') subsidiaryId: string) {
    return await this.externalTransactionService.getStatistics(subsidiaryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une transaction externe par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction récupérée avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async findOne(@Param('id') id: string) {
    return await this.externalTransactionService.findOne(id);
  }

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
  ) {
    return await this.externalTransactionService.update(id, updateDto);
  }

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
  async validate(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    return await this.externalTransactionService.validate(id, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une transaction externe' })
  @ApiResponse({ status: 200, description: 'Transaction annulée avec succès.' })
  @ApiResponse({ status: 400, description: 'Transaction déjà annulée.' })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée.' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  async cancel(@Param('id') id: string) {
    return await this.externalTransactionService.cancel(id);
  }

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
  async remove(@Param('id') id: string) {
    return await this.externalTransactionService.remove(id);
  }

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
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return await this.externalTransactionService.adminUpdate(
      id,
      updateDto,
      userId,
    );
  }

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
  async adminRemove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    return await this.externalTransactionService.adminRemove(id, userId);
  }
}
