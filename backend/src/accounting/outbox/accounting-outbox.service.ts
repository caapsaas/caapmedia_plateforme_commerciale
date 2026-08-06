import { Injectable } from '@nestjs/common';
import { AccountType, ExpenseCategory, Prisma } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Types d'événements qu'on peut enqueuer dans l'Outbox
export type OutboxEventType =
  // Paie
  | 'PAYROLL_ENTRY'
  | 'BONUS_ENTRY'
  | 'CHARGE_PAYMENT_ENTRY'
  // Trésorerie
  | 'TREASURY_INCOME'
  | 'TREASURY_EXPENSE'
  | 'TREASURY_TRANSFER'
  // Ventes
  | 'SALE_PAID'
  // Dépenses
  | 'EXPENSE_RECORD'
  // Tiers
  | 'SUPPLIER_DEBT_PAYMENT'
  // Financement
  | 'LONG_TERM_DEBT_RECEIPT'
  // Immobilisations
  | 'FIXED_ASSET_ACQUISITION'
  | 'PAYROLL_CHARGE_PAYMENT';

/** Payload sérialisable d'un `JournalizationContext` — `operationDate` en ISO
 * string car `Json` Prisma ne préserve pas le type `Date`. */
export interface AccountingOutboxPayload {
  userId: string;
  operationDate: string;
  amount: number;
  description: string;
  sourceId: string;
  accountType?: AccountType;
  destinationAccountType?: AccountType;
  expenseCategory?: ExpenseCategory;
  withTva?: boolean;
}

export interface EnqueueAccountingEventDto {
  eventType: OutboxEventType;
  payload: AccountingOutboxPayload;
  subsidiaryId: string;
}

/**
 * Point d'entrée pour poser l'intention de journalisation comptable — pattern
 * Outbox transactionnel (voir Doc/module-comptabilite-plan-implementation.md §2.3) :
 * l'appelant DOIT passer le `tx` de sa PROPRE transaction Prisma pour que
 * l'écriture outbox soit atomique avec l'opération métier source (jamais perdue
 * même si le service comptable est indisponible au moment du commit).
 */
@Injectable()
export class AccountingOutboxService {
  async enqueue(
    tx: Prisma.TransactionClient,
    dto: EnqueueAccountingEventDto,
  ): Promise<void> {
    await tx.accountingOutboxEntry.create({
      data: {
        id: generateId(ID_PREFIXES.ACCOUNTINGOUTBOXENTRY),
        eventType: dto.eventType,
        payload: dto.payload as unknown as Prisma.InputJsonValue,
        subsidiaryId: dto.subsidiaryId,
      },
    });
  }
}
