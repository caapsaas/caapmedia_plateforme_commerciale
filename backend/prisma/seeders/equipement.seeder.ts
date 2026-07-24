import { PrismaClient } from '@prisma/client';
import { EquipmentStatus } from '@prisma/client';


export async function runEquipmentSeeder(prisma: PrismaClient) {

    const equipmentsData = [
        // ── Douala ────────────────────────────────────────────────────────────
        {
            name: 'MO-Heldelberg 2 Tetes',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-05-15',
            nextMaintenanceDate: '2024-11-15',
            acquisitionDate: '2020-01-15',
            acquisitionValue: 25000000,
            subsidiaryEmail: 'contact.douala@caap.cm',
            hourlyRate: 5000,
            maintenanceHistory: [
                { date: '2024-05-15', technician: 'Service Interne', description: 'Maintenance préventive semestrielle.', cost: 150000 },
                { date: '2023-11-10', technician: 'Heidelberg Tech', description: 'Changement des rouleaux.', cost: 800000 },
            ],
        },
        {
            name: 'GTO Heidelberg',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-06-01',
            nextMaintenanceDate: '2024-12-01',
            acquisitionDate: '2018-03-20',
            acquisitionValue: 15000000,
            subsidiaryEmail: 'contact.douala@caap.cm',
            hourlyRate: 3000,
            maintenanceHistory: [
                { date: '2024-06-01', technician: 'Service Interne', description: 'Graissage et nettoyage.', cost: 50000 },
            ],
        },
        {
            name: 'Mastico',
            status: EquipmentStatus.NEEDS_MAINTENANCE,
            lastMaintenanceDate: '2023-12-20',
            nextMaintenanceDate: '2024-06-20',
            acquisitionDate: '2019-07-01',
            acquisitionValue: 5000000,
            subsidiaryEmail: 'contact.douala@caap.cm',
            hourlyRate: 1200,
            maintenanceHistory: [],
        },
        {
            name: 'Insoleuse',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-07-01',
            nextMaintenanceDate: '2025-01-01',
            maintenanceHistory: [
                { date: '2024-07-01', technician: 'Service Interne', description: 'Changement de la lampe UV.', cost: 75000 },
            ],
            subsidiaryEmail: 'contact.douala@caap.cm',
            acquisitionDate: '2021-02-10',
            acquisitionValue: 1200000,
            hourlyRate: 1500,
        },
        {
            name: 'Rolande RX 640',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-04-10',
            nextMaintenanceDate: '2024-10-10',
            maintenanceHistory: [],
            subsidiaryEmail: 'contact.douala@caap.cm',
            acquisitionDate: '2022-08-05',
            acquisitionValue: 8500000,
            hourlyRate: 2500,
        },
        {
            name: 'DGF-Epson I3200',
            status: EquipmentStatus.OUT_OF_SERVICE,
            lastMaintenanceDate: '2024-02-01',
            nextMaintenanceDate: '2024-08-01',
            maintenanceHistory: [
                { date: '2024-07-10', technician: 'Externe', description: 'Diagnostique panne tête d\'impression.', cost: 120000 },
            ],
            subsidiaryEmail: 'contact.douala@caap.cm',
            acquisitionDate: '2023-01-20',
            acquisitionValue: 4000000,
            hourlyRate: null,
        },
        // ── Siège (Yaoundé) ───────────────────────────────────────────────────
        {
            name: 'Presse Numérique Xerox',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-09-01',
            nextMaintenanceDate: '2025-03-01',
            acquisitionDate: '2022-05-10',
            acquisitionValue: 18000000,
            subsidiaryEmail: 'contact.siege@caap.cm',
            hourlyRate: 4000,
            maintenanceHistory: [],
        },
        {
            name: 'Massicot Polar',
            status: EquipmentStatus.OPERATIONAL,
            lastMaintenanceDate: '2024-08-15',
            nextMaintenanceDate: '2025-02-15',
            acquisitionDate: '2021-11-20',
            acquisitionValue: 6000000,
            subsidiaryEmail: 'contact.siege@caap.cm',
            hourlyRate: 2000,
            maintenanceHistory: [],
        },
    ];


    for (const e of equipmentsData) {
        // Récupérer la filiale par email
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: e.subsidiaryEmail },
        });

        if (!subsidiary) {
            console.warn(`Subsidiary ${e.subsidiaryEmail} not found for equipment ${e.name}`);
            continue;
        }

        // Vérifier si l'équipement existe déjà
        const existingEquipment = await prisma.equipment.findFirst({
            where: {
                equipmentName: e.name,
                subsidiaryId: subsidiary.id, // pour éviter les doublons par filiale
            },
        });

        let equipment;
        if (existingEquipment) {
            equipment = await prisma.equipment.update({
                where: { id: existingEquipment.id },
                data: {
                    status: e.status,
                    lastMaintenanceDate: new Date(e.lastMaintenanceDate),
                    nextMaintenanceDate: new Date(e.nextMaintenanceDate),
                    acquisitionDate: new Date(e.acquisitionDate),
                    acquisitionValue: e.acquisitionValue,
                    subsidiaryId: subsidiary.id,
                },
            });
        } else {
            equipment = await prisma.equipment.create({
                data: {
                    equipmentName: e.name,
                    status: e.status,
                    lastMaintenanceDate: new Date(e.lastMaintenanceDate),
                    nextMaintenanceDate: new Date(e.nextMaintenanceDate),
                    acquisitionDate: new Date(e.acquisitionDate),
                    acquisitionValue: e.acquisitionValue,
                    subsidiaryId: subsidiary.id,
                },
            });
        }

        // Coût horaire (EquipementCostConfig) — idempotent via upsert
        if (e.hourlyRate !== null && e.hourlyRate !== undefined) {
            await prisma.equipementCostConfig.upsert({
                where: { equipmentId: equipment.id },
                create: { equipmentId: equipment.id, hourlyRate: e.hourlyRate },
                update: { hourlyRate: e.hourlyRate },
            });
        }

        // Historique de maintenance — idempotent
        for (const m of e.maintenanceHistory) {
            const existingRecord = await prisma.maintenanceRecord.findFirst({
                where: {
                    equipmentId: equipment.id,
                    maintenanceDate: new Date(m.date),
                    technician: m.technician,
                },
            });
            if (existingRecord) continue;
            await prisma.maintenanceRecord.create({
                data: {
                    maintenanceDate: new Date(m.date),
                    technician: m.technician,
                    description: m.description,
                    maintenanceCost: m.cost,
                    equipmentId: equipment.id,
                },
            });
        }
    }

    console.log('Equipment, CostConfigs & MaintenanceRecords seeded');
}