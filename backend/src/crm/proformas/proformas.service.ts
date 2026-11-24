import { rm } from 'node:fs/promises';
import { ProductSpecsService } from '../../ecommerce/products/product-specs/product-specs.service';
import { ConvertProformaDto } from './dto/convert-proforma.dto';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  SpecFieldType,
} from '@prisma/client';
import { addDays } from 'date-fns';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/pagination/pagination';
import type { Proforma, Prisma } from '@prisma/client';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { isSuperAdmin } from '../../common/auth/role/role-identity';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';

const pendingDecision: ProformaStatus[] = [
  ProformaStatus.SENT,
  ProformaStatus.VIEWED,
];

const creatorSelect = {
  id: true,
  userName: true,
  email: true,
  subsidiaryId: true,
} satisfies Prisma.UserSelect;
@Injectable()
export class ProformasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderNotifications: OrderNotificationsService,
    private readonly productSpecs: ProductSpecsService,
  ) {}

  async create(createProformaDto: CreateProformaDto, user: JwtUser) {
    if (isSuperAdmin(user)) {
      throw new ForbiddenException(
        'Le super-administrateur ne peut pas créer de proforma.',
      );
    }
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
    await this.expirePending(where);
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
          subsidiary: {
            select: {
              subsidiaryName: true,
              address: true,
              phone: true,
              email: true,
              ifu: true,
              rccm: true,
              bankName: true,
              accountNumber: true,
            },
          },
          order: { select: { salesRepId: true } },
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
    await this.expirePending(scope);
    const [all, draft, sent, viewed, accepted, rejected, expired, converted] =
      await Promise.all([
        this.prisma.proforma.count({ where: scope }),
        ...[
          ProformaStatus.DRAFT,
          ProformaStatus.SENT,
          ProformaStatus.VIEWED,
          ProformaStatus.ACCEPTED,
          ProformaStatus.REJECTED,
          ProformaStatus.EXPIRED,
          ProformaStatus.CONVERTED,
        ].map((status) =>
          this.prisma.proforma.count({ where: { ...scope, status } }),
        ),
      ]);

    return { all, draft, sent, viewed, accepted, rejected, expired, converted };
  }

  private expirePending(scope: Prisma.ProformaWhereInput) {
    return this.prisma.proforma.updateMany({
      where: {
        ...scope,
        status: { in: pendingDecision },
        validityDate: { lte: new Date() },
      },
      data: { status: ProformaStatus.EXPIRED },
    });
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

    if (
      pendingDecision.includes(proforma.status) &&
      proforma.validityDate <= new Date()
    ) {
      return { ...proforma, status: ProformaStatus.EXPIRED };
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

    if (
      proforma.status !== ProformaStatus.DRAFT ||
      proforma.validityDate <= new Date()
    ) {
      throw new BadRequestException(
        'Seuls les brouillons en cours de validité peuvent être envoyés.',
      );
    }

    return this.prisma.proforma.update({
      where: withSubsidiaryScope(
        { id, status: proforma.status, validityDate: { gt: new Date() } },
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
          { id, status: proforma.status, validityDate: { gt: new Date() } },
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

  async accept(id: string, user: JwtUser) {
    const proforma = await this.findOne(id, user);

    if (!pendingDecision.includes(proforma.status)) {
      throw new BadRequestException(
        'Seules les proformas envoyées ou consultées et en cours de validité peuvent être acceptées.',
      );
    }

    return this.prisma.proforma.update({
      where: withSubsidiaryScope(
        {
          id,
          status: { in: pendingDecision },
          validityDate: { gt: new Date() },
        },
        resolveScopeContext(user),
      ),
      data: { status: ProformaStatus.ACCEPTED, acceptedAt: new Date() },
    });
  }

  async convert(
    id: string,
    user: JwtUser,
    dto: ConvertProformaDto,
    files: Express.Multer.File[] = [],
  ) {
    const proforma = await this.findOne(id, user);

    if (proforma.status === ProformaStatus.CONVERTED && proforma.orderId) {
      await Promise.all(files.map((file) => rm(file.path, { force: true })));
      return proforma;
    }

    if (proforma.status !== ProformaStatus.ACCEPTED) {
      throw new BadRequestException(
        'Seules les proformas acceptées peuvent être converties en commande.',
      );
    }

    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Africa/Douala',
    });
    if (dto.paymentDueDate < today) {
      throw new BadRequestException(
        'L’échéance de paiement doit être aujourd’hui ou à une date ultérieure.',
      );
    }

    const inputs = new Map((dto.items ?? []).map((item) => [item.id, item]));
    const fileIndices = (dto.items ?? []).flatMap((item) =>
      item.designFileIndex === undefined ? [] : [item.designFileIndex],
    );
    const proformaItemIds = new Set(proforma.items.map((item) => item.id));
    if (
      inputs.size !== (dto.items?.length ?? 0) ||
      [...inputs.keys()].some((itemId) => !proformaItemIds.has(itemId)) ||
      fileIndices.length !== files.length ||
      new Set(fileIndices).size !== files.length ||
      fileIndices.some(
        (index) =>
          !files[index]?.filename.startsWith(`${proforma.subsidiaryId}/`),
      )
    ) {
      throw new BadRequestException(
        'Les articles ou fichiers de conversion ne correspondent pas à la proforma.',
      );
    }

    const definitions = new Map(
      await Promise.all(
        [...new Set(proforma.items.map((item) => item.productId))].map(
          async (productId) =>
            [
              productId,
              await this.productSpecs.getFormDefinition(productId),
            ] as const,
        ),
      ),
    );
    const orderItems = proforma.items.map((item) => {
      const input = inputs.get(item.id);
      const definition = definitions.get(item.productId)!;
      this.productSpecs.validateAgainstDefinition(
        definition,
        input?.specValues,
      );
      const file =
        input?.designFileIndex === undefined
          ? undefined
          : files[input.designFileIndex];
      const fields = [
        ...definition.ungroupedSpecifications,
        ...definition.groups.flatMap((group) => group.specifications),
      ];
      if (
        !file &&
        fields.some(
          (field) => field.type === SpecFieldType.UPLOAD && field.required,
        )
      ) {
        throw new BadRequestException(
          `Un fichier de production est requis pour « ${item.product.name} ».`,
        );
      }
      return {
        id: generateId(ID_PREFIXES.ORDERITEM),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice.mul(item.quantity),
        specValues: input?.specValues as Prisma.InputJsonObject | undefined,
        specSnapshot: definition as unknown as Prisma.InputJsonObject,
        designFileName: file?.originalname,
        designFileUrl: file
          ? `/public/order_item_img/${file.filename}`
          : undefined,
      };
    });

    const scope = resolveScopeContext(user);
    const { result, order } = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.proforma.updateMany({
        where: withSubsidiaryScope(
          { id, status: ProformaStatus.ACCEPTED, orderId: null },
          scope,
        ),
        data: { status: ProformaStatus.CONVERTED },
      });
      if (claimed.count !== 1) {
        const existing = await tx.proforma.findUnique({
          where: withSubsidiaryScope({ id }, scope),
        });
        if (existing?.status === ProformaStatus.CONVERTED && existing.orderId) {
          return { result: existing, order: null };
        }
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
          salesRepId:
            proforma.createdByUser?.subsidiaryId === proforma.subsidiaryId
              ? proforma.createdBy
              : null,
          subsidiaryId: proforma.subsidiaryId,
          opportunityId: proforma.opportunityId,
          subtotal: proforma.subtotal,
          taxAmount: proforma.taxAmount,
          totalAmount: proforma.totalAmount,
          taxRateValue: proforma.taxRate,
          taxRateId: defaultTaxRate.id,
          applyTax: proforma.taxAmount.greaterThan(0),
          paymentDueDate: new Date(dto.paymentDueDate),
          status: OrderStatus.PENDING_VALIDATION,
          productionStatus: ProductionStatus.PREPRESS,
          paymentStatus: PaymentStatus.UNPAID,
          source: OrderSource.QUOTE_REQUEST,
          productionHistory: {
            create: {
              id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY),
              status: ProductionStatus.PREPRESS,
            },
          },
          orderItems: { create: orderItems },
        },
      });

      const updatedProforma = await tx.proforma.update({
        where: withSubsidiaryScope({ id }, scope),
        data: { orderId: order.id },
        include: {
          items: { include: { product: true } },
        },
      });

      return { result: updatedProforma, order };
    });
    if (order) {
      await this.orderNotifications.created(order);
    } else {
      await Promise.all(files.map((file) => rm(file.path, { force: true })));
    }
    return result;
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
        {
          id,
          status: { in: pendingDecision },
          validityDate: { gt: new Date() },
        },
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
    // Les prix des lignes d'une proforma sont TTC : la TVA est comprise dans
    // le montant saisi, elle ne s'ajoute pas au total demandé au client.
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const roundedTotal = Math.round(totalAmount * 100) / 100;
    const taxAmount =
      Math.round(((roundedTotal * taxRate) / (100 + taxRate)) * 100) / 100;
    const subtotal = roundedTotal - taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount: roundedTotal,
    };
  }
}
