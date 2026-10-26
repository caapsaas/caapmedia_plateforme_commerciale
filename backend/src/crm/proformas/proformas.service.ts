import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProformaDto, ProformaItemDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';
import {
  ProformaStatus,
  ContactStatus,
  OrderStatus,
  ProductionStatus,
  PaymentStatus,
  OrderSource,
} from '@prisma/client';
import { addDays } from 'date-fns';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/pagination/pagination';
import type { Proforma, Prisma } from '@prisma/client';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';

const creatorSelect = {
  id: true,
  userName: true,
  email: true,
} satisfies Prisma.UserSelect;
@Injectable()
export class ProformasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProformaDto: CreateProformaDto, user: JwtUser) {
    const scope = resolveScopeContext(user);
    // Le proforma et ses références locales doivent appartenir à la même filiale.
    const lead = await this.prisma.lead.findUnique({
      where: withSubsidiaryScope({ id: createProformaDto.leadId }, scope),
    });

    if (!lead) {
      throw new NotFoundException(
        `Lead with ID "${createProformaDto.leadId}" not found.`,
      );
    }

    // Pour le super administrateur, la filiale cible est celle du lead autorisé.
    const targetSubsidiaryId = lead.subsidiaryId;
    if (!targetSubsidiaryId)
      throw new BadRequestException('Le lead doit appartenir à une filiale.');

    if (createProformaDto.opportunityId) {
      const opportunity = await this.prisma.opportunity.findUnique({
        where: {
          id: createProformaDto.opportunityId,
          subsidiaryId: targetSubsidiaryId,
        },
        select: { id: true },
      });
      if (!opportunity)
        throw new NotFoundException(
          'Opportunité introuvable dans cette filiale.',
        );
    }

    // Générer le numéro Proforma
    const proformaNumber =
      await this.generateProformaNumber(targetSubsidiaryId);

    // Le taux de TVA vient toujours du taux par défaut configuré dans le
    // module taxes ; le commercial peut le surcharger explicitement (devis
    // négocié), mais l'absence de valeur ne doit jamais retomber sur 0.
    const taxRate =
      createProformaDto.taxRate ?? (await this.getDefaultTaxRatePercent());

    // Calculer les montants
    const { subtotal, taxAmount, totalAmount } = this.calculateAmounts(
      createProformaDto.items,
      taxRate,
    );

    // Calculer la date d'expiration
    const validityDays = createProformaDto.validityDays || 30;
    const validityDate = addDays(new Date(), validityDays);

