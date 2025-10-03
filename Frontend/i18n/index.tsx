import React, { createContext, useState, useContext, useCallback } from 'react';

// To bypass module resolution issues with JSON files in some environments,
// the translations are embedded directly into the code. This is a robust
// approach that guarantees the translations are always available.
const frTranslations = {
  "common": {
    "searchPlaceholder": "Rechercher produits, clients...",
    "logout": "Déconnexion",
    "add": "Ajouter",
    "edit": "Modifier",
    "delete": "Supprimer",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "loading": "Chargement...",
    "version": "Version",
    "actions": "Actions",
    "viewBL": "Voir le BL",
    "close": "Fermer",
    "confirmDelete": "Oui, supprimer",
    "confirm": "Confirmer",
    "view": "Détails",
    "print": "Imprimer",
    "export": "Exporter en CSV",
    "exportPdf": "Exporter en PDF"
  },
  "idleModal": {
    "title": "Vous êtes toujours là ?",
    "message": "Vous allez être déconnecté(e) pour inactivité dans {{countdown}} secondes.",
    "stayLoggedIn": "Rester connecté(e)",
    "logout": "Se déconnecter"
  },
   "payment": {
    "chooseMethod": "Choisissez votre mode de paiement",
    "creditCard": "Carte de crédit",
    "orangeMoney": "Orange Money",
    "wave": "Wave",
    "mtnMoney": "MTN Money",
    "paycaap": "Paycaap.com",
    "payOnDelivery": "Paiement à la réception",
    "customerCredit": "Paiement dans 30 jours (Crédit client)",
    "pay": "Payer",
    "processing": "Traitement en cours...",
    "success": "Paiement réussi !"
  },
  "quoteRequest": {
    "title": "Demande de Devis",
    "subtitle": "Remplissez le formulaire ci-dessous et notre équipe vous contactera dans les plus brefs délais.",
    "name": "Nom complet",
    "company": "Société (Optionnel)",
    "email": "Adresse e-mail",
    "phone": "Numéro de téléphone",
    "projectDescription": "Décrivez votre projet",
    "fileUpload": "Joindre un fichier (maquette, etc.)",
    "submitButton": "Envoyer la demande",
    "submitting": "Envoi en cours...",
    "successTitle": "Demande envoyée !",
    "successMessage": "Merci ! Votre demande de devis a bien été envoyée. Nous reviendrons vers vous rapidement."
  },
  "footer": {
    "description": "Votre partenaire pour la communication et l'impression de qualité au Cameroun.",
    "services": "Nos Services",
    "usefulLinks": "Liens Utiles",
    "about": "À Propos",
    "realisations": "Réalisations",
    "contact": "Contact",
    "contactUs": "Contactez-nous",
    "address": "Akwa, Douala, Cameroun",
    "phone": "+237 233 42 00 00",
    "email": "contact.douala@caap.cm",
    "copyright": "© 2024 CaapMedia. Tous droits réservés."
  },
  "roles": {
    "ADMIN": "Admin",
    "COMMERCIAL": "Commercial",
    "CAISSIER": "Caissier",
    "PURCHASING_MANAGER": "Responsable Achats",
    "FINANCIAL_DIRECTOR": "Directeur Financier",
    "SECRETARY": "Secrétaire",
    "HR_MANAGER": "Responsable RH",
    "PRODUCTION_DIRECTOR": "Directeur de Production"
  },
  "sidebar": {
    "analytics": "Analyses",
    "sales": "Ventes",
    "orders": "Commandes",
    "purchasing": "Achats",
    "stockManagement": "Gestion de Stock",
    "finance": "Finance & Gestion",
    "configuration": "Configuration",
    "aiAssistant": "Assistant IA",
    "mySales": "Mes Ventes",
    "crm": "CRM",
    "contacts": "Contacts",
    "cashRegister": "Caisse",
    "transactions": "Transactions",
    "myOrders": "Mes Commandes",
    "productCatalog": "Catalogue Produits",
    "noViewForRole": "Aucune vue disponible pour ce rôle.",
    "collapse": "Réduire",
    "expand": "Agrandir",
    "hrManagement": "Gestion RH",
    "secretariat": "Secrétariat",
    "production": "Production",
    "maintenance": "Maintenance",
    "equipements": "Équipements"
  },
  "header": {
    "profileUser": "Utilisateur {{role}}",
    "language": "Langue",
    "openMenu": "Ouvrir le menu"
  },
  "login": {
    "title": "Connexion",
    "subtitle": "Accédez à votre tableau de bord.",
    "platformTitle": "Plateforme Commerciale",
    "platformSubtitle": "Votre partenaire pour la croissance et la distribution.",
    "subsidiary": "Filiale",
    "selectSubsidiary": "Sélectionnez votre filiale",
    "emailLabel": "Adresse e-mail",
    "emailPlaceholder": "vous@exemple.com",
    "passwordLabel": "Mot de passe",
    "rememberMe": "Se souvenir de moi",
    "forgotPassword": "Mot de passe oublié ?",
    "loginButton": "Se connecter",
    "loggingIn": "Connexion en cours...",
    "errorSelectSubsidiary": "Veuillez sélectionner une filiale.",
    "errorFillFields": "Veuillez remplir tous les champs.",
    "errorIncorrectCredentials": "Identifiants incorrects. Veuillez vérifier votre e-mail et votre mot de passe.",
    "errorUserNotOnSubsidiary": "Cet utilisateur n'est pas rattaché à la filiale sélectionnée.",
    "forgotPasswordPrompt": "Veuillez entrer votre adresse e-mail pour réinitialiser votre mot de passe.",
    "forgotPasswordSuccess": "Si un compte avec l'email {{email}} existe, un lien de réinitialisation a été envoyé."
  },
   "forgotPassword": {
    "title": "Réinitialiser le mot de passe",
    "instruction": "Veuillez entrer votre adresse e-mail pour recevoir un lien de réinitialisation.",
    "sendLink": "Envoyer le lien de réinitialisation",
    "sending": "Envoi en cours...",
    "backToLogin": "Retour à la connexion",
    "successMessage": "Si un compte existe avec cet e-mail, nous avons envoyé un lien pour réinitialiser votre mot de passe.",
    "errorMessage": "Une erreur est survenue lors de l'envoi du lien de réinitialisation. Veuillez réessayer."
  },
  "ecommerce": {
    "title": "Notre Boutique",
    "welcomeTitle": "Bienvenue chez CaapMedia",
    "welcomeSubtitle": "Découvrez nos produits de qualité pour tous vos besoins.",
    "searchPlaceholder": "Rechercher un produit...",
    "allCategories": "Toutes les catégories",
    "addToCart": "Ajouter au panier",
    "shoppingCart": "Panier d'achats",
    "emptyCart": "Votre panier est vide.",
    "item": "article",
    "items": "articles",
    "total": "Total",
    "checkout": "Passer la commande",
    "checkoutTitle": "Finaliser votre commande",
    "customerInfo": "Vos informations",
    "fullName": "Nom complet",
    "email": "Adresse e-mail",
    "deliveryAddress": "Adresse de livraison",
    "confirmOrder": "Confirmer la commande",
    "orderSuccess": "Commande passée avec succès !",
    "backToHome": "Retour à l'accueil",
    "visitShop": "Visiter la boutique",
    "employeeLogin": "Connexion Employé",
    "myAccount": "Mon Compte",
    "customerLogin": "Connexion Boutique",
    "createAccount": "Créer un compte boutique"
  },
  "customerAccount": {
    "login": "Se connecter",
    "signup": "Créer un compte",
    "loginTitle": "Heureux de vous revoir !",
    "signupTitle": "Rejoignez-nous",
    "email": "Email",
    "password": "Mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "name": "Nom complet",
    "address": "Adresse",
    "loginAction": "Se connecter",
    "signupAction": "Créer mon compte",
    "or": "Ou",
    "myAccount": "Mon Compte",
    "profile": "Mon Profil",
    "myOrders": "Mes Commandes",
    "security": "Sécurité",
    "paymentMethods": "Modes de Paiement",
    "myReviews": "Mes Avis",
    "personalInfo": "Informations personnelles",
    "saveChanges": "Enregistrer les modifications",
    "changePassword": "Changer le mot de passe",
    "currentPassword": "Mot de passe actuel",
    "newPassword": "Nouveau mot de passe",
    "orderId": "ID Commande",
    "date": "Date",
    "total": "Total",
    "status": "Statut",
    "backToShop": "Retour à la boutique"
  },
  "analytics": {
    "title": "Analyses",
    "periodFilter": "Période",
    "tabs": {
      "dashboard": "Tableau de Bord",
      "salesAnalysis": "Analyse des Ventes",
      "purchaseAnalysis": "Analyse des Achats",
      "banks": "Banques",
      "safe": "Coffre-fort"
    },
    "periods": {
      "seven_days": "7 derniers jours",
      "thirty_days": "30 derniers jours",
      "ninety_days": "90 derniers jours",
      "year": "Cette année",
      "custom": "Période personnalisée"
    },
    "comingSoon": "Cette fonctionnalité sera bientôt disponible.",
    "dashboard": {
      "totalSalesMonth": "Ventes Totales (Période)",
      "netRevenue": "Revenu Net",
      "newCustomers": "Nouveaux Clients (Période)",
      "stockValue": "Valeur du Stock",
      "weeklySalesPerformance": "Performance des Ventes sur la Période",
      "stockDistributionByCategory": "Répartition du Stock par Catégorie",
      "chartSalesLabel": "Ventes"
    },
    "startDate": "Date de début",
    "endDate": "Date de fin"
  },
  "salesAnalysis": {
    "totalRevenue": "Chiffre d'affaires total",
    "orderCount": "Nombre de Commandes",
    "cashSaleCount": "Ventes à la Caisse",
    "averageBasket": "Panier Moyen",
    "topProducts": "Produits les Plus Vendus",
    "salesByCategory": "Ventes par Catégorie",
    "topCustomers": "Meilleurs Clients",
    "product": "Produit",
    "revenue": "Revenu",
    "quantity": "Quantité",
    "customer": "Client",
    "totalSpent": "Montant total dépensé"
  },
   "purchaseAnalysis": {
    "totalPurchaseValue": "Valeur Totale des Achats",
    "totalOrders": "Nombre de Commandes",
    "averageOrderValue": "Valeur Moyenne par Commande",
    "spendingBySupplier": "Dépenses par Fournisseur",
    "purchasesOverTime": "Évolution des Achats",
    "topPurchasedProducts": "Top 5 des Produits Achetés",
    "totalValue": "Valeur Totale",
    "chartPurchasesLabel": "Achats"
  },
  "pnl": {
    "tabTitle": "Compte de Résultat",
    "title": "Compte de Résultat",
    "revenue": "Chiffre d'Affaires (Ventes HT)",
    "cogs": "Coût des Marchandises Vendues (CMV)",
    "grossProfit": "Marge Brute",
    "operatingExpenses": "Charges d'Exploitation",
    "operatingIncome": "Résultat d'Exploitation",
    "tax": "Impôts (Estimation)",
    "netIncome": "Résultat Net",
    "thisMonth": "Ce mois-ci",
    "lastMonth": "Le mois dernier"
  },
  "sales": {
    "orderHistoryTitle": "Historique des Commandes",
    "transactionHistoryTitle": "Historique des Transactions",
    "saleId": "ID Vente",
    "product": "Produit",
    "customer": "Client",
    "date": "Date",
    "quantity": "Quantité",
    "totalPrice": "Prix Total",
    "status": "Statut",
    "statusPaid": "Payé",
    "statusPending": "En attente",
    "statusCancelled": "Annulé",
    "recordPaymentModal": {
      "title": "Encaisser un Paiement",
      "amountToRecord": "Montant à encaisser"
    },
    "updateStatusModal": {
      "title": "Mettre à jour le statut de la commande",
      "newStatus": "Nouveau statut"
    },
    "topSellingProducts": {
      "title": "Produits les plus vendus",
      "product": "Produit",
      "quantity": "Quantité Vendue",
      "revenue": "Revenu Total"
    },
    "paymentOverdue": "Paiement en retard",
    "statusIssue": "Commande annulée",
    "validateForProduction": "Valider pour Production"
  },
  "order": {
    "orderId": "ID Commande",
    "customer": "Client",
    "date": "Date",
    "total": "Montant Total",
    "status": "Statut",
    "status_PENDING_VALIDATION": "En Attente de Validation",
    "status_NEW": "Nouvelle",
    "status_IN_PRODUCTION": "En Production",
    "status_PENDING_DELIVERY": "Prête",
    "status_DELIVERED": "Livrée",
    "status_COMPLETED": "Terminée",
    "status_CANCELLED": "Annulée",
    "recordPayment": "Encaisser",
    "paymentStatus": "Statut Paiement",
    "orderStatus": "Statut Commande",
    "amountPaid": "Montant Payé",
    "remainingBalance": "Solde Restant",
    "updateStatus": "Mettre à jour le statut",
    "paymentStatus_UNPAID": "Non Payée",
    "paymentStatus_PARTIALLY_PAID": "Partiellement Payée",
    "paymentStatus_PAID": "Payée"
  },
  "production": {
    "title": "Suivi de Production",
    "status_PREPRESS": "Pré-presse",
    "status_PRINTING": "Impression",
    "status_FINISHING": "Finition",
    "status_READY_FOR_DELIVERY": "Prêt pour Livraison"
  },
  "purchasing": {
    "title": "Gestion des Achats",
    "newOrder": "Nouveau Bon de Commande",
    "poNumber": "N° de commande",
    "supplier": "Fournisseur",
    "orderDate": "Date de commande",
    "deliveryDate": "Date de livraison prévue",
    "total": "Montant Total",
    "status": "Statut Réception",
    "receiveOrder": "Réceptionner la commande",
    "recordPayment": "Enregistrer un paiement",
    "viewOrder": "Voir la commande",
    "cancelOrder": "Annuler la commande",
    "quantityReceived": "Reçu",
    "status_DRAFT": "Brouillon",
    "status_ORDERED": "Commandé",
    "status_PARTIALLY_RECEIVED": "Partiellement Reçu",
    "status_RECEIVED": "Reçu",
    "status_CANCELLED": "Annulé",
    "paymentTerms": "Termes de paiement",
    "terms_IMMEDIATE": "Paiement immédiat",
    "terms_CREDIT": "Crédit",
    "terms_DRAFT_PAYMENT": "Traite",
    "paymentStatus": {
      "title": "Statut Paiement",
      "UNPAID": "Non Payé",
      "PARTIALLY_PAID": "Partiellement Payé",
      "PAID": "Payé"
    },
    "modal": {
      "addTitle": "Créer un nouveau bon de commande",
      "editTitle": "Modifier le bon de commande",
      "detailsTitle": "Détails du Bon de Commande"
    },
    "receiveItemsModal": {
        "title": "Réceptionner les articles",
        "ordered": "Commandé",
        "alreadyReceived": "Déjà Reçu",
        "quantityToReceive": "Quantité à réceptionner"
    },
    "paymentModal": {
        "title": "Enregistrer un paiement",
        "totalAmount": "Montant total de la commande",
        "amountPaid": "Montant déjà payé",
        "remainingBalance": "Solde restant",
        "amountToPay": "Montant à payer"
    },
    "history": {
        "title": "Historique de la commande"
    },
    "form": {
      "supplier": "Fournisseur",
      "selectSupplier": "Sélectionnez un fournisseur",
      "orderDate": "Date de commande",
      "deliveryDate": "Date de livraison prévue",
      "paymentTerms": "Termes de paiement",
      "products": "Produits",
      "addProduct": "Ajouter un produit",
      "product": "Produit",
      "selectProduct": "Sélectionnez un produit",
      "quantity": "Quantité",
      "purchasePrice": "Prix d'achat unitaire",
      "total": "Total",
      "orderSummary": "Résumé de la commande"
    }
  },
  "stock": {
    "title": "Gestion de Stock",
    "searchPlaceholder": "Rechercher par nom, ID...",
    "productId": "ID Produit",
    "name": "Nom",
    "category": "Catégorie",
    "description": "Description",
    "warehouse": "Entrepôt",
    "currentStock": "Stock Actuel",
    "costPrice": "Prix de Revient",
    "sellingPrice": "Prix de Vente",
    "margin": "Marge",
    "range": "Gamme",
    "confirmPriceSaveTitle": "Confirmer la sauvegarde",
    "confirmPriceSaveMessage": "Voulez-vous enregistrer les nouveaux prix ?",
    "available": "Disponible",
    "categories": {
      "pub": "Pub",
      "carterie": "Carterie",
      "packaging": "Packaging",
      "papeterie": "Papeterie",
      "restoHotels": "Resto - Hôtels",
      "impressionLivre": "Impression livre",
      "bachesBanderoles": "Bâches & Banderoles",
      "rollupKakemono": "Roll-up & Kakemono",
      "drapeauxOriflammes": "Drapeaux & Oriflammes",
      "panneauxEnseignes": "Panneaux & Enseignes",
      "standsPlv": "Stands & PLV",
      "textile": "Textile",
      "mugsGobeletsGourdes": "Mugs, gobelets et gourdes",
      "sacsPersonnalises": "Sacs personnalisés",
      "evenementiel": "Événementiel",
      "mobilierPublicitaire": "Mobilier publicitaire",
      "ecritureBureau": "Écriture & Bureau",
      "maisonDeco": "Maison & Déco",
      "creationSitesWeb": "Création & gestion de sites web",
      "marketingDigital": "Marketing digital & publicité",
      "reseauxSociaux": "Réseaux sociaux",
      "designIdentiteVisuelle": "Design & identité visuelle",
      "papiersCartons": "Papiers & Cartons",
      "encresChimiques": "Encres & Chimiques",
      "supportsBaches": "Supports & Bâches",
      "finitionFaconnage": "Finition & Façonnage",
      "prestationsExternes": "Prestations Externes",
      "textilesRaw": "Textiles (Matière Première)"
    }
  },
  "productRange": {
    "popular": "Populaire",
    "standard": "Standard",
    "premium": "Premium",
    "none": "Aucune"
  },
  "aiMarketing": {
    "title": "Assistant Marketing IA",
    "subtitle": "Décrivez votre produit et laissez Gemini créer des campagnes marketing pour vous.",
    "productInfoLabel": "Informations sur le produit/service",
    "productInfoPlaceholder": "Ex: 'Sucre blond de canne, sans additifs, vendu en sacs de 50kg pour les grossistes et en sachets de 1kg pour les détaillants.'",
    "errorPrompt": "Veuillez décrire votre produit ou service.",
    "generateButton": "Générer des Idées Marketing",
    "generating": "Génération en cours...",
    "suggestedCampaigns": "Idées de Campagnes Suggérées",
    "geminiError": "La clé API Gemini n'est pas configurée. Veuillez la définir dans les variables d'environnement pour utiliser cette fonctionnalité.",
    "geminiUnexpectedError": "Désolé, une erreur inattendue est survenue avec l'assistant IA."
  },
  "cashRegister": {
    "title": "Interface de Caisse",
    "searchPlaceholder": "Rechercher un produit par nom...",
    "cartTitle": "Panier",
    "cartEmpty": "Le panier est vide.",
    "paymentSuccess": "Paiement réussi !",
    "total": "Total",
    "paymentMethod": "Moyen de paiement",
    "checkoutButton": "Encaisser",
    "paymentMethods": {
      "cash": "Espèces",
      "card": "Carte",
      "check": "Chèque",
      "mobile": "Mobile"
    },
    "clientSection": {
      "title": "Client",
      "selectAdd": "Sélectionner / Ajouter un client",
      "change": "Changer",
      "modalTitle": "Sélectionner ou Créer un Client",
      "selectTab": "Sélectionner un client",
      "createTab": "Créer un nouveau client",
      "searchClient": "Rechercher un client..."
    },
    "findOrder": "Trouver une commande",
    "orderSelectionModal": {
      "title": "Sélectionner une commande",
      "searchPlaceholder": "Rechercher par ID, nom, téléphone..."
    },
    "loadedOrder": {
      "title": "Encaissement sur Commande",
      "orderId": "Commande N°",
      "total": "Total Commande",
      "paid": "Déjà Payé",
      "remaining": "Solde Restant",
      "amountToPay": "Montant à encaisser",
      "newSale": "Nouvelle Vente",
      "paymentSuccess": "Paiement enregistré avec succès !"
    }
  },
  "myOrders": {
    "title": "Mes Commandes",
    "historyTab": "Historique",
    "newOrderTab": "Nouvelle Commande",
    "noOrders": "Vous n'avez aucune commande pour le moment."
  },
  "newOrder": {
    "title": "Créer une nouvelle commande",
    "searchPlaceholder": "Rechercher un produit...",
    "productCatalog": "Catalogue des produits",
    "product": "Produit",
    "price": "Prix",
    "quantity": "Qté",
    "addToCart": "Ajouter",
    "orderSummary": "Votre Commande",
    "cartEmpty": "Votre panier est vide.",
    "total": "Total",
    "submitOrder": "Passer la commande",
    "orderPlacedSuccess": "Commande passée avec succès !",
    "item": "Article",
    "subtotal": "Sous-total"
  },
  "bonDeLivraison": {
    "title": "Bon de Livraison",
    "orderNum": "Commande N°",
    "date": "Date",
    "billedTo": "Facturé à",
    "item": "Article",
    "quantity": "Quantité",
    "unitPrice": "Prix Unitaire",
    "totalPrice": "Prix Total",
    "total": "Total Général",
    "print": "Imprimer le bon",
    "exportPdf": "Exporter en PDF"
  },
  "invoice": {
    "title": "Facture",
    "invoiceNum": "Facture N°",
    "billedTo": "Facturé à",
    "date": "Date",
    "item": "Article",
    "quantity": "Quantité",
    "unitPrice": "Prix Unitaire HT",
    "totalPrice": "Prix Total HT",
    "total": "Total Général",
    "viewInvoice": "Voir la facture",
    "exportPdf": "Exporter en PDF",
    "phone": "Tél",
    "email": "Email",
    "ifu": "IFU",
    "rccm": "RCCM",
    "paymentDueDate": "Date d'échéance",
    "subtotal": "Total HT",
    "tax": "TVA",
    "totalTTC": "Total TTC",
    "paymentInfo": "Informations de paiement"
  },
  "finance": {
    "title": "Finance & Gestion",
    "creditManagement": "Gestion des Crédits",
    "treasury": "Trésorerie",
    "supplierDebts": "Dettes Fournisseurs",
    "expenses": "Charges",
    "bilan": {
      "tabTitle": "Bilan",
      "title": "Bilan Financier",
      "asOfDate": "Bilan au",
      "assets": "Actifs",
      "liabilitiesAndEquity": "Passifs et Capitaux Propres",
      "currentAssets": "Actifs Circulants",
      "cash": "Trésorerie (Banques & Caisse)",
      "accountsReceivable": "Créances Clients",
      "inventory": "Stocks",
      "fixedAssets": "Actifs Immobilisés",
      "equipment": "Matériels et Équipements",
      "totalAssets": "Total Actifs",
      "liabilities": "Passifs",
      "accountsPayable": "Dettes Fournisseurs",
      "equity": "Capitaux Propres",
      "shareCapital": "Capital Social",
      "netIncome": "Résultat Net de l'exercice",
      "totalLiabilitiesAndEquity": "Total Passifs et Capitaux Propres"
    }
  },
  "credit": {
    "totalReceivables": "Total Créances Clients",
    "totalReceivablesDesc": "Montant total dû par les clients.",
    "customerCreditTracking": "Suivi des Crédits Clients",
    "customerName": "Nom du client",
    "company": "Société",
    "lastPaymentDate": "Dernier Paiement",
    "balanceDue": "Solde Dû",
    "viewDetails": "Voir détails",
    "recordPayment": "Encaisser"
  },
  "treasury": {
    "recentTransactions": "Transactions Récentes",
    "addExpense": "Ajouter Dépense",
    "addIncome": "Ajouter Recette",
    "date": "Date",
    "description": "Description",
    "account": "Compte",
    "type": "Type",
    "amount": "Montant",
    "status": "Statut",
    "statusValidated": "Validé",
    "statusPending": "En attente",
    "typeIncome": "Recette",
    "typeExpense": "Dépense"
  },
  "supplierDebts": {
    "totalDebts": "Total Dettes Fournisseurs",
    "totalDebtsDesc": "Montant total dû aux fournisseurs.",
    "trackingTitle": "Suivi des Dettes Fournisseurs",
    "supplier": "Fournisseur",
    "invoiceId": "N° Facture",
    "dueDate": "Date d'échéance",
    "amount": "Montant",
    "status": "Statut",
    "statusToPay": "À payer",
    "statusPaid": "Payé",
    "statusOverdue": "En retard"
  },
  "expenses": {
    "title": "Gestion des Charges",
    "addExpense": "Ajouter une charge",
    "totalExpenses": "Total des charges",
    "totalExpensesDesc": "Sur la période sélectionnée",
    "table": {
      "date": "Date",
      "description": "Description",
      "category": "Catégorie",
      "type": "Type",
      "amount": "Montant"
    },
    "types": {
      "FIXED": "Fixe",
      "VARIABLE": "Variable"
    },
    "categories": {
      "RENT": "Loyer",
      "SALARIES": "Salaires",
      "ADVERTISING": "Publicité",
      "TRANSPORT": "Transport/Logistique",
      "SERVICES": "Services (IT, Compta)",
      "INSURANCE": "Assurances",
      "PURCHASE_COST": "Coût d’achat",
      "COMMISSIONS": "Commissions",
      "PACKAGING": "Emballages",
      "TRANSACTION_FEES": "Frais de transaction",
      "OTHER": "Autre"
    },
    "modal": {
      "addTitle": "Ajouter une nouvelle charge",
      "editTitle": "Modifier la charge",
      "deleteTitle": "Supprimer la charge"
    },
    "filter": {
      "category": "Catégorie",
      "allCategories": "Toutes les catégories",
      "type": "Type",
      "allTypes": "Tous les types"
    }
  },
  "filter": {
    "client": "Client",
    "allClients": "Tous les clients",
    "product": "Produit",
    "allProducts": "Tous les produits",
    "status": "Statut",
    "allStatuses": "Tous les statuts",
    "reset": "Réinitialiser",
    "allTime": "Toujours",
    "noResults": "Aucune commande trouvée pour les filtres sélectionnés.",
    "noTransactions": "Aucune transaction trouvée pour les filtres sélectionnés.",
    "orderStatus": "Statut de la commande",
    "paymentStatus": "Statut du paiement",
    "allOrderStatuses": "Tous les statuts de commande",
    "allPaymentStatuses": "Tous les statuts de paiement",
    "apply": "Appliquer"
  },
  "configuration": {
    "title": "Configuration Générale",
    "products": "Produits",
    "users": "Utilisateurs",
    "suppliers": "Fournisseurs",
    "taxes": "Taxes",
    "productManagement": "Gestion des Produits",
    "addProduct": "Ajouter un produit",
    "addTax": "Ajouter une taxe",
    "productId": "ID",
    "name": "Nom",
    "category": "Catégorie",
    "sellingPrice": "Prix de vente",
    "stock": "Stock",
    "clientManagement": "Gestion des Clients",
    "addClient": "Ajouter un client",
    "company": "Société",
    "email": "Email",
    "phone": "Téléphone",
    "userManagement": "Gestion des Utilisateurs",
    "addUser": "Ajouter un utilisateur",
    "role": "Rôle",
    "supplierManagement": "Gestion des Fournisseurs",
    "addSupplier": "Ajouter un fournisseur",
    "taxManagement": "Gestion des Taxes",
    "modal": {
      "editProductTitle": "Modifier le produit",
      "addProductTitle": "Ajouter un nouveau produit",
      "editClientTitle": "Modifier le client",
      "addClientTitle": "Ajouter un nouveau client",
      "editUserTitle": "Modifier l'utilisateur",
      "addUserTitle": "Ajouter un nouvel utilisateur",
      "editSupplierTitle": "Modifier le fournisseur",
      "addSupplierTitle": "Ajouter un nouveau fournisseur",
      "deleteProductTitle": "Supprimer le produit",
      "deleteClientTitle": "Supprimer le client",
      "deleteUserTitle": "Supprimer l'utilisateur",
      "deleteSupplierTitle": "Supprimer le fournisseur",
      "deleteEmployeeTitle": "Supprimer l'employé",
      "deleteConfirmMessage": "Êtes-vous sûr de vouloir supprimer {{itemName}} ? Cette action est irréversible.",
      "recordAttendanceTitle": "Signature de {{employeeName}}",
      "viewSignatureTitle": "Signature de {{name}}",
      "payrollSignatureTitle": "Signature pour la paie de {{employeeName}}",
      "employeeDetailsTitle": "Détails de l'employé",
      "addAbsenceTitle": "Enregistrer une nouvelle absence",
      "editAbsenceTitle": "Modifier une absence",
      "deleteAbsenceTitle": "Supprimer une absence",
      "editTaxTitle": "Modifier la taxe",
      "addTaxTitle": "Ajouter une nouvelle taxe",
      "deleteTaxTitle": "Supprimer la taxe"
    },
    "form": {
      "name": "Nom",
      "category": "Catégorie",
      "description": "Description",
      "costPrice": "Prix de revient",
      "sellingPrice": "Prix de vente",
      "stock": "Stock",
      "warehouse": "Entrepôt",
      "range": "Gamme",
      "company": "Société",
      "email": "Email",
      "phone": "Téléphone",
      "since": "Client depuis",
      "role": "Rôle",
      "address": "Adresse",
      "formSection": {
        "personal": "Personnel",
        "professional": "Professionnel",
        "salary": "Salarial"
      },
      "firstName": "Prénom",
      "lastName": "Nom de famille",
      "birthDate": "Date de naissance",
      "gender": "Sexe",
      "nationality": "Nationalité",
      "ssn": "N° de sécurité sociale",
      "position": "Poste",
      "department": "Département",
      "hireDate": "Date d'embauche",
      "contractType": "Type de contrat",
      "employeeStatus": "Statut de l'employé",
      "workLocation": "Lieu de travail",
      "baseSalary": "Salaire de base",
      "bonus": "Bonus",
      "benefits": "Avantages (séparés par une virgule)",
      "paymentMethod": "Mode de paiement",
      "absenceType": "Type d'absence",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "reason": "Motif",
      "document": "Justificatif",
      "uploadFile": "Charger un fichier",
      "generateWithAI": "Générer avec l'IA",
      "rate": "Taux (%)",
      "isDefault": "Taxe par défaut"
    }
  },
  "hr": {
    "title": "Gestion des Ressources Humaines",
    "tabs": {
      "employees": "Employés",
      "attendance": "Présences",
      "payroll": "Paie",
      "absences": "Absences"
    },
    "employees": {
      "title": "Base de Données Employés",
      "add": "Ajouter un employé",
      "id": "ID",
      "fullName": "Nom complet",
      "position": "Poste",
      "department": "Département",
      "contractType": "Contrat",
      "status": "Statut"
    },
    "attendance": {
      "title": "Gestion des Présences",
      "record": "Pointer une présence",
      "employee": "Employé",
      "date": "Date",
      "status": "Statut",
      "arrivalTime": "Arrivée",
      "breakTime": "Pause",
      "departureTime": "Départ",
      "signature": "Signature",
      "status_PRESENT": "Présent",
      "status_ABSENT_JUSTIFIED": "Absent (J)",
      "status_ABSENT_UNJUSTIFIED": "Absent (NJ)",
      "status_HOLIDAY": "Congé",
      "viewSignature": "Voir",
      "notSigned": "Non signé"
    },
    "payroll": {
      "title": "Gestion de la Paie",
      "process": "Traiter la paie du mois",
      "employee": "Employé",
      "period": "Période",
      "netSalary": "Salaire Net",
      "paymentDate": "Date de paiement",
      "status": "Statut",
      "signature": "Signature",
      "status_PENDING": "En attente",
      "status_PAID": "Payé",
      "sign": "Signer"
    },
    "modals": {
      "sign": {
        "title": "Signature pour {{employeeName}}",
        "clear": "Effacer",
        "save": "Enregistrer la signature"
      }
    },
    "gender": {
      "MALE": "Masculin",
      "FEMALE": "Féminin",
      "OTHER": "Autre"
    },
    "contractType": {
      "CDI": "CDI",
      "CDD": "CDD",
      "FREELANCE": "Freelance",
      "INTERNSHIP": "Stage"
    },
    "employeeStatus": {
      "ACTIVE": "Actif",
      "ON_LEAVE": "En congé",
      "RESIGNED": "Démissionnaire",
      "TERMINATED": "Licencié"
    },
    "paymentMethod": {
      "BANK_TRANSFER": "Virement bancaire",
      "CHECK": "Chèque",
      "CASH": "Espèces"
    },
    "details": {
      "personalInfo": "Informations personnelles",
      "lastName": "Nom",
      "firstName": "Prénom",
      "birthDate": "Date de naissance",
      "gender": "Sexe",
      "nationality": "Nationalité",
      "ssn": "N° de sécurité sociale",
      "phone": "Téléphone",
      "email": "Email",
      "address": "Adresse",
      "professionalInfo": "Informations professionnelles",
      "position": "Poste",
      "department": "Département",
      "hireDate": "Date d'embauche",
      "contractType": "Type de contrat",
      "status": "Statut",
      "workLocation": "Lieu de travail",
      "manager": "Manager",
      "none": "Aucun",
      "salaryInfo": "Informations salariales",
      "baseSalary": "Salaire de base",
      "bonus": "Bonus",
      "benefits": "Avantages",
      "paymentMethod": "Mode de paiement",
      "lastSalaryAdjustment": "Dernier ajustement",
      "notApplicable": "N/A",
      "documents": "Documents administratifs",
      "contract": "Contrat de travail",
      "idCard": "Pièce d'identité",
      "workPermit": "Permis de travail",
      "diplomas": "Diplômes",
      "noDocument": "Aucun document",
      "leaveInfo": "Informations sur les congés",
      "leaveBalance": "Solde de congés"
    },
    "absences": {
      "title": "Gestion des Absences",
      "add": "Enregistrer une absence",
      "table": {
        "employee": "Employé",
        "type": "Type",
        "startDate": "Date de début",
        "endDate": "Date de fin",
        "reason": "Motif",
        "document": "Justificatif",
        "download": "Télécharger",
        "noDocument": "Aucun"
      }
    },
    "absenceType": {
      "JUSTIFIED": "Justifiée",
      "UNJUSTIFIED": "Non justifiée"
    }
  },
  "secretariat": {
    "title": "Secrétariat",
    "tabs": {
      "documents": "Documents",
      "meetings": "Réunions",
      "tasks": "Tâches"
    },
    "documents": {
      "title": "Gestion des Documents",
      "add": "Ajouter un document",
      "table": {
        "name": "Nom du document",
        "category": "Catégorie",
        "uploadDate": "Date d'ajout",
        "status": "Statut",
        "file": "Fichier"
      },
      "categories": {
        "LEGAL": "Juridique",
        "FINANCIAL": "Financier",
        "HR": "RH",
        "CONTRACT": "Contrat",
        "OTHER": "Autre"
      },
      "statuses": {
        "DRAFT": "Brouillon",
        "FINAL": "Final",
        "ARCHIVED": "Archivé"
      },
      "modal": {
        "addTitle": "Ajouter un nouveau document",
        "editTitle": "Modifier le document",
        "deleteTitle": "Supprimer le document"
      }
    },
    "meetings": {
      "title": "Suivi des Réunions",
      "add": "Planifier une réunion",
      "table": {
        "title": "Titre",
        "date": "Date et Heure",
        "location": "Lieu",
        "participants": "Participants"
      },
      "modal": {
        "addTitle": "Planifier une nouvelle réunion",
        "editTitle": "Modifier la réunion",
        "detailsTitle": "Détails de la réunion",
        "deleteTitle": "Annuler la réunion"
      },
      "details": {
        "agenda": "Ordre du jour",
        "minutes": "Compte-rendu",
        "noMinutes": "Aucun compte-rendu rédigé."
      }
    },
    "tasks": {
      "title": "Gestion des Tâches",
      "add": "Ajouter une tâche",
      "table": {
        "title": "Tâche",
        "assignedTo": "Assignée à",
        "dueDate": "Échéance",
        "status": "Statut"
      },
      "statuses": {
        "TODO": "À faire",
        "IN_PROGRESS": "En cours",
        "DONE": "Terminé"
      },
      "modal": {
        "addTitle": "Créer une nouvelle tâche",
        "editTitle": "Modifier la tâche",
        "deleteTitle": "Supprimer la tâche"
      }
    }
  },
  "crm": {
    "title": "CRM",
    "tabs": {
      "dashboard": "Tableau de Bord",
      "leads": "Pistes",
      "accounts": "Comptes",
      "contacts": "Contacts",
      "deals": "Transactions",
      "tasks": "Tâches",
      "pipeline": "Pipeline",
      "contracts": "Contrats signés"
    },
    "tasks": {
      "title": "Gestion des Tâches",
      "addTask": "Ajouter une tâche",
      "filterByStatus": "Filtrer par statut",
      "filterByDueDate": "Filtrer par échéance",
      "allStatuses": "Tous les statuts",
      "allDates": "Toutes les dates",
      "today": "Aujourd'hui",
      "thisWeek": "Cette semaine",
      "overdue": "En retard",
      "status_TODO": "À faire",
      "status_IN_PROGRESS": "En cours",
      "status_DONE": "Terminé",
      "relatedTo": "Lié à",
      "assignedTo": "Assigné à",
      "dueDate": "Échéance",
      "priority": "Priorité",
      "priority_LOW": "Basse",
      "priority_MEDIUM": "Moyenne",
      "priority_HIGH": "Haute",
      "filterByPriority": "Filtrer par priorité",
      "allPriorities": "Toutes les priorités"
    },
    "taskModal": {
      "addTitle": "Ajouter une nouvelle tâche",
      "editTitle": "Modifier la tâche",
      "title": "Titre",
      "description": "Description",
      "contact": "Contact",
      "selectContact": "Sélectionner un contact",
      "opportunity": "Opportunité (optionnel)",
      "selectOpportunity": "Sélectionner une opportunité",
      "noOpportunities": "Aucune opportunité pour ce contact",
      "dueDate": "Date d'échéance",
      "status": "Statut",
      "assignedTo": "Assigné à"
    },
    "leads": {
      "title": "Gestion des Pistes",
      "add": "Ajouter une piste",
      "convert": "Convertir",
      "name": "Nom",
      "company": "Société",
      "email": "Email",
      "phone": "Téléphone",
      "status": "Statut",
      "status_NEW": "Nouveau",
      "status_CONTACTED": "Contacté",
      "status_QUALIFIED": "Qualifié",
      "status_LOST": "Perdu",
      "modal": {
        "addTitle": "Ajouter une nouvelle piste",
        "editTitle": "Modifier la piste",
        "deleteTitle": "Supprimer la piste"
      }
    },
    "accounts": {
      "title": "Gestion des Comptes",
      "add": "Ajouter un compte",
      "name": "Nom du compte",
      "industry": "Secteur d'activité",
      "phone": "Téléphone",
      "address": "Adresse",
      "modal": {
        "addTitle": "Ajouter un nouveau compte",
        "editTitle": "Modifier le compte",
        "deleteTitle": "Supprimer le compte"
      }
    },
    "activities": {
      "addTask": "Ajouter une action",
      "selectTask": "Sélectionner une action",
      "contact": "Contact",
      "selectContact": "Sélectionner un contact",
      "dueDate": "Date d'échéance",
      "overdue": "En retard",
      "today": "Aujourd'hui",
      "upcoming": "À venir",
      "completed": "Terminée",
      "noActivity": "Aucune activité à afficher."
    },
    "taskTitles": {
        "follow_up_call": "Faire un appel de suivi",
        "send_quote": "Envoyer un devis",
        "schedule_meeting": "Planifier une réunion",
        "follow_up_proposal": "Suivi de la proposition",
        "send_documentation": "Envoyer la documentation",
        "check_in_email": "Envoyer un email de prise de contact"
    },
    "dashboard": {
      "pipelineValue": "Valeur du Pipeline",
      "conversionRate": "Taux de Conversion",
      "newOpportunities": "Nouvelles Opportunités",
      "newWebOpportunities": "Nouvelles Opportunités (Web)",
      "salesFunnel": "Entonnoir des Ventes",
      "myTasks": "Mes Tâches",
      "recentActivity": "Activité Récente"
    },
    "pipeline": {
      "addOpportunity": "Ajouter une Opportunité"
    },
    "opportunity": {
      "stages": {
        "QUALIFICATION": "Qualification",
        "PROPOSAL": "Proposition",
        "NEGOTIATION": "Négociation",
        "WON": "Gagné",
        "LOST": "Perdu"
      },
      "modal": {
          "addTitle": "Ajouter une nouvelle opportunité",
          "editTitle": "Modifier l'opportunité",
          "deleteTitle": "Supprimer l'opportunité"
      },
      "form": {
          "name": "Nom de l'opportunité",
          "client": "Client/Prospect",
          "selectClient": "Sélectionnez un client",
          "value": "Valeur Estimée",
          "stage": "Étape",
          "products": "Produits Concernés",
          "selectProducts": "Sélectionnez les produits",
          "closeDate": "Date de clôture prévue"
      }
    },
    "contacts": {
      "title": "Gestion des Contacts",
      "add": "Ajouter un contact",
      "contact": "Contact",
      "company": "Société",
      "email": "Email",
      "phone": "Téléphone",
      "status": "Statut",
      "contracts": "Contrats signés",
      "opportunities": "Opportunités",
      "statuses": {
        "PROSPECT": "Prospect",
        "ACTIVE": "Actif",
        "INACTIVE": "Inactif"
      },
      "details": {
        "title": "Détails du Contact",
        "info": "Informations",
        "interactions": "Interactions",
        "logInteraction": "Enregistrer une interaction",
        "tasks": "Tâches",
        "opportunities": "Opportunités",
        "contracts": "Contrats signés",
        "noInteractions": "Aucune interaction enregistrée."
      }
    },
    "contracts": {
      "title": "Gestion des Contrats signés",
      "add": "Ajouter un contrat",
      "table": {
        "title": "Titre du contrat",
        "client": "Client",
        "startDate": "Date de début",
        "endDate": "Date de fin",
        "amount": "Montant",
        "status": "Statut"
      },
      "status_DRAFT": "Brouillon",
      "status_ACTIVE": "Actif",
      "status_EXPIRED": "Expiré",
      "status_CANCELLED": "Annulé",
      "modal": {
        "addTitle": "Ajouter un nouveau contrat",
        "editTitle": "Modifier le contrat",
        "deleteTitle": "Supprimer le contrat"
      }
    }
  },
  "interactions": {
    "types": {
      "CALL": "Appel",
      "EMAIL": "Email",
      "MEETING": "Réunion",
      "OTHER": "Autre"
    },
    "form": {
      "type": "Type d'interaction",
      "notes": "Notes",
      "notesPlaceholder": "Entrez les détails de l'interaction...",
      "log": "Enregistrer"
    }
  },
   "product": {
    "generationFailed": "La génération a échoué. Veuillez réessayer.",
    "serviceUnavailable": "Le service IA est actuellement indisponible.",
    "noImageGenerated": "Aucune image n'a été générée. Essayez une invite différente.",
    "descriptionGenerationError": "La génération de la description a échoué. Veuillez réessayer.",
    "imageGenerationNoImage": "Aucune image n'a été générée. Essayez une autre description.",
    "imageGenerationError": "La génération de l'image a échoué. Le service est peut-être indisponible."
  },
  "calculator": {
    "title": "Calculateur de Prix",
    "configure": "Configurer",
    "format": "Format",
    "grammage": "Grammage",
    "printSide": "Impression",
    "lamination": "Pelliculage",
    "quantity": "Quantité",
    "unitPrice": "Prix unitaire",
    "totalPrice": "Prix total",
    "addToCart": "Ajouter au Panier",
    "size": "Taille",
    "color": "Couleur",
    "material": "Matière",
    "dimension": "Dimension",
    "binding": "Reliure",
    "folding": "Pliage",
    "corners": "Coins",
    "rounded": "Arrondis",
    "square": "Carrés",
    "eyelets": "Œillets",
    "yes": "Oui",
    "no": "Non",
    "pages": "Pages",
    "handles": "Poignées",
    "flat": "Plates",
    "twisted": "Torsadées",
    "stub": "Souche détachable",
    "numbering": "Numérotation",
    "uploadFile": "Télécharger votre fichier",
    "dragAndDrop": "Glissez-déposez ou cliquez pour choisir",
    "fileUploaded": "Fichier chargé :",
    "removeFile": "Supprimer"
  },
  "maintenance": {
    "title": "Gestion de la Maintenance",
    "addEquipment": "Ajouter un équipement",
    "equipmentName": "Nom de l'équipement",
    "status": "Statut",
    "lastMaintenance": "Dernière Maintenance",
    "nextMaintenance": "Prochaine Maintenance",
    "history": "Historique",
    "logMaintenance": "Consigner une maintenance",
    "status_OPERATIONAL": "Opérationnel",
    "status_NEEDS_MAINTENANCE": "Nécessite Maintenance",
    "status_OUT_OF_SERVICE": "Hors Service",
    "modal": {
        "addTitle": "Ajouter un équipement",
        "editTitle": "Modifier l'équipement",
        "deleteTitle": "Supprimer l'équipement",
        "logTitle": "Historique de Maintenance pour {{name}}",
        "addLogTitle": "Ajouter une intervention"
    },
    "form": {
        "name": "Nom de l'équipement",
        "status": "Statut",
        "lastMaintenanceDate": "Date de la dernière maintenance",
        "nextMaintenanceDate": "Date de la prochaine maintenance",
        "technician": "Technicien",
        "description": "Description de l'intervention",
        "cost": "Coût (FCFA)",
        "acquisitionDate": "Date d'acquisition",
        "acquisitionValue": "Valeur d'acquisition"
    }
  },
  "equipements": {
    "title": "Équipements & Actifs",
    "listTitle": "Liste des équipements",
    "acquisitionDate": "Date d'acquisition",
    "acquisitionValue": "Valeur d'acquisition"
  }
};

