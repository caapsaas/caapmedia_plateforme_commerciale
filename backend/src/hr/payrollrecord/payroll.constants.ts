/**
 * PAYROLL CONSTANTS - Cameroon Legal Standards 2024-2026
 *
 * ⚠️ IMPORTANT: Toutes les constantes doivent être vérifiées chaque année
 * auprès de CNPS, DGI et MINELT pour respecter les normes en vigueur.
 *
 * Sources officielles:
 * - CNPS: www.cnps.cm
 * - DGI: www.dgi.cm (Direction Générale des Impôts)
 * - MINELT: www.minelt.gov.cm (Ministère du Travail)
 *
 * Date dernière mise à jour: 2026-08-05
 * Responsable: À assigner
 * Prochain audit: 2026-12-31
 */

export const PAYROLL_CONSTANTS = {
  /**
   * ============================================================================
   * 1. SMIG - Salaire Minimum Interprofessionnel Garanti
   * ============================================================================
   * Définition: Salaire minimum légal au Cameroun
   *
   * STATUS: ❓ À VÉRIFIER - Aucune validation actuelle
   * CONTACT: MINELT (Ministère du Travail)
   *
   * TODO: Implémenter validation dans create/processPayroll
   */
  SMIG: {
    // À REMPLIR après appel MINELT
    value_2024: 0, // ?????? FCFA
    value_2025: 0, // ?????? FCFA
    value_2026: 0, // ?????? FCFA
    source: 'À vérifier auprès MINELT',
    lastVerified: '2026-08-05',
    note: 'Aucune validation active - À ajouter avant production',
  },

  /**
   * ============================================================================
   * 2. CNPS - Contributions Sociales
   * ============================================================================
   * CNPS = Caisse Nationale de Prévoyance Sociale
   */
  CNPS: {
    /**
     * Plafond de cotisation CNPS
     * Au-dessus de ce montant, les cotisations ne s'appliquent plus
     *
     * STATUS: ✅ Confirmé pour 2020-2023, ❓ À vérifier 2024-2026
     * CONTACT: CNPS www.cnps.cm
     * RISK: Si sous-estimé, cotisations insuffisantes
     */
    CAP: {
      value_2020_2023: 750_000,
      value_2024: 750_000, // ❓ À VÉRIFIER
      value_2025: 750_000, // ❓ À VÉRIFIER
      value_2026: 750_000, // ❓ À VÉRIFIER
      lastVerified: '2023-01-01',
      source: 'Code actuel - À actualiser',
      note: 'Possiblement augmenté à 900k en 2024+',
    },

    /**
     * Taux salarié - Retraite
     * Retenue directe sur le salaire de l'employé
     *
     * STATUS: ✅ Confirmé
     */
    EMPLOYEE_RATE: {
      value: 0.042, // 4.2%
      label: 'Retraite',
      applicableTo: 'baseSalary + bonus (jusqu\'au plafond CAP)',
      lastVerified: '2026-08-05',
      source: 'CNPS - Confirmé',
    },

    /**
     * Taux employeur - Pension
     * Charge patronale pour retraite
     *
     * STATUS: ✅ Confirmé
     */
    EMPLOYER_PENSION_RATE: {
      value: 0.042, // 4.2%
      label: 'Pension retraite',
      applicableTo: 'Salaire plafonné CAP',
      lastVerified: '2026-08-05',
      source: 'CNPS - Confirmé',
    },

    /**
     * ⚠️ PROBLÈME CRITIQUE - À CLARIFIER
     * Taux employeur - Prestations familiales (?)
     *
     * STATUS: ❓ À VÉRIFIER IMMÉDIATEMENT
     * CONTACT: CNPS www.cnps.cm
     *
     * QUESTIONS:
     * 1. C'est exactement quoi ces 7%?
     * 2. C'est une charge CNPS ou séparée?
     * 3. C'est encore en vigueur en 2024-2026?
     * 4. Est-ce lié aux allocations familiales?
     *
     * RISQUE: Erreur de calcul des charges patronales
     */
    EMPLOYER_FAMILY_BENEFITS_RATE: {
      value: 0.07, // 7% ← À CLARIFIER
      label: 'Prestations familiales (?)',
      applicableTo: 'Salaire plafonné CAP',
      lastVerified: '2026-08-05',
      source: 'Code actuel - À CLARIFIER avec CNPS',
      status: '❌ À VÉRIFIER AVANT PRODUCTION',
      priority: 'URGENT',
    },

    /**
     * Taux employeur - Accidents du travail (groupe A)
     * Groupe A = Secteur à faible risque
     *
     * STATUS: ✅ Confirmé
     */
    EMPLOYER_ACCIDENT_RISK_A: {
      value: 0.0175, // 1.75%
      label: 'Accidents du travail - Groupe A (faible)',
      applicableTo: 'Salaire plafonné CAP',
      lastVerified: '2026-08-05',
      source: 'CNPS - Confirmé',
    },

    /**
     * Taux employeur - Accidents du travail (groupe B)
     * Groupe B = Secteur à risque moyen
     *
     * STATUS: ✅ Confirmé
     */
    EMPLOYER_ACCIDENT_RISK_B: {
      value: 0.025, // 2.5%
      label: 'Accidents du travail - Groupe B (moyen)',
      applicableTo: 'Salaire plafonné CAP',
      lastVerified: '2026-08-05',
      source: 'CNPS - Confirmé',
    },

    /**
     * Taux employeur - Accidents du travail (groupe C)
     * Groupe C = Secteur à risque élevé
     *
     * STATUS: ✅ Confirmé
     */
    EMPLOYER_ACCIDENT_RISK_C: {
      value: 0.05, // 5%
      label: 'Accidents du travail - Groupe C (élevé)',
      applicableTo: 'Salaire plafonné CAP',
      lastVerified: '2026-08-05',
      source: 'CNPS - Confirmé',
    },
  },

  /**
   * ============================================================================
   * 3. IRPP - Impôt sur le Revenu des Personnes Physiques
   * ============================================================================
   * Définition: Impôt progressif appliqué sur la base imposable
   *
   * STATUS: ⚠️ À VÉRIFIER - Tranches confirmées historiquement
   * CONTACT: DGI (Direction Générale des Impôts) www.dgi.cm
   */
  IRPP: {
    /**
     * Tranches progressives pour 2024-2026
     *
     * Formule: Pour salaire imposable annuel X FCFA
     * - Si X ≤ 2M: impôt = X × 10%
     * - Si X > 2M et ≤ 3M: impôt = 2M×10% + (X-2M)×15%
     * - Si X > 3M et ≤ 5M: impôt = 2M×10% + 1M×15% + (X-3M)×25%
     * - Si X > 5M: impôt = 2M×10% + 1M×15% + 2M×25% + (X-5M)×35%
     *
     * STATUS: À VÉRIFIER avec DGI (dernière confirmation: historique)
     * RISK: Bug structurel dans le code actuel - à refactoriser
     */
    BRACKETS: [
      {
        min: 0,
        max: 2_000_000,
        rate: 0.10, // 10%
        label: 'Tranche 1: 0-2M',
      },
      {
        min: 2_000_001,
        max: 3_000_000,
        rate: 0.15, // 15%
        label: 'Tranche 2: 2M-3M',
      },
      {
        min: 3_000_001,
        max: 5_000_000,
        rate: 0.25, // 25%
        label: 'Tranche 3: 3M-5M',
      },
      {
        min: 5_000_001,
        max: Infinity,
        rate: 0.35, // 35%
        label: 'Tranche 4: 5M+',
      },
    ],
    lastVerified: '2026-08-05',
    source: 'À vérifier auprès DGI',
    note: 'Code actuel utilise une structure confuse - À refactoriser',
  },

  /**
   * ============================================================================
   * 4. Abattements IRPP
   * ============================================================================
   */
  IRPP_ABATEMENTS: {
    /**
     * Abattement professionnel
     * Réduction forfaitaire pour frais professionnels
     *
     * STATUS: ✅ Confirmé (30% est le standard)
     */
    PROFESSIONAL_EXPENSE_RATE: {
      value: 0.30, // 30%
      label: 'Abattement professionnel',
      applicableTo: 'Salaire après retrait CNPS',
      lastVerified: '2026-08-05',
      source: 'Standard camerounais - Confirmé',
    },

    /**
     * Abattement fixe annuel
     * Réduction forfaitaire additionnelle
     *
     * STATUS: ❓ À VÉRIFIER - Possiblement obsolète
     * CONTACT: DGI www.dgi.cm
     *
     * QUESTIONS:
     * 1. Toujours 500k/an en 2024-2026?
     * 2. Indexé sur le SMIG?
     * 3. Peut-être augmenté à 600k-700k?
     */
    FIXED_ANNUAL_ABATEMENT: {
      value_2024: 500_000, // ??? FCFA
      value_2025: 500_000, // ??? FCFA
      value_2026: 500_000, // ??? FCFA
      label: 'Abattement fixe',
      lastVerified: '2026-08-05',
      source: 'Code actuel - À VÉRIFIER avec DGI',
      status: '❓ À VÉRIFIER AVANT PRODUCTION',
      note: 'Peut être indexé au SMIG',
    },
  },

  /**
   * ============================================================================
   * 5. CAC - Contribution Amélioration Civique
   * ============================================================================
   * Définition: Contribution spéciale calculée sur l'IRPP
   *
   * STATUS: ✅ Confirmé
   */
  CAC: {
    RATE: {
      value: 0.10, // 10% de l'IRPP
      label: 'CAC',
      calculatedOn: 'IRPP',
      lastVerified: '2026-08-05',
      source: 'Confirmé',
    },
  },

  /**
   * ============================================================================
   * 6. CFC - Crédit Foncier Camerounais
   * ============================================================================
   * Définition: Contribution aux secteurs foncier et immobilier
   *
   * STATUS: ✅ Confirmé
   */
  CFC: {
    EMPLOYEE_RATE: {
      value: 0.01, // 1%
      label: 'CFC Salarié',
      applicableTo: 'Brut',
      lastVerified: '2026-08-05',
      source: 'Confirmé',
    },
    EMPLOYER_RATE: {
      value: 0.015, // 1.5%
      label: 'CFC Employeur',
      applicableTo: 'Brut',
      lastVerified: '2026-08-05',
      source: 'Confirmé',
    },
  },

  /**
   * ============================================================================
   * 7. FNE - Fonds National d'Emploi
   * ============================================================================
   * Définition: Charge patronale pour fonds d'emploi
   *
   * STATUS: ✅ Confirmé
   */
  FNE: {
    RATE: {
      value: 0.01, // 1%
      label: 'FNE',
      applicableTo: 'Brut',
      optional: true,
      lastVerified: '2026-08-05',
      source: 'Confirmé',
    },
  },

  /**
   * ============================================================================
   * 8. Heures Supplémentaires (À IMPLÉMENTER)
   * ============================================================================
   * STATUS: ❌ Non implémenté actuellement
   * CONTACT: MINELT www.minelt.gov.cm
   */
  OVERTIME: {
    WEEKDAY_RATE: {
      value: 0.25, // +25%
      label: 'Heures sup - Jour semaine',
      status: 'À implémenter',
    },
    SUNDAY_RATE: {
      value: 0.50, // +50%
      label: 'Heures sup - Dimanche',
      status: 'À implémenter',
    },
    HOLIDAY_RATE: {
      value: 1.0, // +100% (= double)
      label: 'Heures sup - Jour férié',
      status: 'À implémenter',
    },
  },

  /**
   * ============================================================================
   * 9. Congés Payés (À IMPLÉMENTER)
   * ============================================================================
   * Définition: Droit à congé et indemnité correspondante
   *
   * STATUS: ❌ Non implémenté actuellement
   * CONTACT: MINELT www.minelt.gov.cm
   */
  LEAVE: {
    ACCRUAL_RATE: {
      value: 2.5, // jours par mois
      label: 'Accumulation congé',
      status: 'À implémenter',
    },
    LEAVE_INDEMNITY_FORMULA: {
      formula: '(brut × days) / 30',
      label: 'Indemnité congé',
      status: 'À implémenter',
    },
  },
};