    // Créer la proforma avec les items
    return this.prisma.proforma.create({
      data: {
        id: generateId(ID_PREFIXES.PROFORMA),
        proformaNumber,
        leadId: createProformaDto.leadId,
        opportunityId: createProformaDto.opportunityId,
        clientName: createProformaDto.clientName,
        clientEmail: createProformaDto.clientEmail,
        clientPhone: createProformaDto.clientPhone,
        clientCompany: createProformaDto.clientCompany,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        validityDate,
        notes: createProformaDto.notes,
        status: ProformaStatus.DRAFT,
        createdBy: user.id,
        subsidiaryId: targetSubsidiaryId,
        items: {
          create: createProformaDto.items.map((item: ProformaItemDto) => ({
            id: generateId(ID_PREFIXES.PROFORMAITEM),
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        lead: true,
        createdByUser: { select: creatorSelect },
      },
    });
  }

  async findAll(
    user: JwtUser,
    paginationQuery: PaginationQueryDto,
    status?: ProformaStatus,
  ): Promise<PaginatedResult<Proforma>> {
    const where: Prisma.ProformaWhereInput = withSubsidiaryScope(
      {},
      resolveScopeContext(user),
    );
    if (status) {
      where.status = status;
    }

    if (paginationQuery.search) {
      where.OR = [
        {
          proformaNumber: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
        {
          clientName: { contains: paginationQuery.search, mode: 'insensitive' },
        },
        {
          clientCompany: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return paginate<Proforma>(
      this.prisma.proforma,
      {
        where,
        include: {
          items: { include: { product: true } },
          lead: true,
          createdByUser: { select: creatorSelect },
        },
        orderBy: { createdAt: 'desc' },
      },
      paginationQuery,
    );
  }

  /**
   * Compte les proformas par statut pour alimenter les badges d'onglets côté
   * frontend, sans avoir à charger toute la liste en mémoire.
   */
  async getStatusCounts(user: JwtUser) {
    const scope = withSubsidiaryScope({}, resolveScopeContext(user));
    const [all, draft, sent, accepted, rejected] = await Promise.all([
      this.prisma.proforma.count({ where: scope }),
      this.prisma.proforma.count({
        where: { ...scope, status: ProformaStatus.DRAFT },
      }),
      this.prisma.proforma.count({
        where: { ...scope, status: ProformaStatus.SENT },
      }),
      this.prisma.proforma.count({
        where: { ...scope, status: ProformaStatus.ACCEPTED },
      }),
      this.prisma.proforma.count({
        where: { ...scope, status: ProformaStatus.REJECTED },
      }),
    ]);

    return { all, draft, sent, accepted, rejected };
  }

  async findOne(id: string, user: JwtUser) {
    const proforma = await this.prisma.proforma.findUnique({
      where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
      include: {
        items: {
          include: {
            product: true,
          },
        },
        lead: true,
        createdByUser: { select: creatorSelect },
        opportunity: true,
      },
    });

    if (!proforma) {
      throw new NotFoundException(`Proforma with ID "${id}" not found.`);
    }

    return proforma;
  }

  async update(
    id: string,
    updateProformaDto: UpdateProformaDto,
    user: JwtUser,
  ) {
    const proforma = await this.findOne(id, user);

    // Vérifier que la proforma est en DRAFT
    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be updated.');
    }

    const { items, ...changes } = updateProformaDto;
    const data: Prisma.ProformaUpdateInput = { ...changes };
    if (items || changes.taxRate !== undefined) {
      const amountItems =
        items ??
        proforma.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
        }));
      Object.assign(
        data,
        this.calculateAmounts(
          amountItems,
          changes.taxRate ?? proforma.taxRate.toNumber(),
        ),
      );
    }
    if (items) {
      data.items = {
        deleteMany: {},
        create: items.map((item) => ({
          id: generateId(ID_PREFIXES.PROFORMAITEM),
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        })),
      };
    }
    // Remplacement des lignes et mise à jour du devis dans une seule écriture Prisma.
    return this.prisma.proforma.update({
      where: withSubsidiaryScope(
        { id, status: ProformaStatus.DRAFT },
        resolveScopeContext(user),
      ),
      data,
      include: {
        items: { include: { product: true } },
        lead: true,
        createdByUser: { select: creatorSelect },
      },
    });
  }

  async send(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be sent.');
    }

    return this.prisma.proforma.update({
      where: withSubsidiaryScope(
        { id, status: proforma.status },
        resolveScopeContext(user),
      ),
      data: {
        status: ProformaStatus.SENT,
        sentAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        lead: true,
      },
    });
  }

  async markAsViewed(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (
      proforma.status !== ProformaStatus.SENT &&
      proforma.status !== ProformaStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed proformas can be marked as viewed.',
      );
    }

    if (!proforma.viewedAt) {
      return this.prisma.proforma.update({
        where: withSubsidiaryScope(
          { id, status: proforma.status },
          resolveScopeContext(user),
        ),
        data: {
          status: ProformaStatus.VIEWED,
          viewedAt: new Date(),
        },
      });
    }

    return proforma;
  }

  /**
   * Acceptation = conversion directe en commande (pas d'état ACCEPTED
   * intermédiaire distinct) — voir Doc plan d'implémentation §Phase G.4.
   * Conversion "simple" : pas de contrôle/réservation de stock, la commande
   * est créée telle quelle depuis les lignes de la proforma.
   *
   * Le client de la proforma (Lead) n'a pas d'équivalent Contact CRM tant
   * qu'aucune commande n'a été passée — on résout donc un Contact par email
   * (le seul champ unique partagé), ou on en crée un nouveau ("non vérifié",
   * sans mot de passe : pas d'accès portail tant que le client ne s'inscrit
   * pas lui-même).
   */
  async accept(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (
      proforma.status !== ProformaStatus.SENT &&
      proforma.status !== ProformaStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed proformas can be accepted.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.proforma.updateMany({
        where: withSubsidiaryScope(
          { id, status: proforma.status },
          resolveScopeContext(user),
        ),
        data: { status: ProformaStatus.CONVERTED, acceptedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new ConflictException(
          'Ce proforma a déjà été modifié. Rechargez-le avant de réessayer.',
        );
      }
      let contact = await tx.contact.findUnique({
        where: { email: proforma.clientEmail },
      });
      if (!contact) {
        contact = await tx.contact.create({
          data: {
            id: generateId(ID_PREFIXES.CONTACT),
            contactName: proforma.clientName,
            company: proforma.clientCompany || proforma.clientName,
            email: proforma.clientEmail,
            phone: proforma.clientPhone,
            since: new Date(),
            address: '',
            subsidiaryId: proforma.subsidiaryId,
            status: ContactStatus.ACTIVE,
          },
        });
      }

      const defaultTaxRate = await tx.taxRate.findFirstOrThrow({
        where: { isDefault: true },
      });

      const order = await tx.order.create({
        data: {
          id: generateId(ID_PREFIXES.ORDER),
          customerName: proforma.clientName,
          customerId: contact.id,
          subsidiaryId: proforma.subsidiaryId,
          opportunityId: proforma.opportunityId,
          subtotal: proforma.subtotal,
          taxAmount: proforma.taxAmount,
          totalAmount: proforma.totalAmount,
          taxRateValue: proforma.taxRate,
          taxRateId: defaultTaxRate.id,
          applyTax: proforma.taxAmount.greaterThan(0),
          paymentDueDate: proforma.validityDate,
          status: OrderStatus.NEW,
          productionStatus: ProductionStatus.PREPRESS,
          paymentStatus: PaymentStatus.UNPAID,
          source: OrderSource.QUOTE_REQUEST,
          orderItems: {
            create: proforma.items.map((item) => ({
              id: generateId(ID_PREFIXES.ORDERITEM),
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice.mul(item.quantity),
            })),
          },
        },
      });

      const updatedProforma = await tx.proforma.findUniqueOrThrow({
        where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
        include: {
          items: { include: { product: true } },
        },
      });

      return { ...updatedProforma, orderId: order.id };
    });
  }

  async reject(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (
      proforma.status !== ProformaStatus.SENT &&
      proforma.status !== ProformaStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed proformas can be rejected.',
      );
    }

    return this.prisma.proforma.update({
      where: withSubsidiaryScope(
        { id, status: proforma.status },
        resolveScopeContext(user),
      ),
      data: {
        status: ProformaStatus.REJECTED,
      },
    });
  }

  async remove(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be deleted.');
    }

    await this.prisma.proforma.delete({
      where: withSubsidiaryScope(
        { id, status: proforma.status },
        resolveScopeContext(user),
      ),
    });

    return {
      message: `Proforma "${proforma.proformaNumber}" deleted successfully.`,
    };
  }

  // Utilitaires privés

  private async generateProformaNumber(subsidiaryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.proforma.count({
      where: {
        subsidiaryId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const number = String(count + 1).padStart(4, '0');
    return `PRO-${year}-${number}`;
  }

  // Taux de TVA par défaut configuré dans le module taxes, converti en
  // pourcentage (Proforma.taxRate est stocké en 0-100, TaxRate.rate en 0-1).
  private async getDefaultTaxRatePercent(): Promise<number> {
    const taxRate = await this.prisma.taxRate.findFirstOrThrow({
      where: { isDefault: true },
    });
    return Number(taxRate.rate) * 100;
  }

  private calculateAmounts(items: ProformaItemDto[], taxRate: number) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
