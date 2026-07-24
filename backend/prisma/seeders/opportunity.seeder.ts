import { PrismaClient, OpportunityStage } from '@prisma/client';

const SEED_DATA = [
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        salesRepEmail: 'jean.commercial@caap.cm',
        account: { accountName: 'Dupont Entreprises', industry: 'BTP', phone: '699123456', address: 'Rue de la République, Douala' },
        contactEmail: 'marie.dupont@dupont-entreprises.com',
        opportunities: [
            { opportunityName: 'Fourniture matériaux chantier Nord', opportunityValue: 4500000, stage: OpportunityStage.WON, closeDate: '2026-03-15' },
            { opportunityName: 'Contrat maintenance équipements', opportunityValue: 1800000, stage: OpportunityStage.NEGOTIATION, closeDate: '2026-08-30' },
        ],
    },
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        salesRepEmail: 'jean.commercial@caap.cm',
        account: { accountName: 'MBARGA Trading', industry: 'Commerce', phone: '677987654', address: 'Bonapriso, Douala' },
        contactEmail: 'jp.mbarga@mbarga-trading.com',
        opportunities: [
            { opportunityName: 'Approvisionnement stock Q3', opportunityValue: 2200000, stage: OpportunityStage.PROPOSAL, closeDate: '2026-07-20' },
            { opportunityName: 'Distribution produits finis', opportunityValue: 3100000, stage: OpportunityStage.QUALIFICATION, closeDate: '2026-09-10' },
        ],
    },
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        salesRepEmail: 'jean.commercial@caap.cm',
        account: { accountName: 'Foko Construction', industry: 'BTP', phone: '698321654', address: 'Makepé, Douala' },
        contactEmail: 'roger.foko@foko-construction.cm',
        opportunities: [
            { opportunityName: 'Fourniture ciment et ferraille', opportunityValue: 6700000, stage: OpportunityStage.NEGOTIATION, closeDate: '2026-07-31' },
            { opportunityName: 'Contrat annuel matériaux', opportunityValue: 12000000, stage: OpportunityStage.QUALIFICATION, closeDate: '2026-10-01' },
        ],
    },
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        salesRepEmail: 'jean.commercial@caap.cm',
        account: { accountName: 'Kamga Technologies', industry: 'Tech', phone: '691234567', address: 'Akwa, Douala' },
        contactEmail: 'michel.kamga@kamga-tech.com',
        opportunities: [
            { opportunityName: 'Déploiement logiciel ERP', opportunityValue: 5500000, stage: OpportunityStage.LOST, closeDate: '2026-04-30' },
            { opportunityName: 'Maintenance annuelle système', opportunityValue: 1200000, stage: OpportunityStage.PROPOSAL, closeDate: '2026-08-15' },
        ],
    },
    {
        subsidiaryEmail: 'contact.kribi@caap.cm',
        salesRepEmail: 'commercial.kribi@caap.cm',
        account: { accountName: 'Sokamte Sarl', industry: 'Commerce', phone: '655443322', address: 'Centre-ville, Kribi' },
        contactEmail: 'frank.sokamte@example.com',
        opportunities: [
            { opportunityName: 'Contrat distribution côte', opportunityValue: 3800000, stage: OpportunityStage.WON, closeDate: '2026-02-28' },
            { opportunityName: 'Partenariat logistique port', opportunityValue: 7200000, stage: OpportunityStage.PROPOSAL, closeDate: '2026-09-30' },
        ],
    },
    {
        subsidiaryEmail: 'contact.kribi@caap.cm',
        salesRepEmail: 'commercial.kribi@caap.cm',
        account: { accountName: 'Catherine Fashion', industry: 'Textile', phone: '676789012', address: 'Plage de Kribi, Kribi' },
        contactEmail: 'catherine.ngueguim@fashion.cm',
        opportunities: [
            { opportunityName: 'Fourniture matières premières', opportunityValue: 950000, stage: OpportunityStage.QUALIFICATION, closeDate: '2026-08-20' },
        ],
    },
    {
        subsidiaryEmail: 'contact.edea@caap.cm',
        salesRepEmail: 'commercial.edea@caap.cm',
        account: { accountName: 'Sophie Beauty Salon', industry: 'Beauté', phone: '655456789', address: 'Centre-ville, Edéa' },
        contactEmail: 'sophie.tchoupe@beauty-salon.cm',
        opportunities: [
            { opportunityName: 'Approvisionnement produits beauté', opportunityValue: 680000, stage: OpportunityStage.NEGOTIATION, closeDate: '2026-07-25' },
            { opportunityName: 'Extension points de vente', opportunityValue: 2400000, stage: OpportunityStage.QUALIFICATION, closeDate: '2026-10-15' },
        ],
    },
    {
        subsidiaryEmail: 'contact.edea@caap.cm',
        salesRepEmail: 'commercial.edea@caap.cm',
        account: { accountName: 'Esther Restaurant', industry: 'Restauration', phone: '678901234', address: 'Zone Industrielle, Edéa' },
        contactEmail: 'esther.etoundi@restaurant.cm',
        opportunities: [
            { opportunityName: 'Contrat fourniture alimentaire', opportunityValue: 1500000, stage: OpportunityStage.WON, closeDate: '2026-01-31' },
        ],
    },
];

export async function runOpportunitySeeder(prisma: PrismaClient) {
    let seeded = 0;
    let skipped = 0;

    for (const entry of SEED_DATA) {
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: entry.subsidiaryEmail },
        });
        if (!subsidiary) {
            console.warn(`[opportunity.seeder] Subsidiary ${entry.subsidiaryEmail} not found, skipping`);
            skipped++;
            continue;
        }

        const salesRep = await prisma.user.findFirst({
            where: { email: entry.salesRepEmail },
        });
        if (!salesRep) {
            console.warn(`[opportunity.seeder] Sales rep ${entry.salesRepEmail} not found, skipping`);
            skipped++;
            continue;
        }

        // Find or create the CRM account (no unique constraint on accountName)
        let account = await prisma.account.findFirst({
            where: { accountName: entry.account.accountName, subsidiaryId: subsidiary.id },
        });
        if (!account) {
            account = await prisma.account.create({
                data: {
                    accountName: entry.account.accountName,
                    industry: entry.account.industry,
                    phone: entry.account.phone,
                    address: entry.account.address,
                    subsidiaryId: subsidiary.id,
                    salesRepId: salesRep.id,
                },
            });
        }

        const contact = await prisma.contact.findFirst({
            where: { email: entry.contactEmail },
        });
        if (!contact) {
            console.warn(`[opportunity.seeder] Contact ${entry.contactEmail} not found, skipping`);
            skipped++;
            continue;
        }

        for (const opp of entry.opportunities) {
            const existing = await prisma.opportunity.findFirst({
                where: {
                    opportunityName: opp.opportunityName,
                    contactId: contact.id,
                },
            });
            if (existing) {
                skipped++;
                continue;
            }
            await prisma.opportunity.create({
                data: {
                    opportunityName: opp.opportunityName,
                    opportunityValue: opp.opportunityValue,
                    stage: opp.stage,
                    closeDate: new Date(opp.closeDate),
                    contactId: contact.id,
                    accountId: account.id,
                    userId: salesRep.id,
                    subsidiaryId: subsidiary.id,
                },
            });
            seeded++;
        }
    }

    console.log(`Opportunities seeded: ${seeded} created, ${skipped} skipped`);
}
