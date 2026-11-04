import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { AccountingBalanceService } from '../shared/accounting-balance.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly balanceService;
    constructor(prisma: PrismaService, balanceService: AccountingBalanceService);
    private resolveFiscalYearPeriod;
    private resolveDateRange;
    getGrandLivre(user: JwtUser, fiscalYearId: string, accountNumber?: string, journalCode?: string, subsidiaryIdFilter?: string, startDateFilter?: string, endDateFilter?: string): Promise<{
        account: any;
        movements: any[];
        totalDebit: number;
        totalCredit: number;
        balance: number;
    }[]>;
    getBalanceGenerale(user: JwtUser, fiscalYearId: string, subsidiaryIdFilter?: string, startDateFilter?: string, endDateFilter?: string): Promise<{
        balance: {
            soldeDebiteur: number;
            soldeCrediteur: number;
            accountNumber: string;
            accountName: string;
            accountType: string;
            mouvDebit: number;
            mouvCredit: number;
        }[];
        totaux: {
            totalMouvDebit: number;
            totalMouvCredit: number;
            totalSoldeDebiteur: number;
            totalSoldeCrediteur: number;
        };
    }>;
    getJournalCentralisateur(user: JwtUser, fiscalYearId: string, journalCode?: string, subsidiaryIdFilter?: string, startDateFilter?: string, endDateFilter?: string): Promise<{
        journal: any;
        entries: any[];
        totalDebit: number;
        totalCredit: number;
    }[]>;
    getSyscohadaStatements(user: JwtUser, fiscalYearId: string, subsidiaryIdFilter?: string): Promise<{
        bilan: {
            actif: {
                immobilisationsNettes: number;
                stocks: number;
                creancesClients: number;
                tvaDeductible: number;
                tresorerie: number;
            };
            passif: {
                capitalSocial: number;
                reserves: number;
                resultatExercice: number;
                dettesLongTerme: number;
                dettesFournisseurs: number;
                tvaCollectee: number;
                autresDettes: number;
            };
        };
        comptResultat: {
            totalProduits: number;
            totalCharges: number;
            resultatNet: number;
            margeCommerciale: number;
            ebe: number;
            produits: {
                ventesMarchandises: number;
                prestationsServices: number;
                autresProduits: number;
            };
            charges: {
                achatsMarchandises: number;
                chargesExternes: number;
                chargesPersonnel: number;
                dotationsAmort: number;
                chargesFinancieres: number;
                autresCharges: number;
                is: number;
            };
        };
    }>;
}