// FIX: Define the Translations type based on the structure of frTranslations.
type Translations = typeof frTranslations;

const enTranslations: Translations = {
    "common": {
        "searchPlaceholder": "Search products, customers...",
        "logout": "Logout",
        "add": "Add",
        "edit": "Edit",
        "delete": "Delete",
        "save": "Save",
        "cancel": "Cancel",
        "loading": "Loading...",
        "version": "Version",
        "actions": "Actions",
        "viewBL": "View Delivery Note",
        "close": "Close",
        "confirmDelete": "Yes, delete",
        "confirm": "Confirm",
        "view": "Details",
        "print": "Print",
        "export": "Export to CSV",
        "exportPdf": "Export to PDF"
    },
    "idleModal": {
      "title": "Are you still there?",
      "message": "You will be logged out due to inactivity in {{countdown}} seconds.",
      "stayLoggedIn": "Stay Logged In",
      "logout": "Logout"
    },
    "payment": {
        "chooseMethod": "Choose your payment method",
        "creditCard": "Credit Card",
        "orangeMoney": "Orange Money",
        "wave": "Wave",
        "mtnMoney": "MTN Money",
        "paycaap": "Paycaap.com",
        "payOnDelivery": "Pay on Delivery",
        "customerCredit": "Pay in 30 days (Customer Credit)",
        "pay": "Pay",
        "processing": "Processing...",
        "success": "Payment successful!"
    },
    "quoteRequest": {
        "title": "Request a Quote",
        "subtitle": "Fill out the form below and our team will contact you as soon as possible.",
        "name": "Full Name",
        "company": "Company (Optional)",
        "email": "Email Address",
        "phone": "Phone Number",
        "projectDescription": "Describe your project",
        "fileUpload": "Attach a file (mockup, etc.)",
        "submitButton": "Send Request",
        "submitting": "Submitting...",
        "successTitle": "Request Sent!",
        "successMessage": "Thank you! Your quote request has been sent successfully. We will get back to you shortly."
    },
    "footer": {
      "description": "Your partner for quality communication and printing in Cameroon.",
      "services": "Our Services",
      "usefulLinks": "Useful Links",
      "about": "About Us",
      "realisations": "Achievements",
      "contact": "Contact",
      "contactUs": "Contact Us",
      "address": "Akwa, Douala, Cameroon",
      "phone": "+237 233 42 00 00",
      "email": "contact.douala@caap.cm",
      "copyright": "© 2024 CaapMedia. All rights reserved."
    },
    "roles": {
        "ADMIN": "Admin",
        "COMMERCIAL": "Sales Rep",
        "CAISSIER": "Cashier",
        "PURCHASING_MANAGER": "Purchasing Manager",
        "FINANCIAL_DIRECTOR": "Financial Director",
        "SECRETARY": "Secretary",
        "HR_MANAGER": "HR Manager",
        "PRODUCTION_DIRECTOR": "Production Director"
    },
    "sidebar": {
        "analytics": "Analytics",
        "sales": "Sales",
        "orders": "Orders",
        "purchasing": "Purchasing",
        "stockManagement": "Stock Management",
        "finance": "Finance & Management",
        "configuration": "Configuration",
        "aiAssistant": "AI Assistant",
        "mySales": "My Sales",
        "crm": "CRM",
        "contacts": "Contacts",
        "cashRegister": "Cash Register",
        "transactions": "Transactions",
        "myOrders": "My Orders",
        "productCatalog": "Product Catalog",
        "noViewForRole": "No views available for this role.",
        "collapse": "Collapse",
        "expand": "Expand",
        "hrManagement": "HR Management",
        "secretariat": "Secretariat",
        "production": "Production",
        "maintenance": "Maintenance",
        "equipements": "Equipment"
    },
    "header": {
        "profileUser": "{{role}} User",
        "language": "Language",
        "openMenu": "Open menu"
    },
    "login": {
        "title": "Login",
        "subtitle": "Access your dashboard.",
        "platformTitle": "Commercial Platform",
        "platformSubtitle": "Your partner for growth and distribution.",
        "subsidiary": "Subsidiary",
        "selectSubsidiary": "Select your subsidiary",
        "emailLabel": "Email address",
        "emailPlaceholder": "you@example.com",
        "passwordLabel": "Password",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot password?",
        "loginButton": "Sign in",
        "loggingIn": "Signing in...",
        "errorSelectSubsidiary": "Please select a subsidiary.",
        "errorFillFields": "Please fill in all fields.",
        "errorIncorrectCredentials": "Incorrect credentials. Please check your email and password.",
        "errorUserNotOnSubsidiary": "This user is not assigned to the selected subsidiary.",
        "forgotPasswordPrompt": "Please enter your email address to reset your password.",
        "forgotPasswordSuccess": "If an account with the email {{email}} exists, a reset link has been sent."
    },
    "forgotPassword": {
      "title": "Reset Password",
      "instruction": "Please enter your email address to receive a password reset link.",
      "sendLink": "Send Reset Link",
      "sending": "Sending...",
      "backToLogin": "Back to Login",
      "successMessage": "If an account with that email exists, we have sent a link to reset your password.",
      "errorMessage": "An error occurred while sending the reset link. Please try again."
    },
    "ecommerce": {
      "title": "Our Shop",
      "welcomeTitle": "Welcome to CaapMedia",
      "welcomeSubtitle": "Discover our quality products for all your needs.",
      "searchPlaceholder": "Search for a product...",
      "allCategories": "All Categories",
      "addToCart": "Add to Cart",
      "shoppingCart": "Shopping Cart",
      "emptyCart": "Your cart is empty.",
      "item": "item",
      "items": "items",
      "total": "Total",
      "checkout": "Checkout",
      "checkoutTitle": "Finalize Your Order",
      "customerInfo": "Your Information",
      "fullName": "Full Name",
      "email": "Email Address",
      "deliveryAddress": "Delivery Address",
      "confirmOrder": "Confirm Order",
      "orderSuccess": "Order placed successfully!",
      "backToHome": "Back to Home",
      "visitShop": "Visit the Shop",
      "employeeLogin": "Employee Login",
      "myAccount": "My Account",
      "customerLogin": "Customer Login",
      "createAccount": "Create Customer Account"
    },
    "customerAccount": {
        "login": "Login",
        "signup": "Sign Up",
        "loginTitle": "Glad to see you again!",
        "signupTitle": "Join Us",
        "email": "Email",
        "password": "Password",
        "confirmPassword": "Confirm Password",
        "name": "Full Name",
        "address": "Address",
        "loginAction": "Login",
        "signupAction": "Create My Account",
        "or": "Or",
        "myAccount": "My Account",
        "profile": "My Profile",
        "myOrders": "My Orders",
        "security": "Security",
        "paymentMethods": "Payment Methods",
        "myReviews": "My Reviews",
        "personalInfo": "Personal Information",
        "saveChanges": "Save Changes",
        "changePassword": "Change Password",
        "currentPassword": "Current Password",
        "newPassword": "New Password",
        "orderId": "Order ID",
        "date": "Date",
        "total": "Total",
        "status": "Status",
        "backToShop": "Back to Shop"
    },
    "analytics": {
        "title": "Analytics",
        "periodFilter": "Period",
        "tabs": {
            "dashboard": "Dashboard",
            "salesAnalysis": "Sales Analysis",
            "purchaseAnalysis": "Purchase Analysis",
            "banks": "Banks",
            "safe": "Safe"
        },
        "periods": {
            "seven_days": "Last 7 days",
            "thirty_days": "Last 30 days",
            "ninety_days": "Last 90 days",
            "year": "This year",
            "custom": "Custom period"
        },
        "comingSoon": "This feature is coming soon.",
        "dashboard": {
            "totalSalesMonth": "Total Sales (Period)",
            "netRevenue": "Net Revenue",
            "newCustomers": "New Customers (Period)",
            "stockValue": "Stock Value",
            "weeklySalesPerformance": "Sales Performance over Period",
            "stockDistributionByCategory": "Stock Distribution by Category",
            "chartSalesLabel": "Sales"
        },
        "startDate": "Start date",
        "endDate": "End date"
    },
    "salesAnalysis": {
        "totalRevenue": "Total Revenue",
        "orderCount": "Order Count",
        "cashSaleCount": "Cash Sales",
        "averageBasket": "Average Basket",
        "topProducts": "Top Selling Products",
        "salesByCategory": "Sales by Category",
        "topCustomers": "Top Customers",
        "product": "Product",
        "revenue": "Revenue",
        "quantity": "Quantity",
        "customer": "Customer",
        "totalSpent": "Total Amount Spent"
    },
    "purchaseAnalysis": {
      "totalPurchaseValue": "Total Purchase Value",
      "totalOrders": "Total Orders",
      "averageOrderValue": "Average Order Value",
      "spendingBySupplier": "Spending by Supplier",
      "purchasesOverTime": "Purchases Over Time",
      "topPurchasedProducts": "Top 5 Purchased Products",
      "totalValue": "Total Value",
      "chartPurchasesLabel": "Purchases"
    },
    "pnl": {
      "tabTitle": "P&L Statement",
      "title": "Profit and Loss Statement",
      "revenue": "Revenue (Sales ex. tax)",
      "cogs": "Cost of Goods Sold (COGS)",
      "grossProfit": "Gross Profit",
      "operatingExpenses": "Operating Expenses",
      "operatingIncome": "Operating Income",
      "tax": "Taxes (Estimate)",
      "netIncome": "Net Income",
      "thisMonth": "This Month",
      "lastMonth": "Last Month"
    },
    "sales": {
        "orderHistoryTitle": "Order History",
        "transactionHistoryTitle": "Transaction History",
        "saleId": "Sale ID",
        "product": "Product",
        "customer": "Customer",
        "date": "Date",
        "quantity": "Quantity",
        "totalPrice": "Total Price",
        "status": "Status",
        "statusPaid": "Paid",
        "statusPending": "Pending",
        "statusCancelled": "Cancelled",
        "recordPaymentModal": {
          "title": "Record a Payment",
          "amountToRecord": "Amount to record"
        },
        "updateStatusModal": {
          "title": "Update Order Status",
          "newStatus": "New Status"
        },
        "topSellingProducts": {
            "title": "Top Selling Products",
            "product": "Product",
            "quantity": "Quantity Sold",
            "revenue": "Total Revenue"
        },
        "paymentOverdue": "Payment overdue",
        "statusIssue": "Order cancelled",
        "validateForProduction": "Validate for Production"
    },
    "order": {
        "orderId": "Order ID",
        "customer": "Customer",
        "date": "Date",
        "total": "Total Amount",
        "status": "Status",
        "status_PENDING_VALIDATION": "Pending Validation",
        "status_NEW": "New",
        "status_IN_PRODUCTION": "In Production",
        "status_PENDING_DELIVERY": "Ready",
        "status_DELIVERED": "Delivered",
        "status_COMPLETED": "Completed",
        "status_CANCELLED": "Cancelled",
        "recordPayment": "Collect Payment",
        "paymentStatus": "Payment Status",
        "orderStatus": "Order Status",
        "amountPaid": "Amount Paid",
        "remainingBalance": "Remaining Balance",
        "updateStatus": "Update Status",
        "paymentStatus_UNPAID": "Unpaid",
        "paymentStatus_PARTIALLY_PAID": "Partially Paid",
        "paymentStatus_PAID": "Paid"
    },
    "production": {
        "title": "Production Tracking",
        "status_PREPRESS": "Pre-press",
        "status_PRINTING": "Printing",
        "status_FINISHING": "Finishing",
        "status_READY_FOR_DELIVERY": "Ready for Delivery"
    },
    "purchasing": {
        "title": "Purchase Management",
        "newOrder": "New Purchase Order",
        "poNumber": "PO Number",
        "supplier": "Supplier",
        "orderDate": "Order Date",
        "deliveryDate": "Expected Delivery",
        "total": "Total Amount",
        "status": "Reception Status",
        "receiveOrder": "Receive Order",
        "recordPayment": "Record Payment",
        "viewOrder": "View Order",
        "cancelOrder": "Cancel Order",
        "quantityReceived": "Received",
        "status_DRAFT": "Draft",
        "status_ORDERED": "Ordered",
        "status_PARTIALLY_RECEIVED": "Partially Received",
        "status_RECEIVED": "Received",
        "status_CANCELLED": "Cancelled",
        "paymentTerms": "Payment Terms",
        "terms_IMMEDIATE": "Immediate Payment",
        "terms_CREDIT": "Credit",
        "terms_DRAFT_PAYMENT": "Draft Payment",
        "paymentStatus": {
            "title": "Payment Status",
            "UNPAID": "Unpaid",
            "PARTIALLY_PAID": "Partially Paid",
            "PAID": "Paid"
        },
        "modal": {
            "addTitle": "Create New Purchase Order",
            "editTitle": "Edit Purchase Order",
            "detailsTitle": "Purchase Order Details"
        },
        "receiveItemsModal": {
            "title": "Receive Items",
            "ordered": "Ordered",
            "alreadyReceived": "Already Received",
            "quantityToReceive": "Quantity to Receive"
        },
        "paymentModal": {
            "title": "Record a Payment",
            "totalAmount": "Total Order Amount",
            "amountPaid": "Amount Already Paid",
            "remainingBalance": "Remaining Balance",
            "amountToPay": "Amount to Pay"
        },
         "history": {
            "title": "Order History"
        },
        "form": {
            "supplier": "Supplier",
            "selectSupplier": "Select a supplier",
            "orderDate": "Order Date",
            "deliveryDate": "Expected Delivery Date",
            "paymentTerms": "Payment Terms",
            "products": "Products",
            "addProduct": "Add Product",
            "product": "Product",
            "selectProduct": "Select a product",
            "quantity": "Quantity",
            "purchasePrice": "Unit Purchase Price",
            "total": "Total",
            "orderSummary": "Order Summary"
        }
    },
    "stock": {
        "title": "Stock Management",
        "searchPlaceholder": "Search by name, ID...",
        "productId": "Product ID",
        "name": "Name",
        "category": "Category",
        "description": "Description",
        "warehouse": "Warehouse",
        "currentStock": "Current Stock",
        "costPrice": "Cost Price",
        "sellingPrice": "Selling Price",
        "margin": "Margin",
        "range": "Range",
        "confirmPriceSaveTitle": "Confirm Save",
        "confirmPriceSaveMessage": "Do you want to save the new prices?",
        "available": "Available",
        "categories": {
            "pub": "Advertising",
            "carterie": "Business Cards",
            "packaging": "Packaging",
            "papeterie": "Stationery",
            "restoHotels": "Restaurant & Hotels",
            "impressionLivre": "Book Printing",
            "bachesBanderoles": "Tarps & Banners",
            "rollupKakemono": "Roll-ups & Kakemonos",
            "drapeauxOriflammes": "Flags & Oriflammes",
            "panneauxEnseignes": "Signs & Signage",
            "standsPlv": "Stands & POS",
            "textile": "Textile",
            "mugsGobeletsGourdes": "Mugs, Cups & Bottles",
            "sacsPersonnalises": "Custom Bags",
            "evenementiel": "Events",
            "mobilierPublicitaire": "Promotional Furniture",
            "ecritureBureau": "Writing & Office",
            "maisonDeco": "Home & Deco",
            "creationSitesWeb": "Website Creation & Management",
            "marketingDigital": "Digital Marketing & Ads",
            "reseauxSociaux": "Social Networks",
            "designIdentiteVisuelle": "Design & Visual Identity",
            "papiersCartons": "Papers & Cardboards",
            "encresChimiques": "Inks & Chemicals",
            "supportsBaches": "Substrates & Tarps",
            "finitionFaconnage": "Finishing & Shaping",
            "prestationsExternes": "External Services",
            "textilesRaw": "Textiles (Raw Material)"
        }
    },
    "productRange": {
        "popular": "Popular",
        "standard": "Standard",
        "premium": "Premium",
        "none": "None"
    },
    "aiMarketing": {
        "title": "AI Marketing Assistant",
        "subtitle": "Describe your product and let Gemini create marketing campaigns for you.",
        "productInfoLabel": "Product/Service Information",
        "productInfoPlaceholder": "e.g., 'Blond cane sugar, no additives, sold in 50kg bags for wholesalers and 1kg sachets for retailers.'",
        "errorPrompt": "Please describe your product or service.",
        "generateButton": "Generate Marketing Ideas",
        "generating": "Generating...",
        "suggestedCampaigns": "Suggested Campaigns Ideas",
        "geminiError": "Gemini API key is not configured. Please set it in environment variables to use this feature.",
        "geminiUnexpectedError": "Sorry, an unexpected error occurred with the AI assistant."
    },
    "cashRegister": {
        "title": "Cash Register Interface",
        "searchPlaceholder": "Search product by name...",
        "cartTitle": "Cart",
        "cartEmpty": "The cart is empty.",
        "paymentSuccess": "Payment successful!",
        "total": "Total",
        "paymentMethod": "Payment Method",
        "checkoutButton": "Checkout",
        "paymentMethods": {
            "cash": "Cash",
            "card": "Card",
            "check": "Check",
            "mobile": "Mobile"
        },
        "clientSection": {
          "title": "Customer",
          "selectAdd": "Select / Add Customer",
          "change": "Change",
          "modalTitle": "Select or Create a Customer",
          "selectTab": "Select Customer",
          "createTab": "Create New Customer",
          "searchClient": "Search for a customer..."
        },
        "findOrder": "Find an Order",
        "orderSelectionModal": {
          "title": "Select an Order",
          "searchPlaceholder": "Search by ID, name, phone..."
        },
        "loadedOrder": {
          "title": "Payment on Order",
          "orderId": "Order #",
          "total": "Order Total",
          "paid": "Already Paid",
          "remaining": "Remaining Balance",
          "amountToPay": "Amount to Pay",
          "newSale": "New Sale",
          "paymentSuccess": "Payment recorded successfully!"
        }
    },
    "myOrders": {
        "title": "My Orders",
        "historyTab": "History",
        "newOrderTab": "New Order",
        "noOrders": "You have no orders at the moment."
    },
    "newOrder": {
        "title": "Create a new order",
        "searchPlaceholder": "Search for a product...",
        "productCatalog": "Product Catalog",
        "product": "Product",
        "price": "Price",
        "quantity": "Qty",
        "addToCart": "Add",
        "orderSummary": "Your Order",
        "cartEmpty": "Your cart is empty.",
        "total": "Total",
        "submitOrder": "Place Order",
        "orderPlacedSuccess": "Order placed successfully!",
        "item": "Item",
        "subtotal": "Subtotal"
    },
    "bonDeLivraison": {
        "title": "Delivery Note",
        "orderNum": "Order #",
        "date": "Date",
        "billedTo": "Billed to",
        "item": "Item",
        "quantity": "Quantity",
        "unitPrice": "Unit Price",
        "totalPrice": "Total Price",
        "total": "Grand Total",
        "print": "Print Note",
        "exportPdf": "Export to PDF"
    },
    "invoice": {
        "title": "Invoice",
        "invoiceNum": "Invoice #",
        "billedTo": "Billed to",
        "date": "Date",
        "item": "Item",
        "quantity": "Quantity",
        "unitPrice": "Unit Price ex. tax",
        "totalPrice": "Total Price ex. tax",
        "total": "Grand Total",
        "viewInvoice": "View Invoice",
        "exportPdf": "Export to PDF",
        "phone": "Phone",
        "email": "Email",
        "ifu": "Tax ID",
        "rccm": "Trade Reg.",
        "paymentDueDate": "Payment Due Date",
        "subtotal": "Subtotal",
        "tax": "Tax",
        "totalTTC": "Total (incl. tax)",
        "paymentInfo": "Payment Information"
    },
    "finance": {
        "title": "Finance & Management",
        "creditManagement": "Credit Management",
        "treasury": "Treasury",
        "supplierDebts": "Supplier Debts",
        "expenses": "Expenses",
        "bilan": {
          "tabTitle": "Balance Sheet",
          "title": "Balance Sheet",
          "asOfDate": "As of",
          "assets": "Assets",
          "liabilitiesAndEquity": "Liabilities & Equity",
          "currentAssets": "Current Assets",
          "cash": "Cash & Cash Equivalents",
          "accountsReceivable": "Accounts Receivable",
          "inventory": "Inventory",
          "fixedAssets": "Fixed Assets",
          "equipment": "Property, Plant & Equipment",
          "totalAssets": "Total Assets",
          "liabilities": "Liabilities",
          "accountsPayable": "Accounts Payable",
          "equity": "Equity",
          "shareCapital": "Share Capital",
          "netIncome": "Retained Earnings (Net Income)",
          "totalLiabilitiesAndEquity": "Total Liabilities & Equity"
        }
    },
    "credit": {
        "totalReceivables": "Total Customer Receivables",
        "totalReceivablesDesc": "Total amount owed by customers.",
        "customerCreditTracking": "Customer Credit Tracking",
        "customerName": "Customer Name",
        "company": "Company",
        "lastPaymentDate": "Last Payment",
        "balanceDue": "Balance Due",
        "viewDetails": "View details",
        "recordPayment": "Record Payment"
    },
    "treasury": {
        "recentTransactions": "Recent Transactions",
        "addExpense": "Add Expense",
        "addIncome": "Add Income",
        "date": "Date",
        "description": "Description",
        "account": "Account",
        "type": "Type",
        "amount": "Amount",
        "status": "Status",
        "statusValidated": "Validated",
        "statusPending": "Pending",
        "typeIncome": "Income",
        "typeExpense": "Expense"
    },
    "supplierDebts": {
        "totalDebts": "Total Supplier Debts",
        "totalDebtsDesc": "Total amount owed to suppliers.",
        "trackingTitle": "Supplier Debt Tracking",
        "supplier": "Supplier",
        "invoiceId": "Invoice #",
        "dueDate": "Due Date",
        "amount": "Amount",
        "status": "Status",
        "statusToPay": "To Pay",
        "statusPaid": "Paid",
        "statusOverdue": "Overdue"
    },
    "expenses": {
        "title": "Expense Management",
        "addExpense": "Add Expense",
        "totalExpenses": "Total Expenses",
        "totalExpensesDesc": "Over the selected period",
        "table": {
          "date": "Date",
          "description": "Description",
          "category": "Category",
          "type": "Type",
          "amount": "Amount"
        },
        "types": {
          "FIXED": "Fixed",
          "VARIABLE": "Variable"
        },
        "categories": {
            "RENT": "Rent",
            "SALARIES": "Salaries",
            "ADVERTISING": "Advertising",
            "TRANSPORT": "Transport/Logistics",
            "SERVICES": "Services (IT, Accounting)",
            "INSURANCE": "Insurance",
            "PURCHASE_COST": "Purchase Cost",
            "COMMISSIONS": "Commissions",
            "PACKAGING": "Packaging",
            "TRANSACTION_FEES": "Transaction Fees",
            "OTHER": "Other"
        },
        "modal": {
            "addTitle": "Add New Expense",
            "editTitle": "Edit Expense",
            "deleteTitle": "Delete Expense"
        },
        "filter": {
            "category": "Category",
            "allCategories": "All categories",
            "type": "Type",
            "allTypes": "All types"
        }
    },
    "filter": {
        "client": "Client",
        "allClients": "All clients",
        "product": "Product",
        "allProducts": "All products",
        "status": "Status",
        "allStatuses": "All statuses",
        "reset": "Reset",
        "allTime": "All time",
        "noResults": "No orders found for the selected filters.",
        "noTransactions": "No transactions found for the selected filters.",
        "orderStatus": "Order Status",
        "paymentStatus": "Payment Status",
        "allOrderStatuses": "All Order Statuses",
        "allPaymentStatuses": "All Payment Statuses",
        "apply": "Apply"
    },
    "configuration": {
        "title": "General Configuration",
        "products": "Products",
        "users": "Users",
        "suppliers": "Suppliers",
        "taxes": "Taxes",
        "productManagement": "Product Management",
        "addProduct": "Add Product",
        "addTax": "Add Tax",
        "productId": "ID",
        "name": "Name",
        "category": "Category",
        "sellingPrice": "Selling Price",
        "stock": "Stock",
        "clientManagement": "Client Management",
        "addClient": "Add Client",
        "company": "Company",
        "email": "Email",
        "phone": "Phone",
        "userManagement": "User Management",
        "addUser": "Add User",
        "role": "Role",
        "supplierManagement": "Supplier Management",
        "addSupplier": "Add Supplier",
        "taxManagement": "Tax Management",
        "modal": {
            "editProductTitle": "Edit Product",
            "addProductTitle": "Add New Product",
            "editClientTitle": "Edit Client",
            "addClientTitle": "Add New Client",
            "editUserTitle": "Edit User",
            "addUserTitle": "Add New User",
            "editSupplierTitle": "Edit Supplier",
            "addSupplierTitle": "Add New Supplier",
            "deleteProductTitle": "Delete Product",
            "deleteClientTitle": "Delete Client",
            "deleteUserTitle": "Delete User",
            "deleteSupplierTitle": "Delete Supplier",
            "deleteEmployeeTitle": "Delete Employee",
            "deleteConfirmMessage": "Are you sure you want to delete {{itemName}}? This action cannot be undone.",
            "recordAttendanceTitle": "Signature for {{employeeName}}",
            "viewSignatureTitle": "Signature of {{name}}",
            "payrollSignatureTitle": "Signature for {{employeeName}}'s Payroll",
            "employeeDetailsTitle": "Employee Details",
            "addAbsenceTitle": "Record a New Absence",
            "editAbsenceTitle": "Edit an Absence",
            "deleteAbsenceTitle": "Delete an Absence",
            "editTaxTitle": "Edit Tax",
            "addTaxTitle": "Add New Tax",
            "deleteTaxTitle": "Delete Tax"
        },
        "form": {
            "name": "Name",
            "category": "Category",
            "description": "Description",
            "costPrice": "Cost Price",
            "sellingPrice": "Selling Price",
            "stock": "Stock",
            "warehouse": "Warehouse",
            "range": "Range",
            "company": "Company",
            "email": "Email",
            "phone": "Phone",
            "since": "Customer since",
            "role": "Role",
            "address": "Address",
            "formSection": {
                "personal": "Personal",
                "professional": "Professional",
                "salary": "Salary"
            },
            "firstName": "First Name",
            "lastName": "Last Name",
            "birthDate": "Birth Date",
            "gender": "Gender",
            "nationality": "Nationality",
            "ssn": "Social Security Number",
            "position": "Position",
            "department": "Department",
            "hireDate": "Hire Date",
            "contractType": "Contract Type",
            "employeeStatus": "Employee Status",
            "workLocation": "Work Location",
            "baseSalary": "Base Salary",
            "bonus": "Bonus",
            "benefits": "Benefits (comma-separated)",
            "paymentMethod": "Payment Method",
            "absenceType": "Absence Type",
            "startDate": "Start Date",
            "endDate": "End Date",
            "reason": "Reason",
            "document": "Justification Document",
            "uploadFile": "Upload a file",
            "generateWithAI": "Generate with AI",
            "rate": "Rate (%)",
            "isDefault": "Default Tax"
        }
    },
    "hr": {
        "title": "Human Resources Management",
        "tabs": {
            "employees": "Employees",
            "attendance": "Attendance",
            "payroll": "Payroll",
            "absences": "Absences"
        },
        "employees": {
            "title": "Employee Database",
            "add": "Add Employee",
            "id": "ID",
            "fullName": "Full Name",
            "position": "Position",
            "department": "Department",
            "contractType": "Contract",
            "status": "Status"
        },
        "attendance": {
            "title": "Attendance Management",
            "record": "Record Attendance",
            "employee": "Employee",
            "date": "Date",
            "status": "Status",
            "arrivalTime": "Arrival",
            "breakTime": "Break",
            "departureTime": "Departure",
            "signature": "Signature",
            "status_PRESENT": "Present",
            "status_ABSENT_JUSTIFIED": "Absent (J)",
            "status_ABSENT_UNJUSTIFIED": "Absent (UJ)",
            "status_HOLIDAY": "Holiday",
            "viewSignature": "View",
            "notSigned": "Not signed"
        },
        "payroll": {
            "title": "Payroll Management",
            "process": "Process this month's payroll",
            "employee": "Employee",
            "period": "Period",
            "netSalary": "Net Salary",
            "paymentDate": "Payment Date",
            "status": "Status",
            "signature": "Signature",
            "status_PENDING": "Pending",
            "status_PAID": "Paid",
            "sign": "Sign"
        },
        "modals": {
            "sign": {
                "title": "Signature for {{employeeName}}",
                "clear": "Clear",
                "save": "Save Signature"
            }
        },
        "gender": {
            "MALE": "Male",
            "FEMALE": "Female",
            "OTHER": "Other"
        },
        "contractType": {
            "CDI": "Permanent",
            "CDD": "Fixed-term",
            "FREELANCE": "Freelance",
            "INTERNSHIP": "Internship"
        },
        "employeeStatus": {
            "ACTIVE": "Active",
            "ON_LEAVE": "On Leave",
            "RESIGNED": "Resigned",
            "TERMINATED": "Terminated"
        },
        "paymentMethod": {
            "BANK_TRANSFER": "Bank Transfer",
            "CHECK": "Check",
            "CASH": "Cash"
        },
        "details": {
            "personalInfo": "Personal Information",
            "lastName": "Last Name",
            "firstName": "First Name",
            "birthDate": "Birth Date",
            "gender": "Gender",
            "nationality": "Nationality",
            "ssn": "Social Security Number",
            "phone": "Phone",
            "email": "Email",
            "address": "Address",
            "professionalInfo": "Professional Information",
            "position": "Position",
            "department": "Department",
            "hireDate": "Hire Date",
            "contractType": "Contract Type",
            "status": "Status",
            "workLocation": "Work Location",
            "manager": "Manager",
            "none": "None",
            "salaryInfo": "Salary Information",
            "baseSalary": "Base Salary",
            "bonus": "Bonus",
            "benefits": "Benefits",
            "paymentMethod": "Payment Method",
            "lastSalaryAdjustment": "Last Adjustment",
            "notApplicable": "N/A",
            "documents": "Administrative Documents",
            "contract": "Employment Contract",
            "idCard": "ID Card",
            "workPermit": "Work Permit",
            "diplomas": "Diplomas",
            "noDocument": "No document",
            "leaveInfo": "Leave Information",
            "leaveBalance": "Leave Balance"
        },
        "absences": {
            "title": "Absence Management",
            "add": "Record Absence",
            "table": {
                "employee": "Employee",
                "type": "Type",
                "startDate": "Start Date",
                "endDate": "End Date",
                "reason": "Reason",
                "document": "Document",
                "download": "Download",
                "noDocument": "None"
            }
        },
        "absenceType": {
            "JUSTIFIED": "Justified",
            "UNJUSTIFIED": "Unjustified"
        }
    },
    "secretariat": {
        "title": "Secretariat",
        "tabs": {
            "documents": "Documents",
            "meetings": "Meetings",
            "tasks": "Tasks"
        },
        "documents": {
            "title": "Document Management",
            "add": "Add Document",
            "table": {
                "name": "Document Name",
                "category": "Category",
                "uploadDate": "Upload Date",
                "status": "Status",
                "file": "File"
            },
            "categories": {
                "LEGAL": "Legal",
                "FINANCIAL": "Financial",
                "HR": "HR",
                "CONTRACT": "Contract",
                "OTHER": "Other"
            },
            "statuses": {
                "DRAFT": "Draft",
                "FINAL": "Final",
                "ARCHIVED": "Archived"
            },
            "modal": {
                "addTitle": "Add New Document",
                "editTitle": "Edit Document",
                "deleteTitle": "Delete Document"
            }
        },
        "meetings": {
            "title": "Meeting Tracking",
            "add": "Schedule Meeting",
            "table": {
                "title": "Title",
                "date": "Date & Time",
                "location": "Location",
                "participants": "Participants"
            },
            "modal": {
                "addTitle": "Schedule New Meeting",
                "editTitle": "Edit Meeting",
                "detailsTitle": "Meeting Details",
                "deleteTitle": "Cancel Meeting"
            },
            "details": {
                "agenda": "Agenda",
                "minutes": "Minutes",
                "noMinutes": "No minutes written."
            }
        },
        "tasks": {
            "title": "Task Management",
            "add": "Add Task",
            "table": {
                "title": "Task",
                "assignedTo": "Assigned To",
                "dueDate": "Due Date",
                "status": "Status"
            },
            "statuses": {
                "TODO": "To Do",
                "IN_PROGRESS": "In Progress",
                "DONE": "Done"
            },
            "modal": {
                "addTitle": "Create New Task",
                "editTitle": "Edit Task",
                "deleteTitle": "Delete Task"
            }
        }
    },
    "crm": {
        "title": "CRM",
        "tabs": {
            "dashboard": "Dashboard",
            "leads": "Leads",
            "accounts": "Accounts",
            "contacts": "Contacts",
            "deals": "Deals",
            "tasks": "Tasks",
            "pipeline": "Pipeline",
            "contracts": "Signed Contracts"
        },
        "tasks": {
            "title": "Task Management",
            "addTask": "Add Task",
            "filterByStatus": "Filter by status",
            "filterByDueDate": "Filter by due date",
            "allStatuses": "All statuses",
            "allDates": "All dates",
            "today": "Today",
            "thisWeek": "This week",
            "overdue": "Overdue",
            "status_TODO": "To Do",
            "status_IN_PROGRESS": "In Progress",
            "status_DONE": "Done",
            "relatedTo": "Related to",
            "assignedTo": "Assigned to",
            "dueDate": "Due date",
            "priority": "Priority",
            "priority_LOW": "Low",
            "priority_MEDIUM": "Medium",
            "priority_HIGH": "High",
            "filterByPriority": "Filter by priority",
            "allPriorities": "All priorities"
        },
        "taskModal": {
            "addTitle": "Add New Task",
            "editTitle": "Edit Task",
            "title": "Title",
            "description": "Description",
            "contact": "Contact",
            "selectContact": "Select a contact",
            "opportunity": "Opportunity (optional)",
            "selectOpportunity": "Select an opportunity",
            "noOpportunities": "No opportunities for this contact",
            "dueDate": "Due Date",
            "status": "Status",
            "assignedTo": "Assigned to"
        },
        "leads": {
            "title": "Lead Management",
            "add": "Add Lead",
            "convert": "Convert",
            "name": "Name",
            "company": "Company",
            "email": "Email",
            "phone": "Phone",
            "status": "Status",
            "status_NEW": "New",
            "status_CONTACTED": "Contacted",
            "status_QUALIFIED": "Qualified",
            "status_LOST": "Lost",
            "modal": {
                "addTitle": "Add New Lead",
                "editTitle": "Edit Lead",
                "deleteTitle": "Delete Lead"
            }
        },
        "accounts": {
            "title": "Account Management",
            "add": "Add Account",
            "name": "Account Name",
            "industry": "Industry",
            "phone": "Phone",
            "address": "Address",
            "modal": {
                "addTitle": "Add New Account",
                "editTitle": "Edit Account",
                "deleteTitle": "Delete Account"
            }
        },
        "activities": {
            "addTask": "Add Action",
            "selectTask": "Select an action",
            "contact": "Contact",
            "selectContact": "Select a contact",
            "dueDate": "Due Date",
            "overdue": "Overdue",
            "today": "Today",
            "upcoming": "Upcoming",
            "completed": "Completed",
            "noActivity": "No activity to display."
        },
        "taskTitles": {
            "follow_up_call": "Make a follow-up call",
            "send_quote": "Send a quote",
            "schedule_meeting": "Schedule a meeting",
            "follow_up_proposal": "Follow up on proposal",
            "send_documentation": "Send documentation",
            "check_in_email": "Send a check-in email"
        },
        "dashboard": {
            "pipelineValue": "Pipeline Value",
            "conversionRate": "Conversion Rate",
            "newOpportunities": "New Opportunities",
            "newWebOpportunities": "New Opportunities (Web)",
            "salesFunnel": "Sales Funnel",
            "myTasks": "My Tasks",
            "recentActivity": "Recent Activity"
        },
        "pipeline": {
            "addOpportunity": "Add Opportunity"
        },
        "opportunity": {
            "stages": {
                "QUALIFICATION": "Qualification",
                "PROPOSAL": "Proposal",
                "NEGOTIATION": "Negotiation",
                "WON": "Won",
                "LOST": "Lost"
            },
            "modal": {
                "addTitle": "Add New Opportunity",
                "editTitle": "Edit Opportunity",
                "deleteTitle": "Delete Opportunity"
            },
            "form": {
                "name": "Opportunity Name",
                "client": "Client/Prospect",
                "selectClient": "Select a client",
                "value": "Estimated Value",
                "stage": "Stage",
                "products": "Concerned Products",
                "selectProducts": "Select products",
                "closeDate": "Expected Close Date"
            }
        },
        "contacts": {
            "title": "Contact Management",
            "add": "Add Contact",
            "contact": "Contact",
            "company": "Company",
            "email": "Email",
            "phone": "Phone",
            "status": "Status",
            "contracts": "Signed Contracts",
            "opportunities": "Opportunities",
            "statuses": {
                "PROSPECT": "Prospect",
                "ACTIVE": "Active",
                "INACTIVE": "Inactive"
            },
            "details": {
                "title": "Contact Details",
                "info": "Information",
                "interactions": "Interactions",
                "logInteraction": "Log Interaction",
                "tasks": "Tasks",
                "opportunities": "Opportunities",
                "contracts": "Signed Contracts",
                "noInteractions": "No interactions logged."
            }
        },
        "contracts": {
            "title": "Signed Contract Management",
            "add": "Add Contract",
            "table": {
                "title": "Contract Title",
                "client": "Client",
                "startDate": "Start Date",
                "endDate": "End Date",
                "amount": "Amount",
                "status": "Status"
            },
            "status_DRAFT": "Draft",
            "status_ACTIVE": "Active",
            "status_EXPIRED": "Expired",
            "status_CANCELLED": "Cancelled",
            "modal": {
                "addTitle": "Add New Contract",
                "editTitle": "Edit Contract",
                "deleteTitle": "Delete Contract"
            }
        }
    },
    "interactions": {
        "types": {
            "CALL": "Call",
            "EMAIL": "Email",
            "MEETING": "Meeting",
            "OTHER": "Other"
        },
        "form": {
            "type": "Interaction Type",
            "notes": "Notes",
            "notesPlaceholder": "Enter interaction details...",
            "log": "Log"
        }
    },
    "product": {
        "generationFailed": "Generation failed. Please try again.",
        "serviceUnavailable": "The AI service is currently unavailable.",
        "noImageGenerated": "No image was generated. Try a different prompt.",
        "descriptionGenerationError": "Description generation failed. Please try again.",
        "imageGenerationNoImage": "No image was generated. Try a different description.",
        "imageGenerationError": "Image generation failed. The service may be unavailable."
    },
    "calculator": {
        "title": "Price Calculator",
        "configure": "Configure",
        "format": "Format",
        "grammage": "Paper Weight",
        "printSide": "Printing",
        "lamination": "Lamination",
        "quantity": "Quantity",
        "unitPrice": "Unit price",
        "totalPrice": "Total price",
        "addToCart": "Add to Cart",
        "size": "Size",
        "color": "Color",
        "material": "Material",
        "dimension": "Dimension",
        "binding": "Binding",
        "folding": "Folding",
        "corners": "Corners",
        "rounded": "Rounded",
        "square": "Square",
        "eyelets": "Eyelets",
        "yes": "Yes",
        "no": "No",
        "pages": "Pages",
        "handles": "Handles",
        "flat": "Flat",
        "twisted": "Twisted",
        "stub": "Detachable Stub",
        "numbering": "Numbering",
        "uploadFile": "Upload your file",
        "dragAndDrop": "Drag & drop or click to select",
        "fileUploaded": "File uploaded:",
        "removeFile": "Remove"
    },
    "maintenance": {
        "title": "Maintenance Management",
        "addEquipment": "Add Equipment",
        "equipmentName": "Equipment Name",
        "status": "Status",
        "lastMaintenance": "Last Maintenance",
        "nextMaintenance": "Next Maintenance",
        "history": "History",
        "logMaintenance": "Log Maintenance",
        "status_OPERATIONAL": "Operational",
        "status_NEEDS_MAINTENANCE": "Needs Maintenance",
        "status_OUT_OF_SERVICE": "Out of Service",
        "modal": {
            "addTitle": "Add Equipment",
            "editTitle": "Edit Equipment",
            "deleteTitle": "Delete Equipment",
            "logTitle": "Maintenance History for {{name}}",
            "addLogTitle": "Add an Intervention"
        },
        "form": {
            "name": "Equipment Name",
            "status": "Status",
            "lastMaintenanceDate": "Last Maintenance Date",
            "nextMaintenanceDate": "Next Maintenance Date",
            "technician": "Technician",
            "description": "Intervention Description",
            "cost": "Cost (XOF)",
            "acquisitionDate": "Acquisition Date",
            "acquisitionValue": "Acquisition Value"
        }
    },
    "equipements": {
        "title": "Equipment & Assets",
        "listTitle": "Equipment List",
        "acquisitionDate": "Acquisition Date",
        "acquisitionValue": "Acquisition Value"
    }
};

const translations: { [key: string]: Translations } = {
  fr: frTranslations,
  en: enTranslations,
};

const I18nContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: { [key: string]: any }) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (amount: number, options?: Intl.NumberFormatOptions) => string;
}>({
  language: 'fr',
  setLanguage: () => {},
  t: (key: string) => key,
  formatCurrency: (amount: number) => String(amount),
  formatNumber: (amount: number) => String(amount),
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState('fr');

    const t = useCallback((key: string, params?: { [key: string]: any }) => {
        const keys = key.split('.');
        let value: any = translations[language] || translations['fr'];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Key not found
            }
        }
        if (typeof value === 'string' && params) {
            return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
                return acc.replace(`{{${paramKey}}}`, paramValue);
            }, value);
        }
        return typeof value === 'string' ? value : key;
    }, [language]);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: 'XOF', // CFA Franc
            minimumFractionDigits: 0,
        }).format(amount);
    }, [language]);

    const formatNumber = useCallback((amount: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', options).format(amount);
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, formatCurrency, formatNumber }}>
            {children}
        </I18nContext.Provider>
    );
};
