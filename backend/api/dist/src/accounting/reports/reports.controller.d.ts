import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getGrandLivre(fiscalYearId: string, req: any, accountNumber?: string, journalCode?: string, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<{
        account: any;
        movements: any[];
        totalDebit: number;
        totalCredit: number;
        balance: number;
    }[]>;
    getBalance(fiscalYearId: string, req: any, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<{
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
    getJournalCentralisateur(fiscalYearId: string, req: any, journalCode?: string, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<{
        journal: any;
        entries: any[];
        totalDebit: number;
        totalCredit: number;
    }[]>;
    getSyscohadaStatements(fiscalYearId: string, req: any, subsidiaryId?: string): Promise<{
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