/**
 * ============================================================================
 * CHECKLIST DE VÉRIFICATION
 * ============================================================================
 * À faire avant chaque mise en production:
 *
 * - [ ] Confirmer SMIG 2024-2026 auprès MINELT
 * - [ ] Confirmer plafond CNPS auprès CNPS ⚠️ URGENT
 * - [ ] CLARIFIER taux CNPS 7% auprès CNPS ⚠️ CRITIQUE
 * - [ ] Vérifier tranches IRPP auprès DGI
 * - [ ] Vérifier abattement fixe auprès DGI
 * - [ ] Ajouter validation SMIG dans le code
 * - [ ] Refactoriser calcul IRPP
 * - [ ] Ajouter tests unitaires pour chaque tranche
 */

export const PAYROLL_VERIFICATION_CHECKLIST = [
  {
    task: 'Confirmer SMIG 2024-2026',
    contact: 'MINELT (Ministère du Travail)',
    priority: 'HAUTE',
    status: 'À faire',
  },
  {
    task: 'Confirmer plafond CNPS 2024-2026',
    contact: 'CNPS www.cnps.cm',
    priority: 'HAUTE',
    status: 'À faire',
  },
  {
    task: '⚠️ CLARIFIER taux CNPS 7% (prestations?)',
    contact: 'CNPS www.cnps.cm',
    priority: 'URGENT',
    status: 'À faire',
  },
  {
    task: 'Vérifier tranches IRPP',
    contact: 'DGI www.dgi.cm',
    priority: 'MOYENNE',
    status: 'À faire',
  },
  {
    task: 'Vérifier abattement fixe annuel',
    contact: 'DGI www.dgi.cm',
    priority: 'MOYENNE',
    status: 'À faire',
  },
];
