import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProformaDto, ProformaItemDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';
import {
  User,
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
@Injectable()
export class ProformasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProformaDto: CreateProformaDto, user: User) {
    // Vérifier que le lead existe
    const lead = await this.prisma.lead.findUnique({
      where: { id: createProformaDto.leadId },
    });

    if (!lead) {
      throw new NotFoundException(
        `Lead with ID "${createProformaDto.leadId}" not found.`,
      );
    }

    // Générer le numéro Proforma
    const proformaNumber = await this.generateProformaNumber(user.subsidiaryId);

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
        subsidiaryId: user.subsidiaryId,
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
        createdByUser: true,
      },
    });
  }

  async findAll(
    subsidiaryId: string,
    paginationQuery: PaginationQueryDto,
    status?: ProformaStatus,
  ): Promise<PaginatedResult<Proforma>> {
    const where: Prisma.ProformaWhereInput = { subsidiaryId };
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
          createdByUser: true,
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
  async getStatusCounts(subsidiaryId: string) {
    const [all, draft, sent, accepted, rejected] = await Promise.all([
      this.prisma.proforma.count({ where: { subsidiaryId } }),
      this.prisma.proforma.count({
        where: { subsidiaryId, status: ProformaStatus.DRAFT },
      }),
      this.prisma.proforma.count({
        where: { subsidiaryId, status: ProformaStatus.SENT },
      }),
      this.prisma.proforma.count({
        where: { subsidiaryId, status: ProformaStatus.ACCEPTED },
      }),
      this.prisma.proforma.count({
        where: { subsidiaryId, status: ProformaStatus.REJECTED },
      }),
    ]);

    return { all, draft, sent, accepted, rejected };
  }

  async findOne(id: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        lead: true,
        createdByUser: true,
        opportunity: true,
      },
    });

    if (!proforma) {
      throw new NotFoundException(`Proforma with ID "${id}" not found.`);
    }

    return proforma;
  }

  async update(id: string, updateProformaDto: UpdateProformaDto) {
    const proforma = await this.findOne(id);

    // Vérifier que la proforma est en DRAFT
    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be updated.');
    }

    // Calculer les nouveaux montants si les items ont changé
    const data: any = { ...updateProformaDto };
    if (updateProformaDto.items) {
      const { subtotal, taxAmount, totalAmount } = this.calculateAmounts(
        updateProformaDto.items,
        updateProformaDto.taxRate || proforma.taxRate.toNumber(),
      );
      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.totalAmount = totalAmount;

      // Supprimer les items existants et en créer de nouveaux
      await this.prisma.proformaItem.deleteMany({
        where: { proformaId: id },
      });

      data.items = {
        create: updateProformaDto.items.map((item: ProformaItemDto) => ({
          id: generateId(ID_PREFIXES.PROFORMAITEM),
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        })),
      };
      delete data.items;
    }

    return this.prisma.proforma.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        lead: true,
        createdByUser: true,
      },
    });
  }

  async send(id: string) {
    const proforma = await this.findOne(id);

    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be sent.');
    }

    return this.prisma.proforma.update({
      where: { id },
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

  async markAsViewed(id: string) {
    const proforma = await this.findOne(id);

    if (proforma.status === ProformaStatus.DRAFT) {
      throw new BadRequestException(
        'Draft proformas cannot be marked as viewed.',
      );
    }

    if (!proforma.viewedAt) {
      return this.prisma.proforma.update({
        where: { id },
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
  async accept(id: string) {
    const proforma = await this.findOne(id);

    if (
      proforma.status !== ProformaStatus.SENT &&
      proforma.status !== ProformaStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed proformas can be accepted.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
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

      const updatedProforma = await tx.proforma.update({
        where: { id },
        data: {
          status: ProformaStatus.CONVERTED,
          acceptedAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
        },
      });

      return { ...updatedProforma, orderId: order.id };
    });
  }

  async reject(id: string) {
    const proforma = await this.findOne(id);

    if (
      proforma.status !== ProformaStatus.SENT &&
      proforma.status !== ProformaStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Only sent or viewed proformas can be rejected.',
      );
    }

    return this.prisma.proforma.update({
      where: { id },
      data: {
        status: ProformaStatus.REJECTED,
      },
    });
  }

  async remove(id: string) {
    const proforma = await this.findOne(id);

    if (proforma.status !== ProformaStatus.DRAFT) {
      throw new BadRequestException('Only draft proformas can be deleted.');
    }

    await this.prisma.proforma.delete({
      where: { id },
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
