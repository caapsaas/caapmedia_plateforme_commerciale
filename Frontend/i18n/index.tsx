import React, { createContext, useState, useContext, useCallback } from 'react';

// To bypass module resolution issues with JSON files in some environments,
// the translations are embedded directly into the code. This is a robust
// approach that guarantees the translations are always available.
const frTranslations = {
  "common": {
    "search": "Rechercher",
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
    "exportPdf": "Exporter en PDF",
    "send": "Envoyer",
    "notAvailable": "Non défini",
    "create": "Créer",
    "update": "Mettre à jour",
    "saving": "Enregistrement...",
    "accessDenied": "Accès refusé"
  },
  "contactModal": {
    "title": "Contactez-nous",
    "subtitle": "Une question ? Un projet ? L'équipe CaapMedia est là pour vous.",
    "name": "Nom complet",
    "email": "Adresse e-mail",
    "phone": "Téléphone",
    "subject": "Sujet",
    "message": "Votre message",
    "send": "Envoyer",
    "sending": "Envoi en cours...",
    "successTitle": "Message envoyé !",
    "successMessage": "Merci de nous avoir contactés. Notre équipe reviendra vers vous dans les plus brefs délais.",
    "securityNote": "Vos informations sont sécurisées et ne seront jamais partagées."
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
    "success": "Paiement réussi !",
    "CASH": "Espèces",
    "CARD": "Carte",
    "CHECK": "Chèque",
    "MOBILE_MONEY": "Mobile Money",
    "WAVE": "Wave",
    "ORANGE_MONEY": "Orange Money",
    "PAYCAAP": "PayCaap",
    "PAY_ON_DELIVERY": "Paiement à la livraison",
    "CUSTOMER_CREDIT": "Crédit Client (30 jours)"
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
    "phone": "+237 6 75 86 43 54 & +237 6 73 42 35 04",
    "email": "contact@caapmedia.com",
    "copyright": "© 2024 CaapMedia. Tous droits réservés."
  },
  "roles": {
    "SUPER_ADMIN": "Super Administrateur",
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
    "forgotPasswordSuccess": "Si un compte avec l'email {{email}} existe, un lien de réinitialisation a été envoyé.",
    "twoFactor": {
      "title": "Vérification en deux étapes",
      "subtitle": "Entrez le code de votre application d'authentification.",
      "codeLabel": "Code de vérification",
      "recoveryCodeLabel": "Code de secours",
      "recoveryCodePlaceholder": "xxxxxxxxxx",
      "verifyButton": "Vérifier",
      "useRecoveryCodeInstead": "Utiliser un code de secours",
      "useCodeInstead": "Utiliser le code de l'application",
      "errorInvalidCode": "Code invalide."
    }
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
  "security": {
    "title": "Sécurité du compte",
    "twoFactor": {
      "title": "Double authentification",
      "description": "Ajoutez une couche de sécurité supplémentaire à votre compte avec une application d'authentification.",
      "statusEnabled": "Activée",
      "statusDisabled": "Désactivée",
      "enableButton": "Activer la double authentification",
      "disableButton": "Désactiver la double authentification",
      "scanInstruction": "Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy...), puis entrez le code généré pour confirmer.",
      "manualEntryLabel": "Ou saisissez ce code manuellement :",
      "confirmCodeLabel": "Code de vérification",
      "confirmButton": "Confirmer et activer",
      "recoveryCodesWarning": "Notez ces codes de secours dans un endroit sûr. Chacun ne peut être utilisé qu'une seule fois pour vous connecter si vous perdez l'accès à votre application d'authentification. Ils ne seront plus jamais affichés.",
      "recoveryCodesSavedButton": "J'ai sauvegardé mes codes de secours",
      "errorInvalidCode": "Code invalide.",
      "errorGeneric": "Une erreur est survenue. Veuillez réessayer."
    }
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
    "orderViaWhatsApp": "Commander via WhatsApp",
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
  "paymentMethods": {
    "BANK_TRANSFER": "Virement bancaire",
    "CHECK": "Chèque",
    "CASH": "Espèces"
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
    "endDate": "Date de fin",
    "allSubsidiaries": "Toutes les filiales"
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
    "status_READY_FOR_DELIVERY": "Prêt pour Livraison",
    "equipmentCosts": {
      "title": "Coût horaire par machine",
      "subtitle": "Définissez le taux horaire de chaque équipement. Ces taux sont utilisés pour calculer le coût de production des commandes de services.",
      "allSubsidiaries": "Toutes les filiales",
      "colMachine": "Machine",
      "colStatus": "Statut",
      "colSubsidiary": "Filiale",
      "colHourlyRate": "Taux horaire (F CFA/h)",
      "colAction": "Action",
      "notConfigured": "Non configuré",
      "noEquipment": "Aucun équipement trouvé.",
      "saveError": "Erreur lors de la sauvegarde.",
      "invalidRate": "Taux horaire invalide.",
      "configure": "Configurer",
      "modify": "Modifier"
    },
    "commercialParams": {
      "title": "Paramètres commerciaux globaux",
      "subtitle": "Définissez la plage de marge autorisée pour les devis de services. Le commercial doit saisir un pourcentage de marge dans cette plage lors de la création d'une commande.",
      "notConfigured": "Aucun paramètre configuré. Définissez les marges pour activer le module de coût de production.",
      "minMargin": "Marge minimale (%)",
      "maxMargin": "Marge maximale (%)",
      "rangeHint": "Le commercial devra saisir une marge entre {{min}}% et {{max}}%.",
      "saveError": "Erreur lors de la sauvegarde.",
      "invalidValues": "Valeurs invalides.",
      "outOfRange": "Les marges doivent être entre 0% et 100%.",
      "minGtMax": "La marge minimale doit être inférieure à la marge maximale.",
      "success": "Paramètres enregistrés avec succès.",
      "create": "Créer",
      "update": "Mettre à jour",
      "lastModified": "Dernière modification : {{date}}"
    },
    "workflows": {
      "title": "Workflows de production",
      "subtitle": "Définissez les séquences de machines pour chaque service. Le commercial les retrouve pré-remplies lors d'une nouvelle commande.",
      "newWorkflow": "Nouveau workflow",
      "allSubsidiaries": "Toutes les filiales",
      "noWorkflow": "Aucun workflow défini.",
      "active": "Actif",
      "inactive": "Inactif",
      "linkedService": "Service lié : {{name}}",
      "noSteps": "Aucune étape",
      "form": {
        "createTitle": "Nouveau workflow",
        "editTitle": "Modifier le workflow",
        "name": "Nom",
        "namePlaceholder": "ex. Impression offset standard",
        "description": "Description",
        "linkedService": "Service lié (optionnel)",
        "noLinkedService": "— Aucun service lié —",
        "isActive": "Workflow actif",
        "steps": "Étapes (machines)",
        "addStep": "Ajouter",
        "chooseEquipment": "— Choisir une machine —",
        "noStepsDefined": "Cliquez sur \"Ajouter\" pour définir des étapes.",
        "nameRequired": "Le nom est requis.",
        "equipmentRequired": "Chaque étape doit avoir une machine sélectionnée.",
        "createError": "Erreur lors de la création.",
        "editError": "Erreur lors de la modification.",
        "update": "Mettre à jour"
      },
      "deleteConfirm": {
        "title": "Supprimer le workflow",
        "message": "Cette action est irréversible. Les commandes existantes ne seront pas affectées."
      }
    },
    "costModal": {
      "title": "Coût de production",
      "prefilledWorkflow": "Workflow pré-rempli : {{name}}",
      "stepsTitle": "Étapes de production",
      "addMachine": "Ajouter une machine",
      "noSteps": "Aucune étape. Ajoutez une machine ou sélectionnez un service avec un workflow.",
      "chooseMachine": "— Machine —",
      "hoursPlaceholder": "Heures",
      "totalCost": "Coût total de production",
      "margin": "Marge (%) *",
      "marginRange": "Plage autorisée : {{min}}% – {{max}}%",
      "finalPrice": "Prix final (= prix de la ligne)",
      "priceNote": "Ce montant sera appliqué comme prix unitaire sur la ligne de commande.",
      "confirmButton": "Confirmer le coût",
      "noStepsError": "Ajoutez au moins une étape de production.",
      "noEquipmentError": "Chaque étape doit avoir une machine sélectionnée.",
      "invalidTimeError": "Saisissez un temps valide (> 0) pour chaque étape.",
      "noMarginError": "Saisissez un pourcentage de marge.",
      "marginRangeError": "La marge doit être entre {{min}}% et {{max}}%."
    }
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
      "unit": "Unité",
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
      "purchaseUnit": "Unité d'achat",
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
    "belowThreshold": "Sous le seuil minimum",
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
  "stockMovements": {
    "title": "Mouvements de stock",
    "allTypes": "Tous les types",
    "date": "Date",
    "product": "Produit",
    "type": "Type",
    "direction": "Sens",
    "quantity": "Quantité",
    "reason": "Motif",
    "in": "Entrée",
    "out": "Sortie",
    "empty": "Aucun mouvement enregistré pour l'instant.",
    "tabs": {
      "levels": "Niveau de stock",
      "movements": "Mouvements",
      "inventory": "Inventaire"
    },
    "types": {
      "PURCHASE_RECEIPT": "Réception d'achat",
      "CUSTOMER_RETURN": "Retour client",
      "POSITIVE_ADJUSTMENT": "Ajustement positif",
      "TRANSFER_IN": "Transfert entrant",
      "PRODUCTION_CONSUMPTION": "Consommation production",
      "LOSS": "Perte",
      "BREAKAGE": "Casse",
      "INTERNAL_CONSUMPTION": "Consommation interne",
      "NEGATIVE_ADJUSTMENT": "Ajustement négatif",
      "SUPPLIER_RETURN": "Retour fournisseur",
      "TRANSFER_OUT": "Transfert sortant"
    },
    "inventory": {
      "title": "Inventaire",
      "subtitle": "Saisissez le stock réellement compté — l'écart est calculé et enregistré automatiquement.",
      "product": "Produit",
      "selectProduct": "Sélectionner un produit...",
      "theoreticalStock": "Stock théorique",
      "countedStock": "Stock compté",
      "reason": "Motif (optionnel)",
      "submit": "Valider l'inventaire",
      "successTitle": "Inventaire enregistré",
      "successMessage": "Le stock a été mis à jour.",
      "noDeviation": "Aucun écart constaté — pas de mouvement créé.",
      "deviationRecorded": "Écart de {{delta}} enregistré."
    },
    "withdraw": {
      "title": "Prélever les matières",
      "subtitle": "Saisissez les quantités réellement utilisées pour cette commande.",
      "addLine": "Ajouter une ligne",
      "product": "Produit",
      "quantity": "Quantité",
      "submit": "Valider le prélèvement",
      "successTitle": "Matières prélevées",
      "successMessage": "Le stock a été mis à jour.",
      "empty": "Ajoutez au moins une matière à prélever."
    },
    "manual": {
      "newMovement": "Nouveau mouvement",
      "title": "Nouveau mouvement de stock",
      "subtitle": "Retour client, transfert, perte, casse, consommation interne ou retour fournisseur.",
      "product": "Produit",
      "selectProduct": "Sélectionner un produit...",
      "submit": "Enregistrer le mouvement",
      "successTitle": "Mouvement enregistré",
      "successMessage": "Le stock a été mis à jour."
    }
  },
  "productRange": {
    "popular": "Populaire",
    "standard": "Standard",
    "premium": "Premium",
    "none": "Aucune"
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
      "mobile": "Mobile",
      "BANK_TRANSFER": "Virement bancaire",
      "CHECK": "Chèque",
      "CASH": "Espèces"
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
    "createAndSelect": "Créer et Sélectionner",
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
    "subtotal": "Sous-total",
    "discount": "Remise (FCFA)",
    "searchClientOtherSubsidiary": "Chercher un client d'une autre filiale...",
    "paymentMethod": "Méthode de paiement",
    "paymentMethod_PAY_ON_DELIVERY": "Paiement à la livraison",
    "paymentMethod_CARD": "Carte bancaire",
    "paymentMethod_ORANGE_MONEY": "Orange Money",
    "paymentMethod_WAVE": "Wave",
    "paymentMethod_MOBILE_MONEY": "Mobile Money",
    "paymentMethod_PAYCAAP": "PayCaap",
    "paymentMethod_CUSTOMER_CREDIT": "Crédit client"
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
    "prefinancement": "Préfinancement",
    "supplierDebts": "Dettes Fournisseurs",
    "expenses": "Charges",
    "externalTransactions": "Transactions Externes",
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
      "longTermDebts": "Dettes à Long Terme",
      "equity": "Capitaux Propres",
      "shareCapital": "Capital Social",
      "netIncome": "Résultat Net de l'exercice",
      "retainedEarnings": "Résultats Cumulés",
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
    "typeExpense": "Dépense",
    "confirmDelete": "Supprimer la transaction",
    "confirmDeleteMessage": "Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.",
    "validate": "Valider",
    "reject": "Rejeter",
    "confirmValidate": "Valider la transaction",
    "confirmReject": "Rejeter la transaction",
    "noCreatePermission": "Seul le Directeur Financier peut créer des transactions",
    "modal": {
      "addIncome": "Ajouter une nouvelle recette",
      "addExpense": "Ajouter une nouvelle dépense"
    }
  },
  "treasuryAccounts": {
    "title": "Comptes de trésorerie",
    "description": "Gérez les comptes bancaires et de trésorerie de votre entreprise",
    "accessDenied": "Vous n'avez pas les permissions pour gérer les comptes de trésorerie",
    "noData": "Aucun compte de trésorerie trouvé",
    "stats": {
      "totalAccounts": "Total des comptes",
      "totalBalance": "Solde total",
      "averageBalance": "Solde moyen"
    },
    "table": {
      "accountName": "Nom du compte",
      "balance": "Solde",
      "currency": "Devise",
      "actions": "Actions"
    },
    "actions": {
      "create": "Créer un compte",
      "edit": "Modifier",
      "delete": "Supprimer"
    },
    "create": {
      "title": "Créer un compte de trésorerie"
    },
    "edit": {
      "title": "Modifier le compte de trésorerie"
    },
    "form": {
      "accountName": "Nom du compte",
      "accountNamePlaceholder": "Ex: Compte principal BNP",
      "balance": "Solde initial",
      "currency": "Devise",
      "accountType": "Type de compte",
      "subsidiary": "Filiale"
    },
    "accountTypes": {
      "bank": "Banque",
      "cash": "Caisse",
      "prefinancement": "Compte de préfinancement"
    },
    "validation": {
      "accountNameRequired": "Le nom du compte est requis",
      "validBalance": "Veuillez entrer un solde valide"
    },
    "confirm": {
      "delete": "Êtes-vous sûr de vouloir supprimer ce compte de trésorerie ?",
      "deleteWithBalance": "ATTENTION : Le compte '{{accountName}}' a un solde de {{balance}}. Êtes-vous sûr de vouloir le supprimer ? Cette action est irréversible.",
      "forceDelete": "Le serveur a refusé la suppression du compte '{{accountName}}' (solde: {{balance}}). Voulez-vous forcer la suppression malgré tout ?"
    },
    "success": {
      "created": "Compte de trésorerie créé avec succès",
      "updated": "Compte de trésorerie mis à jour avec succès",
      "deleted": "Compte de trésorerie supprimé avec succès"
    },
    "error": {
      "loading": "Erreur lors du chargement des comptes de trésorerie",
      "create": "Erreur lors de la création du compte de trésorerie",
      "update": "Erreur lors de la mise à jour du compte de trésorerie",
      "delete": "Erreur lors de la suppression du compte de trésorerie",
      "deleteNonZeroBalance": "Impossible de supprimer le compte '{{accountName}}' car son solde est de {{balance}}. Veuillez d'abord ramener le solde à zéro.",
      "deleteWithTransactions": "Impossible de supprimer ce compte car il contient des transactions financières.",
      "cannotDeleteNonZero": "Suppression impossible : solde de {{balance}}",
      "forceDeleteFailed": "La suppression forcée a échoué. Le serveur refuse toujours de supprimer ce compte."
    }
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
  "externalTransactions": {
    "title": "Transactions Externes",
    "noData": "Aucune transaction externe trouvée",
    "error": {
      "loading": "Erreur lors du chargement des transactions externes",
      "create": "Erreur lors de la création de la transaction",
      "update": "Erreur lors de la mise à jour de la transaction",
      "validate": "Erreur lors de la validation de la transaction",
      "cancel": "Erreur lors de l'annulation de la transaction",
      "delete": "Erreur lors de la suppression de la transaction"
    },
    "success": {
      "created": "Transaction créée avec succès",
      "updated": "Transaction mise à jour avec succès",
      "validated": "Transaction validée avec succès",
      "cancelled": "Transaction annulée avec succès",
      "deleted": "Transaction supprimée avec succès",
      "exported": "Données exportées avec succès"
    },
    "confirm": {
      "delete": "Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible."
    },
    "stats": {
      "total": "Total des transactions",
      "totalAmount": "Montant total",
      "validated": "Transactions validées",
      "pending": "Transactions en attente",
      "summary": "Résumé",
      "totalIncome": "Total des recettes",
      "totalExpenses": "Total des dépenses",
      "netAmount": "Montant net"
    },
    "filters": {
      "allTypes": "Tous les types",
      "allStatus": "Tous les statuts",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "search": "Rechercher..."
    },
    "actions": {
      "create": "Nouvelle transaction",
      "validate": "Valider",
      "cancel": "Annuler",
      "exportCSV": "Exporter CSV",
      "exportPDF": "Exporter PDF",
      "document": "Voir document"
    },
    "table": {
      "date": "Date",
      "description": "Description",
      "amount": "Montant",
      "type": "Type",
      "category": "Catégorie",
      "status": "Statut",
      "actions": "Actions",
      "reference": "Référence"
    },
    "create": {
      "title": "Créer une transaction externe"
    },
    "edit": {
      "title": "Modifier la transaction externe"
    },
    "form": {
      "date": "Date de transaction",
      "description": "Description",
      "amount": "Montant",
      "type": "Type de transaction",
      "category": "Catégorie",
      "paymentMethod": "Méthode de paiement",
      "referenceNumber": "Numéro de référence",
      "document": "Document",
      "documentUrl": "URL du document"
    },
    "types": {
      "INVESTMENT": "Investissement",
      "INVESTMENT_RETURN": "Retour sur investissement",
      "LOAN": "Prêt",
      "DONATION": "Don",
      "PERSONAL_EXPENSE": "Dépense personnelle",
      "PERSONAL_INCOME": "Revenu personnel",
      "TAX_REFUND": "Remboursement d'impôt",
      "INSURANCE_PAYOUT": "Indemnité d'assurance",
      "LEGAL_SETTLEMENT": "Règlement judiciaire",
      "TRANSFER_PDG": "Transfert PDG",
      "OTHER_FINANCIAL": "Autre transaction financière"
    },
    "categories": {
      "REAL_ESTATE": "Immobilier",
      "VEHICLE": "Véhicule",
      "EQUIPMENT": "Équipement",
      "EDUCATION": "Éducation",
      "HEALTH": "Santé",
      "TRAVEL": "Voyage",
      "ENTERTAINMENT": "Loisirs",
      "PERSONAL_SAVINGS": "Épargne personnelle",
      "FAMILY_SUPPORT": "Soutien familial",
      "CHARITY": "Carité",
      "INVESTMENT_RETURN": "Retour sur investissement",
      "TAX_REFUND": "Remboursement d'impôt",
      "INSURANCE_PAYOUT": "Indemnité d'assurance",
      "LEGAL_SETTLEMENT": "Règlement judiciaire",
      "TRANSFER_PDG": "Transfert PDG",
      "OTHER": "Autre"
    },
    "status": {
      "DRAFT": "Brouillon",
      "VALIDATED": "Validé",
      "CANCELLED": "Annulé"
    },
    "notifications": {
      "created": {
        "title": "Nouvelle Transaction Externe Créée",
        "message": "{{creator}} a créé une nouvelle transaction externe : {{description}} pour {{amount}}"
      },
      "updated": {
        "title": "Transaction Externe Modifiée",
        "message": "{{creator}} a modifié la transaction externe : {{description}} pour {{amount}}"
      },
      "validated": {
        "title": "Transaction Externe Validée",
        "message": "{{creator}} a validé la transaction externe : {{description}} pour {{amount}}"
      },
      "cancelled": {
        "title": "Transaction Externe Annulée",
        "message": "{{creator}} a annulé la transaction externe : {{description}} pour {{amount}}"
      },
      "deleted": {
        "title": "Transaction Externe Supprimée",
        "message": "{{creator}} a supprimé la transaction externe : {{description}} pour {{amount}}"
      }
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
    "units": "Unités",
    "unitsManagement": {
      "title": "Unités de mesure",
      "subtitle": "Référentiel partagé — unité de base et unités d'emballage des produits de stock.",
      "addNew": "Nouvelle unité",
      "name": "Nom",
      "namePlaceholder": "Feuille",
      "symbol": "Symbole (optionnel)",
      "symbolPlaceholder": "u",
      "create": "Créer",
      "save": "Enregistrer",
      "cancel": "Annuler",
      "empty": "Aucune unité créée pour l'instant.",
      "createError": "Impossible de créer l'unité (nom déjà utilisé ?).",
      "deleteError": "Cette unité est utilisée par au moins un produit de stock."
    },
    "services": "Services",
    "addService": "Ajouter un service",
    "referenceLists": "Référentiels",
    "users": "Utilisateurs",
    "suppliers": "Fournisseurs",
    "taxes": "Taxes",
    "treasury": "Trésorerie",
    "productManagement": "Gestion des Produits",
    "addProduct": "Ajouter un produit",
    "addTax": "Ajouter une taxe",
    "productId": "ID",
    "name": "Nom",
    "category": "Catégorie",
    "sellingPrice": "Prix de vente",
    "stock": "Stock",
    "clientManagement": "Clients",
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
    "equipmentCosts": "Coûts machines",
    "commercialParams": "Params commerciaux",
    "productionWorkflows": "Workflows",
    "catalogue": "Catalogue",
    "production": "Production",
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
      "editEmployeeTitle": "Modifier l'employé",
      "addEmployeeTitle": "Ajouter un employé",
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
      "deleteTaxTitle": "Supprimer la taxe",
      "editServiceTitle": "Modifier le service",
      "addServiceTitle": "Ajouter un service",
      "deleteServiceTitle": "Supprimer le service"
    },
    "serviceForm": {
      "name": "Nom",
      "category": "Catégorie",
      "range": "Gamme",
      "description": "Description",
      "generateWithAI": "Générer avec l'IA",
      "isActive": "Actif",
      "isVisibleOnSite": "Visible sur le site vitrine",
      "displayOrder": "Ordre d'affichage",
      "images": "Images",
      "maxImages": "max {{count}}",
      "imageTooLarge": "L'image dépasse la taille maximale de 5 Mo",
      "removeImage": "Supprimer l'image",
      "acceptedFormats": "Formats acceptés : JPG, PNG, GIF, WEBP • Taille max : 5 Mo"
    },
    "builder": {
      "back": "Retour aux services",
      "configureFields": "Configurer les champs"
    },
    "form": {
      "name": "Nom",
      "category": "Catégorie",
      "description": "Description",
      "passwordRequired": "Le mot de passe est requis pour un nouvel utilisateur.",
      "passwordsDoNotMatch": "Les mots de passe ne correspondent pas.",
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
        "personal": "Informations personnelles",
        "professional": "Informations professionnelles",
        "salary": "Salaire et avantages",
        "documents": "Documents",
        "leaves": "Congés"
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
      "isDefault": "Taxe par défaut",
      "minThreshold": "Seuil minimum",
      "baseUnit": "Unité de base",
      "selectUnit": "Sélectionner une unité...",
      "packagingUnits": "Unités d'emballage",
      "packagingUnitsHelp": "Unités d'achat (ex. Rame, Carton) et leur équivalence en unité de base.",
      "conversionFactor": "Facteur de conversion"
    }
  },
  "specBuilder": {
    "fieldTypes": {
      "TEXT": "Texte", "TEXTAREA": "Texte long", "NUMBER": "Nombre", "DECIMAL": "Nombre décimal",
      "AMOUNT": "Montant", "SELECT": "Liste déroulante", "MULTISELECT": "Sélection multiple",
      "RADIO": "Boutons radio", "CHECKBOX": "Case à cocher", "BOOLEAN": "Oui / Non", "DATE": "Date",
      "TIME": "Heure", "COLOR": "Couleur", "UPLOAD": "Upload", "URL": "URL", "EMAIL": "Email",
      "PHONE": "Téléphone", "DIMENSIONS": "Dimensions (Largeur × Hauteur)"
    },
    "card": {
      "required": "Obligatoire",
      "reorder": "Réordonner"
    },
    "drawer": {
      "editTitle": "Modifier la spécification",
      "addTitle": "Nouvelle spécification",
      "nameRequired": "Le nom est requis",
      "technicalKeyRequired": "La clé technique est requise",
      "technicalKeyPattern": "snake_case requis (ex: paper_weight)",
      "fieldRequired": "Requis",
      "name": "Nom",
      "technicalKey": "Clé technique",
      "technicalKeyPlaceholder": "ex: paper_weight",
      "type": "Type",
      "group": "Groupe",
      "noGroup": "Aucun groupe",
      "helpText": "Texte d'aide",
      "placeholder": "Placeholder",
      "unit": "Unité (mm, cm, g, kg, pages...)",
      "internalDescription": "Description interne",
      "required": "Obligatoire",
      "visibleToClient": "Visible client",
      "visibleToProduction": "Visible production",
      "editableAfterValidation": "Modifiable après validation",
      "searchable": "Utilisable dans les recherches",
      "possibleValues": "Valeurs possibles",
      "optionsSourceInline": "Saisies ici",
      "optionsSourceReference": "Référentiel partagé",
      "selectReferenceList": "Sélectionner un référentiel...",
      "optionValuePlaceholder": "Valeur (ex: A4)",
      "optionLabelPlaceholder": "Libellé affiché",
      "addOption": "Ajouter une valeur",
      "uploadConfigTitle": "Configuration de l'upload",
      "uploadExtensions": "Extensions autorisées (séparées par virgule)",
      "uploadExtensionsPlaceholder": "PDF, AI, PSD, CDR",
      "uploadMaxSize": "Taille max (Mo)",
      "uploadMaxFiles": "Nombre de fichiers max",
      "dimensionsConfigTitle": "Bornes des dimensions",
      "dimMinWidth": "Largeur min",
      "dimMaxWidth": "Largeur max",
      "dimMinHeight": "Hauteur min",
      "dimMaxHeight": "Hauteur max",
      "cancel": "Annuler",
      "save": "Enregistrer"
    },
    "groupList": {
      "addField": "Ajouter un champ",
      "noGroup": "Sans groupe",
      "emptyGroup": "Aucun champ dans ce groupe.",
      "addGroup": "Ajouter un groupe",
      "deleteGroupTooltip": "Supprimer le groupe"
    },
    "builder": {
      "fieldsTitle": "Champs techniques — {{productName}}",
      "previewTitle": "Aperçu — vue commerciale",
      "loading": "Chargement du Builder...",
      "loadError": "Impossible de charger la configuration de ce service.",
      "noFields": "Aucun champ configuré pour ce service pour l'instant.",
      "newGroupPlaceholder": "Nom du groupe (ex: Papeterie)",
      "cancel": "Annuler",
      "confirmDeleteSpec": "Supprimer la spécification \"{{name}}\" ? Cette action est irréversible.",
      "confirmDeleteGroup": "Supprimer le groupe \"{{name}}\" ? Les champs qu'il contient seront déplacés vers \"Sans groupe\"."
    },
    "referenceLists": {
      "title": "Référentiels de valeurs",
      "subtitle": "Listes de valeurs partagées entre plusieurs services (ex : types de papier, grammages).",
      "addNew": "Nouveau référentiel",
      "technicalKey": "Clé technique",
      "technicalKeyPlaceholder": "paper_types",
      "displayName": "Nom affiché",
      "displayNamePlaceholder": "Types de papier",
      "create": "Créer",
      "cancel": "Annuler",
      "valueCount": "valeur(s)",
      "empty": "Aucun référentiel créé pour l'instant.",
      "valuePlaceholder": "Valeur (ex: A4)",
      "labelPlaceholder": "Libellé affiché",
      "createError": "Impossible de créer le référentiel (clé déjà utilisée ?)."
    },
    "valuesModal": {
      "title": "Spécifications techniques — {{productName}}",
      "subtitle": "Renseignez les caractéristiques de cette ligne avant de l'ajouter au panier.",
      "cancel": "Annuler",
      "confirm": "Ajouter au panier"
    },
    "formRenderer": {
      "selectPlaceholder": "Sélectionner..."
    }
  },
  "hr": {
    "title": "Gestion des Ressources Humaines",
    "tabs": {
      "employees": "Employés",
      "attendance": "Présences",
      "attendance_cards": "Cartes de présence",
      "attendance_history": "Historique des présences",
      "payroll": "Paie",
      "absences": "Absences"
    },
    "viewMode": {
      "table": "Tableau",
      "cards": "Cartes"
    },
    "employees": {
      "title": "Gestion des Employés",
      "add": "Ajouter un employé",
      "id": "ID",
      "fullName": "Nom complet",
      "position": "Poste",
      "department": "Département",
      "contractType": "Contrat",
      "status": "Statut"
    },
    "table": {
      "name": "Nom",
      "email": "Email",
      "department": "Département",
      "position": "Poste",
      "status": "Statut",
      "salary": "Salaire",
      "actions": "Actions"
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
      "title": "Échelles et Configuration de Paie",
      "taxBracketsDesc": "Configurez les paramètres de paie standard pour le Cameroun",
      "process": "Traiter la paie du mois",
      "employee": "Employé",
      "period": "Période",
      "netSalary": "Salaire Net",
      "paymentDate": "Date de paiement",
      "status": "Statut",
      "signature": "Signature",
      "status_PENDING": "En attente",
      "status_PAID": "Payé",
      "sign": "Signer",
      "payAction": "Enregistrer le paiement",
      "detailsTitle": "Détails de la Paie - {{period}}",
      "recordPaymentTitle": "Enregistrer un Paiement",
      "recordPaymentSubtitle": "Confirmer le paiement pour {{employeeName}} d'un montant de {{amount}}.",
      "deductions": "Déductions",
      "socialDeductions": "Cotisations Sociales",
      "taxDeductions": "Prélèvements Fiscaux",
      "absenceDeductions": "Déductions pour Absences",
      "minWage": "Salaire Minimum",
      "cnpsEmployeeRate": "Taux CNPS",
      "success": {
        "updated": "Configuration mise à jour avec succès"
      },
      "error": {
        "update": "Erreur lors de la mise à jour de la configuration"
      },
      "modal": {
        "updateSmigDesc": "Mettre à jour le salaire minimum interprofessionnel garanti (SMIG) en vigueur",
        "updateCnpsTitle": "Modifier les Taux CNPS",
        "updateIrppTitle": "Modifier les Tranches IRPP",
        "updateLeaveTitle": "Modifier les Droits aux Congés"
      },
      "form": {
        "minWage": "Salaire Minimum",
        "minAmount": "Montant Minimum",
        "maxAmount": "Montant Maximum",
        "rate": "Taux",
        "above": "Au-dessus de",
        "daysPerYear": "jours par an",
        "employeeRate": "Taux Employé",
        "employerRate": "Taux Employeur",
        "paid": "Payé",
        "unpaid": "Non payé"
      },
      "infoBox": {
        "title": "Note"
      },
      "infoBoxText": "Ce sont les taux standards au Cameroun pour 2024. Toutes les valeurs sont utilisées automatiquement lors du calcul de la paie des employés. Les modifications s'appliqueront aux futures paies."
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
    "bankingDetails": "Coordonnées bancaires",
    "bankName": "Nom de la banque",
    "bankAccountNumber": "Numéro de compte (RIB/IBAN)",
    "maritalStatus": "Situation matrimoniale",
    "maritalStatusOptions": {
      "SINGLE": "Célibataire",
      "MARRIED": "Marié(e)",
      "DIVORCED": "Divorcé(e)",
      "WIDOWED": "Veuf/Veuve"
    },
    "numberDependents": "Nombre de dépendants",
    "dependentsHelperText": "Pour le calcul de la déduction fiscale",
    "form": {
      "sections": {
        "personal": "Informations personnelles",
        "professional": "Informations professionnelles",
        "salary": "Salaire et rémunération",
        "documents": "Documents",
        "leaves": "Droits aux congés"
      },
      "salarySection": {
        "title": "Salaire et rémunération",
        "subtitle": "Informations financières",
        "baseSalary": "Salaire de base",
        "baseSalaryHelper": "Salaire minimum (FCFA)",
        "bonus": "Prime",
        "bonusHelper": "Rémunération supplémentaire (FCFA)",
        "paymentMethod": "Mode de paiement"
      },
      "documentsSection": {
        "title": "Documents",
        "subtitle": "Documentation de l'employé",
        "uploadMessage": "📄 La fonctionnalité de téléchargement de documents sera implémentée ici"
      },
      "leavesSection": {
        "title": "Droits aux congés",
        "subtitle": "Configuration du solde des congés",
        "tabBalance": "Solde des congés",
        "tabRecords": "Historique des congés"
      }
    },
    "leaves": {
      "leaveHistory": "Historique des congés",
      "addLeaveRecord": "Enregistrer un congé",
      "noRecords": "Aucun enregistrement de congé",
      "daysHelper": "Nombre de jours de congé",
      "unpaidHelperText": "Jours de congé non payés",
      "balanceInfo": "Solde des congés disponibles",
      "leaveType": "Type de congé",
      "days": "Jours",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "configureBalance": "Configurer le solde des congés"
    },
    "cancel": "Annuler",
    "documents": {
      "title": "Documents",
      "addDocument": "Ajouter un document",
      "document": "Document",
      "name": "Nom du document",
      "type": "Type de document",
      "expiryDate": "Date d'expiration",
      "status": "Statut",
      "selectType": "Sélectionner un type",
      "noDocuments": "Aucun document ajouté",
      "file": "Fichier",
      "selectFile": "Sélectionner un fichier",
      "fileSelected": "Fichier sélectionné",
      "noFileSelected": "Aucun fichier sélectionné",
      "contract": "Contrat de travail",
      "idCard": "Carte d'identité / CNI",
      "workPermit": "Permis de travail",
      "diplomas": "Diplômes et certifications",
      "uploaded": "✓ Importé",
      "download": "Télécharger",
      "remove": "Supprimer",
      "dragOrClick": "Glissez-déposez votre fichier ici, ou cliquez pour sélectionner",
      "addDiplomas": "Ajouter des diplômes et certifications",
      "diplomasHelper": "Vous pouvez importer plusieurs diplômes et documents de certification",
      "uploadedDiplomas": "Diplômes importés",
      "requirements": "Documents requis : Contrat de travail, Carte d'identité/CNI et Permis de travail. Les diplômes sont optionnels mais recommandés."
    },
    "documentType": {
      "idCard": "Carte d'identité",
      "passport": "Passeport",
      "contract": "Contrat",
      "cv": "CV",
      "diploma": "Diplôme",
      "other": "Autre"
    },
    "documentStatus": {
      "valid": "Valide",
      "expired": "Expiré",
      "pending": "En attente"
    },
    "leaveType": {
      "annual": "Congés annuels",
      "sick": "Congés maladie",
      "personal": "Congés personnels",
      "maternity": "Congés maternité",
      "paternity": "Congés paternité",
      "other": "Autres congés",
      "unpaid": "Congés non payés"
    },
    "leaveBalance": {
      "title": "Solde des congés",
      "summary": "Résumé",
      "totalDays": "Total des jours",
      "days": "jours",
      "unpaidLeave": "Congés non payés",
      "totalEntitlements": "Droits aux congés totaux"
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
    },
    "stats": {
      "totalEmployees": "Total des employés",
      "totalEmployeesSubtitle": "Actifs & tous les statuts",
      "active": "Actifs",
      "activeSubtitle": "% de la main-d'œuvre",
      "onLeave": "En congé",
      "onLeaveSubtitle": "Actuellement absent",
      "recentlyAdded": "Récemment ajoutés",
      "recentlyAddedSubtitle": "30 derniers jours"
    },
    "actions": {
      "export": "Exporter",
      "csv": "CSV",
      "pdf": "PDF",
      "edit": "Modifier",
      "delete": "Supprimer",
      "view": "Afficher",
      "confirm": "Êtes-vous sûr ?"
    },
    "details": {
      "personalInfo": "Informations personnelles",
      "firstName": "Prénom",
      "lastName": "Nom",
      "birthDate": "Date de naissance",
      "nationality": "Nationalité",
      "phone": "Téléphone",
      "email": "Email",
      "address": "Adresse",
      "professionalInfo": "Informations professionnelles",
      "department": "Département",
      "position": "Poste",
      "workLocation": "Lieu de travail",
      "hireDate": "Date d'embauche",
      "contractType": "Type de contrat",
      "status": "Statut",
      "yearsOfService": "Années de service",
      "contract": "Contrat",
      "salary": "Salaire & Rémunération",
      "baseSalary": "Salaire de base",
      "bonus": "Prime",
      "paymentMethod": "Mode de paiement",
      "lastSalaryAdjustment": "Dernier ajustement",
      "leaveEntitlements": "Droits aux congés",
      "cameroonInfo": "Informations Cameroun",
      "cnpsNumber": "Numéro CNPS",
      "cnpsCategory": "Catégorie CNPS",
      "taxId": "N-tif",
      "maritalStatus": "Situation matrimoniale",
      "bankAccount": "Compte bancaire",
      "bankAccountNumber": "Numéro de compte bancaire",
      "documents": "Documents",
      "idCard": "Carte d'identité",
      "workPermit": "Permis de travail",
      "diplomas": "Diplômes"
    },
    "payrollInfo": {
      "cameroonPayroll": "Paie Cameroun",
      "belowSmig": "Salaire en dessous du SMIG",
      "grossSalary": "Salaire brut",
      "smig": "SMIG 2024",
      "deductions": "Déductions",
      "cnpsEmployee": "CNPS Employé (11%)",
      "cnpsEmployer": "Contribution employeur (17.6%)",
      "fcfa": "FCFA",
      "taxInfo": "Informations fiscales",
      "dependents": "Personnes à charge",
      "taxReduction": "Réduction fiscale"
    },
    "editEmployee": "Modifier l'employé",
    "addEmployee": "Ajouter un employé",
    "updateEmployee": "Mettre à jour l'employé"
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
    "allSubsidiaries": "Toutes les filiales",
    "allCommercials": "Tous les commerciaux",
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
      "allPriorities": "Toutes les priorités",
      "complete": "completée",
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
      "recentActivity": "Activité Récente",
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
      },
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
    "description": "Consultez et enregistrez les interventions de maintenance par équipement.",
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
      "maintenanceDate": "Date de la maintenance",
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
    "acquisitionValue": "Valeur d'acquisition",
    "status_OPERATIONAL": "Opérationnel",
    "status_UNDER_MAINTENANCE": "En maintenance",
    "status_OUT_OF_SERVICE": "Hors service",
    "status_NEEDS_MAINTENANCE": "Nécessite Maintenance",
  },
  "notifications": {
    "title": "Notifications",
    "markAllAsRead": "Tout marquer comme lu",
    "markAsRead": "Marquer comme lu",
    "noNotifications": "Aucune notification",
    "error": {
      "loading": "Erreur lors du chargement des notifications",
      "markAsRead": "Erreur lors du marquage comme lu",
      "markAllAsRead": "Erreur lors du marquage de toutes comme lues"
    },
    "types": {
      "EXTERNAL_TRANSACTION_CREATED": "Transaction Externe Créée",
      "EXTERNAL_TRANSACTION_UPDATED": "Transaction Externe Modifiée",
      "EXTERNAL_TRANSACTION_VALIDATED": "Transaction Externe Validée",
      "EXTERNAL_TRANSACTION_CANCELLED": "Transaction Externe Annulée",
      "EXTERNAL_TRANSACTION_DELETED": "Transaction Externe Supprimée"
    }
  },
  "bonDeCommande": {
    "title": "Bon de Commande",
    "orderNum": "Numéro de commande",
    "date": "Date",
    "dueDate": "Échéance",
    "billedTo": "Commandé par",
    "item": "Produit",
    "items": "Détail de la commande",
    "quantity": "Quantité",
    "unitPrice": "Prix unitaire",
    "totalPrice": "Total",
    "total": "TOTAL",
    "paymentMethod": "Mode de paiement",
    "paymentDueDate": "Date d'échéance du paiement",
    "print": "Imprimer",
    "exportPdf": "Exporter en PDF",
    "footer": "Merci de votre confiance. Cette commande est valide jusqu'au",
    "status": "Statut",
    "noData": "Aucune commande"
  }
};

// FIX: Define the Translations type based on the structure of frTranslations.
type Translations = typeof frTranslations;

const enTranslations: Translations = {
  "common": {
    "search": "Search",
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
    "send": "Send",
    "exportPdf": "Export to PDF",
    "notAvailable": "Not defined",
    "create": "Create",
    "update": "Update",
    "saving": "Saving...",
    "accessDenied": "Access denied"
  },
  "contactModal": {
    "title": "Contactez-nous",
    "subtitle": "Une question ? Un projet ? L'équipe CaapMedia est là pour vous.",
    "name": "Nom complet",
    "email": "Adresse e-mail",
    "phone": "Téléphone",
    "subject": "Sujet",
    "message": "Votre message",
    "send": "Envoyer",
    "sending": "Envoi en cours...",
    "successTitle": "Message envoyé !",
    "successMessage": "Merci de nous avoir contactés. Notre équipe reviendra vers vous dans les plus brefs délais.",
    "securityNote": "Vos informations sont sécurisées et ne seront jamais partagées."
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
    "success": "Payment successful!",
    "CASH": "Cash",
    "CARD": "Card",
    "CHECK": "Check",
    "MOBILE_MONEY": "Mobile Money",
    "WAVE": "Wave",
    "ORANGE_MONEY": "Orange Money",
    "PAYCAAP": "PayCaap",
    "PAY_ON_DELIVERY": "Pay on Delivery",
    "CUSTOMER_CREDIT": "Customer Credit (30 days)"
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
    "phone": "+237 6 75 86 43 54 & +237 6 73 42 35 04",
    "email": "contact.douala@caap.cm",
    "copyright": "© 2024 CaapMedia. All rights reserved."
  },
  "roles": {
    "SUPER_ADMIN": "Super Admin",
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
    "forgotPasswordSuccess": "If an account with the email {{email}} exists, a reset link has been sent.",
    "twoFactor": {
      "title": "Two-factor verification",
      "subtitle": "Enter the code from your authenticator app.",
      "codeLabel": "Verification code",
      "recoveryCodeLabel": "Recovery code",
      "recoveryCodePlaceholder": "xxxxxxxxxx",
      "verifyButton": "Verify",
      "useRecoveryCodeInstead": "Use a recovery code",
      "useCodeInstead": "Use the app code",
      "errorInvalidCode": "Invalid code."
    }
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
  "security": {
    "title": "Account security",
    "twoFactor": {
      "title": "Two-factor authentication",
      "description": "Add an extra layer of security to your account with an authenticator app.",
      "statusEnabled": "Enabled",
      "statusDisabled": "Disabled",
      "enableButton": "Enable two-factor authentication",
      "disableButton": "Disable two-factor authentication",
      "scanInstruction": "Scan this QR code with your authenticator app (Google Authenticator, Authy...), then enter the generated code to confirm.",
      "manualEntryLabel": "Or enter this code manually:",
      "confirmCodeLabel": "Verification code",
      "confirmButton": "Confirm and enable",
      "recoveryCodesWarning": "Save these recovery codes somewhere safe. Each can only be used once to sign in if you lose access to your authenticator app. They will never be shown again.",
      "recoveryCodesSavedButton": "I've saved my recovery codes",
      "errorInvalidCode": "Invalid code.",
      "errorGeneric": "Something went wrong. Please try again."
    }
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
    "orderViaWhatsApp": "Order via WhatsApp",
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
  "paymentMethods": {
    "BANK_TRANSFER": "Bank Transfer",
    "CHECK": "Check",
    "CASH": "Cash"
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
    "endDate": "End date",
    "allSubsidiaries": "All subsidiaries"
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
    "status_READY_FOR_DELIVERY": "Ready for Delivery",
    "equipmentCosts": {
      "title": "Hourly cost per machine",
      "subtitle": "Set the hourly rate for each piece of equipment. These rates are used to calculate the production cost for service orders.",
      "allSubsidiaries": "All subsidiaries",
      "colMachine": "Machine",
      "colStatus": "Status",
      "colSubsidiary": "Subsidiary",
      "colHourlyRate": "Hourly rate (F CFA/h)",
      "colAction": "Action",
      "notConfigured": "Not configured",
      "noEquipment": "No equipment found.",
      "saveError": "Error saving.",
      "invalidRate": "Invalid hourly rate.",
      "configure": "Configure",
      "modify": "Edit"
    },
    "commercialParams": {
      "title": "Global commercial parameters",
      "subtitle": "Set the allowed margin range for service quotes. Sales reps must enter a margin percentage within this range when creating an order.",
      "notConfigured": "No parameters configured. Set the margins to activate the production cost module.",
      "minMargin": "Minimum margin (%)",
      "maxMargin": "Maximum margin (%)",
      "rangeHint": "Sales reps must enter a margin between {{min}}% and {{max}}%.",
      "saveError": "Error saving.",
      "invalidValues": "Invalid values.",
      "outOfRange": "Margins must be between 0% and 100%.",
      "minGtMax": "Minimum margin must be less than maximum margin.",
      "success": "Parameters saved successfully.",
      "create": "Create",
      "update": "Update",
      "lastModified": "Last modified: {{date}}"
    },
    "workflows": {
      "title": "Production workflows",
      "subtitle": "Define machine sequences for each service. Sales reps see them pre-filled when creating a new order.",
      "newWorkflow": "New workflow",
      "allSubsidiaries": "All subsidiaries",
      "noWorkflow": "No workflows defined.",
      "active": "Active",
      "inactive": "Inactive",
      "linkedService": "Linked service: {{name}}",
      "noSteps": "No steps",
      "form": {
        "createTitle": "New workflow",
        "editTitle": "Edit workflow",
        "name": "Name",
        "namePlaceholder": "e.g. Standard offset printing",
        "description": "Description",
        "linkedService": "Linked service (optional)",
        "noLinkedService": "— No linked service —",
        "isActive": "Active workflow",
        "steps": "Steps (machines)",
        "addStep": "Add",
        "chooseEquipment": "— Choose a machine —",
        "noStepsDefined": "Click \"Add\" to define steps.",
        "nameRequired": "Name is required.",
        "equipmentRequired": "Each step must have a machine selected.",
        "createError": "Error creating workflow.",
        "editError": "Error updating workflow.",
        "update": "Update"
      },
      "deleteConfirm": {
        "title": "Delete workflow",
        "message": "This action is irreversible. Existing orders will not be affected."
      }
    },
    "costModal": {
      "title": "Production cost",
      "prefilledWorkflow": "Pre-filled workflow: {{name}}",
      "stepsTitle": "Production steps",
      "addMachine": "Add a machine",
      "noSteps": "No steps. Add a machine or select a service with a workflow.",
      "chooseMachine": "— Machine —",
      "hoursPlaceholder": "Hours",
      "totalCost": "Total production cost",
      "margin": "Margin (%) *",
      "marginRange": "Allowed range: {{min}}% – {{max}}%",
      "finalPrice": "Final price (= line price)",
      "priceNote": "This amount will be applied as the unit price on the order line.",
      "confirmButton": "Confirm cost",
      "noStepsError": "Add at least one production step.",
      "noEquipmentError": "Each step must have a machine selected.",
      "invalidTimeError": "Enter a valid time (> 0) for each step.",
      "noMarginError": "Enter a margin percentage.",
      "marginRangeError": "Margin must be between {{min}}% and {{max}}%."
    }
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
      "unit": "Unit",
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
      "purchaseUnit": "Purchase unit",
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
    "belowThreshold": "Below minimum threshold",
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
  "stockMovements": {
    "title": "Stock movements",
    "allTypes": "All types",
    "date": "Date",
    "product": "Product",
    "type": "Type",
    "direction": "Direction",
    "quantity": "Quantity",
    "reason": "Reason",
    "in": "In",
    "out": "Out",
    "empty": "No movement recorded yet.",
    "tabs": {
      "levels": "Stock levels",
      "movements": "Movements",
      "inventory": "Inventory"
    },
    "types": {
      "PURCHASE_RECEIPT": "Purchase receipt",
      "CUSTOMER_RETURN": "Customer return",
      "POSITIVE_ADJUSTMENT": "Positive adjustment",
      "TRANSFER_IN": "Transfer in",
      "PRODUCTION_CONSUMPTION": "Production consumption",
      "LOSS": "Loss",
      "BREAKAGE": "Breakage",
      "INTERNAL_CONSUMPTION": "Internal consumption",
      "NEGATIVE_ADJUSTMENT": "Negative adjustment",
      "SUPPLIER_RETURN": "Supplier return",
      "TRANSFER_OUT": "Transfer out"
    },
    "inventory": {
      "title": "Inventory",
      "subtitle": "Enter the actually counted stock — the deviation is calculated and recorded automatically.",
      "product": "Product",
      "selectProduct": "Select a product...",
      "theoreticalStock": "Theoretical stock",
      "countedStock": "Counted stock",
      "reason": "Reason (optional)",
      "submit": "Validate inventory",
      "successTitle": "Inventory recorded",
      "successMessage": "Stock has been updated.",
      "noDeviation": "No deviation found — no movement created.",
      "deviationRecorded": "Deviation of {{delta}} recorded."
    },
    "withdraw": {
      "title": "Withdraw materials",
      "subtitle": "Enter the quantities actually used for this order.",
      "addLine": "Add a line",
      "product": "Product",
      "quantity": "Quantity",
      "submit": "Validate withdrawal",
      "successTitle": "Materials withdrawn",
      "successMessage": "Stock has been updated.",
      "empty": "Add at least one material to withdraw."
    },
    "manual": {
      "newMovement": "New movement",
      "title": "New stock movement",
      "subtitle": "Customer return, transfer, loss, breakage, internal consumption or supplier return.",
      "product": "Product",
      "selectProduct": "Select a product...",
      "submit": "Save movement",
      "successTitle": "Movement recorded",
      "successMessage": "Stock has been updated."
    }
  },
  "productRange": {
    "popular": "Popular",
    "standard": "Standard",
    "premium": "Premium",
    "none": "None"
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
      "mobile": "Mobile",
      "BANK_TRANSFER": "Bank Transfer",
      "CHECK": "Check",
      "CASH": "Cash"
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
        "units": "Units",
        "unitsManagement": {
            "title": "Units of measure",
            "subtitle": "Shared reference list — base unit and packaging units for stock products.",
            "addNew": "New unit",
            "name": "Name",
            "namePlaceholder": "Sheet",
            "symbol": "Symbol (optional)",
            "symbolPlaceholder": "u",
            "create": "Create",
            "save": "Save",
            "cancel": "Cancel",
            "empty": "No unit created yet.",
            "createError": "Could not create the unit (name already used?).",
            "deleteError": "This unit is used by at least one stock product."
        },
        "services": "Services",
        "addService": "Add a service",
        "referenceLists": "Reference lists",
        "users": "Users",
        "suppliers": "Suppliers",
        "taxes": "Taxes",
        "treasury": "Treasury",
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
        "equipmentCosts": "Machine costs",
        "commercialParams": "Commercial params",
        "productionWorkflows": "Workflows",
        "catalogue": "Catalogue",
        "production": "Production",
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
            "editEmployeeTitle": "Edit Employee",
            "addEmployeeTitle": "Add Employee",
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
            "deleteTaxTitle": "Delete Tax",
            "editServiceTitle": "Edit service",
            "addServiceTitle": "Add service",
            "deleteServiceTitle": "Delete service"
        },
        "serviceForm": {
            "name": "Name",
            "category": "Category",
            "range": "Range",
            "description": "Description",
            "generateWithAI": "Generate with AI",
            "isActive": "Active",
            "isVisibleOnSite": "Visible on storefront",
            "displayOrder": "Display order",
            "images": "Images"
        },
        "builder": {
            "back": "Back to services",
            "configureFields": "Configure fields"
        },
        "form": {
            "name": "Name",
            "category": "Category",
        "description": "Description",
        "passwordRequired": "Password is required for a new user.",
        "passwordsDoNotMatch": "Passwords do not match.",
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
                "personal": "Personal Information",
                "professional": "Professional Information",
                "salary": "Salary & Benefits",
                "documents": "Documents",
                "leaves": "Leaves"
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
            "isDefault": "Default Tax",
            "minThreshold": "Minimum threshold",
            "baseUnit": "Base unit",
            "selectUnit": "Select a unit...",
            "packagingUnits": "Packaging units",
            "packagingUnitsHelp": "Purchase units (e.g. Ream, Box) and their equivalence in the base unit.",
            "conversionFactor": "Conversion factor"
        }
    },
    "specBuilder": {
        "fieldTypes": {
            "TEXT": "Text", "TEXTAREA": "Long text", "NUMBER": "Number", "DECIMAL": "Decimal number",
            "AMOUNT": "Amount", "SELECT": "Dropdown list", "MULTISELECT": "Multi-select",
            "RADIO": "Radio buttons", "CHECKBOX": "Checkbox", "BOOLEAN": "Yes / No", "DATE": "Date",
            "TIME": "Time", "COLOR": "Color", "UPLOAD": "Upload", "URL": "URL", "EMAIL": "Email",
            "PHONE": "Phone", "DIMENSIONS": "Dimensions (Width x Height)"
        },
        "card": {
            "required": "Required",
            "reorder": "Reorder"
        },
        "drawer": {
            "editTitle": "Edit specification",
            "addTitle": "New specification",
            "nameRequired": "Name is required",
            "technicalKeyRequired": "Technical key is required",
            "technicalKeyPattern": "snake_case required (e.g. paper_weight)",
            "fieldRequired": "Required",
            "name": "Name",
            "technicalKey": "Technical key",
            "technicalKeyPlaceholder": "e.g. paper_weight",
            "type": "Type",
            "group": "Group",
            "noGroup": "No group",
            "helpText": "Help text",
            "placeholder": "Placeholder",
            "unit": "Unit (mm, cm, g, kg, pages...)",
            "internalDescription": "Internal description",
            "required": "Required",
            "visibleToClient": "Visible to client",
            "visibleToProduction": "Visible to production",
            "editableAfterValidation": "Editable after validation",
            "searchable": "Usable in search",
            "possibleValues": "Possible values",
            "optionsSourceInline": "Entered here",
            "optionsSourceReference": "Shared reference list",
            "selectReferenceList": "Select a reference list...",
            "optionValuePlaceholder": "Value (e.g. A4)",
            "optionLabelPlaceholder": "Displayed label",
            "addOption": "Add a value",
            "uploadConfigTitle": "Upload configuration",
            "uploadExtensions": "Allowed extensions (comma-separated)",
            "uploadExtensionsPlaceholder": "PDF, AI, PSD, CDR",
            "uploadMaxSize": "Max size (MB)",
            "uploadMaxFiles": "Max number of files",
            "dimensionsConfigTitle": "Dimension bounds",
            "dimMinWidth": "Min width",
            "dimMaxWidth": "Max width",
            "dimMinHeight": "Min height",
            "dimMaxHeight": "Max height",
            "cancel": "Cancel",
            "save": "Save"
        },
        "groupList": {
            "addField": "Add a field",
            "noGroup": "No group",
            "emptyGroup": "No fields in this group.",
            "addGroup": "Add a group",
            "deleteGroupTooltip": "Delete group"
        },
        "builder": {
            "fieldsTitle": "Technical fields — {{productName}}",
            "previewTitle": "Preview — sales view",
            "loading": "Loading Builder...",
            "loadError": "Unable to load this service's configuration.",
            "noFields": "No fields configured for this service yet.",
            "newGroupPlaceholder": "Group name (e.g. Paper)",
            "cancel": "Cancel",
            "confirmDeleteSpec": "Delete specification \"{{name}}\"? This action cannot be undone.",
            "confirmDeleteGroup": "Delete group \"{{name}}\"? Its fields will be moved to \"No group\"."
        },
        "referenceLists": {
            "title": "Value reference lists",
            "subtitle": "Value lists shared across several services (e.g. paper types, weights).",
            "addNew": "New reference list",
            "technicalKey": "Technical key",
            "technicalKeyPlaceholder": "paper_types",
            "displayName": "Display name",
            "displayNamePlaceholder": "Paper types",
            "create": "Create",
            "cancel": "Cancel",
            "valueCount": "value(s)",
            "empty": "No reference list created yet.",
            "valuePlaceholder": "Value (e.g. A4)",
            "labelPlaceholder": "Displayed label",
            "createError": "Could not create the reference list (key already used?)."
        },
        "valuesModal": {
            "title": "Technical specifications — {{productName}}",
            "subtitle": "Fill in this line's specifications before adding it to the cart.",
            "cancel": "Cancel",
            "confirm": "Add to cart"
        },
        "formRenderer": {
            "selectPlaceholder": "Select..."
        }
    },
    "hr": {
        "title": "Human Resources Management",
        "tabs": {
            "employees": "Employees",
            "attendance": "Attendance",
            "attendance_cards": "Attendance Cards",
            "attendance_history": "Attendance History",
            "payroll": "Payroll",
            "absences": "Absences"
        },
        "viewMode": {
            "table": "Table",
            "cards": "Cards"
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
        "table": {
            "name": "Name",
            "email": "Email",
            "department": "Department",
            "position": "Position",
            "status": "Status",
            "salary": "Salary",
            "actions": "Actions"
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
            "title": "Payroll Scales & Configuration",
            "taxBracketsDesc": "Configure standard payroll parameters for Cameroon",
            "process": "Process this month's payroll",
            "employee": "Employee",
            "period": "Period",
            "netSalary": "Net Salary",
            "paymentDate": "Payment Date",
            "status": "Status",
            "signature": "Signature",
            "status_PENDING": "Pending",
            "status_PAID": "Paid",
            "sign": "Sign",
            "payAction": "Record Payment",
            "detailsTitle": "Payroll Details - {{period}}",
            "recordPaymentTitle": "Record a Payment",
            "recordPaymentSubtitle": "Confirm payment for {{employeeName}} of {{amount}}.",
            "deductions": "Deductions",
            "socialDeductions": "Social Contributions",
            "taxDeductions": "Tax Deductions",
            "absenceDeductions": "Absence Deductions",
            "minWage": "Minimum Wage",
            "cnpsEmployeeRate": "CNPS Employee Rate",
            "success": {
                "updated": "Configuration updated successfully"
            },
            "error": {
                "update": "Error updating configuration"
            },
            "modal": {
                "updateSmigDesc": "Update the minimum wage (SMIG) currently in effect",
                "updateCnpsTitle": "Update CNPS Rates",
                "updateIrppTitle": "Update IRPP Tax Brackets",
                "updateLeaveTitle": "Update Leave Entitlements"
            },
            "form": {
                "minWage": "Minimum Wage",
                "minAmount": "Minimum Amount",
                "maxAmount": "Maximum Amount",
                "rate": "Rate",
                "above": "Above",
                "daysPerYear": "days per year",
                "employeeRate": "Employee Rate",
                "employerRate": "Employer Rate",
                "paid": "Paid",
                "unpaid": "Unpaid"
            },
            "infoBox": {
                "title": "Note"
            },
            "infoBoxText": "These are the standard rates for Cameroon 2024. All values are used automatically when calculating employee payroll. Changes will apply to future payroll calculations."
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
        "bankingDetails": "Banking Details",
        "bankName": "Bank Name",
        "bankAccountNumber": "Account Number (RIB/IBAN)",
        "maritalStatus": "Marital Status",
        "maritalStatusOptions": {
            "SINGLE": "Single",
            "MARRIED": "Married",
            "DIVORCED": "Divorced",
            "WIDOWED": "Widowed"
        },
        "numberDependents": "Number of Dependents",
        "dependentsHelperText": "For tax deduction calculation",
        "form": {
            "sections": {
                "personal": "Personal Information",
                "professional": "Professional Information",
                "salary": "Salary & Compensation",
                "documents": "Documents",
                "leaves": "Leave Entitlements"
            },
            "salarySection": {
                "title": "Salary & Compensation",
                "subtitle": "Financial information",
                "baseSalary": "Base Salary",
                "baseSalaryHelper": "Minimum salary (FCFA)",
                "bonus": "Bonus",
                "bonusHelper": "Additional compensation (FCFA)",
                "paymentMethod": "Payment Method"
            },
            "documentsSection": {
                "title": "Documents",
                "subtitle": "Employee documentation",
                "uploadMessage": "📄 Document upload functionality would be implemented here"
            },
            "leavesSection": {
                "title": "Leave Entitlements",
                "subtitle": "Leave balance configuration",
                "tabBalance": "Leave Balance",
                "tabRecords": "Leave History"
            }
        },
        "cancel": "Cancel",
        "leaves": {
            "leaveHistory": "Leave History",
            "addLeaveRecord": "Record Leave",
            "noRecords": "No leave records",
            "daysHelper": "Number of leave days",
            "unpaidHelperText": "Unpaid leave days",
            "balanceInfo": "Available leave balance",
            "leaveType": "Leave Type",
            "days": "Days",
            "startDate": "Start Date",
            "endDate": "End Date",
            "configureBalance": "Configure Leave Balance"
        },
        "documents": {
            "title": "Documents",
            "addDocument": "Add Document",
            "document": "Document",
            "name": "Document Name",
            "type": "Document Type",
            "expiryDate": "Expiry Date",
            "status": "Status",
            "selectType": "Select a type",
            "noDocuments": "No documents added",
            "file": "File",
            "selectFile": "Select a file",
            "fileSelected": "File selected",
            "noFileSelected": "No file selected",
            "contract": "Employment Contract",
            "idCard": "ID Card / National ID",
            "workPermit": "Work Permit",
            "diplomas": "Diplomas & Certifications",
            "uploaded": "✓ Uploaded",
            "download": "Download",
            "remove": "Remove",
            "dragOrClick": "Drag and drop your file here, or click to select",
            "addDiplomas": "Add Diplomas & Certifications",
            "diplomasHelper": "You can upload multiple diplomas and certification documents",
            "uploadedDiplomas": "Uploaded Diplomas",
            "requirements": "Required documents: Employment Contract, ID Card/National ID, and Work Permit. Diplomas are optional but recommended."
        },
        "documentType": {
            "idCard": "ID Card",
            "passport": "Passport",
            "contract": "Contract",
            "cv": "CV",
            "diploma": "Diploma",
            "other": "Other"
        },
        "documentStatus": {
            "valid": "Valid",
            "expired": "Expired",
            "pending": "Pending"
        },
        "leaveType": {
            "annual": "Annual Leave",
            "sick": "Sick Leave",
            "personal": "Personal Leave",
            "maternity": "Maternity Leave",
            "paternity": "Paternity Leave",
            "other": "Other Leave",
            "unpaid": "Unpaid Leave"
        },
        "leaveBalance": {
            "title": "Leave Balance",
            "summary": "Summary",
            "totalDays": "Total Days",
            "days": "days",
            "unpaidLeave": "Unpaid Leave",
            "totalEntitlements": "Total Leave Entitlements"
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
        },
        "stats": {
            "totalEmployees": "Total Employees",
            "totalEmployeesSubtitle": "Active & all statuses",
            "active": "Active",
            "activeSubtitle": "% of workforce",
            "onLeave": "On Leave",
            "onLeaveSubtitle": "Currently away",
            "recentlyAdded": "Recently Added",
            "recentlyAddedSubtitle": "Last 30 days"
        },
        "actions": {
            "export": "Export",
            "csv": "CSV",
            "pdf": "PDF",
            "edit": "Edit",
            "delete": "Delete",
            "view": "View",
            "confirm": "Are you sure?"
        },
        "details": {
            "personalInfo": "Personal Information",
            "firstName": "First Name",
            "lastName": "Last Name",
            "birthDate": "Birth Date",
            "nationality": "Nationality",
            "phone": "Phone",
            "email": "Email",
            "address": "Address",
            "professionalInfo": "Professional Information",
            "department": "Department",
            "position": "Position",
            "workLocation": "Work Location",
            "hireDate": "Hire Date",
            "contractType": "Contract Type",
            "status": "Status",
            "yearsOfService": "Years of Service",
            "contract": "Contract",
            "salary": "Salary & Compensation",
            "baseSalary": "Base Salary",
            "bonus": "Bonus",
            "paymentMethod": "Payment Method",
            "lastSalaryAdjustment": "Last Salary Adjustment",
            "leaveEntitlements": "Leave Entitlements",
            "cameroonInfo": "Cameroon Information",
            "cnpsNumber": "CNPS Number",
            "cnpsCategory": "CNPS Category",
            "taxId": "N-tif",
            "maritalStatus": "Marital Status",
            "bankAccount": "Bank Account",
            "bankAccountNumber": "Bank Account Number",
            "documents": "Documents",
            "idCard": "ID Card",
            "workPermit": "Work Permit",
            "diplomas": "Diplomas"
        },
        "payrollInfo": {
            "cameroonPayroll": "Cameroon Payroll",
            "belowSmig": "Salary below SMIG",
            "grossSalary": "Gross Salary",
            "smig": "SMIG 2024",
            "deductions": "Deductions",
            "cnpsEmployee": "CNPS Employee (11%)",
            "cnpsEmployer": "Employer Contribution (17.6%)",
            "fcfa": "FCFA",
            "taxInfo": "Tax Info",
            "dependents": "Dependents",
            "taxReduction": "Tax reduction"
        },
        "editEmployee": "Edit Employee",
        "addEmployee": "Add Employee",
        "updateEmployee": "Update Employee"
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
        "allSubsidiaries": "All subsidiaries",
        "allCommercials": "All sales reps",
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
            "allPriorities": "All priorities",
            "complete": "completed",
  
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
                "log": "Enregistrer"
            },
            "modal": {
                "addTitle": "Add New Contract",
                "editTitle": "Edit Contract",
                "deleteTitle": "Delete Contract"
            }
        }
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
    "subtotal": "Subtotal",
    "discount": "Discount (FCFA)",
    "searchClientOtherSubsidiary": "Search a client from another subsidiary...",
    "paymentMethod": "Payment method",
    "paymentMethod_PAY_ON_DELIVERY": "Pay on delivery",
    "paymentMethod_CARD": "Credit card",
    "paymentMethod_ORANGE_MONEY": "Orange Money",
    "paymentMethod_WAVE": "Wave",
    "paymentMethod_MOBILE_MONEY": "Mobile Money",
    "paymentMethod_PAYCAAP": "PayCaap",
    "paymentMethod_CUSTOMER_CREDIT": "Customer credit"
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
    "prefinancement": "Pre-financing",
    "supplierDebts": "Supplier Debts",
    "expenses": "Expenses",
    "externalTransactions": "External Transactions",
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
      "longTermDebts": "Long-Term Debts",
      "equity": "Equity",
      "shareCapital": "Share Capital",
      "netIncome": "Retained Earnings (Net Income)",
      "retainedEarnings": "Retained Earnings",
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
    "typeExpense": "Expense",
    "confirmDelete": "Delete Transaction",
    "confirmDeleteMessage": "Are you sure you want to delete this transaction? This action is irreversible.",
    "validate": "Validate",
    "reject": "Reject",
    "confirmValidate": "Validate Transaction",
    "confirmReject": "Reject Transaction",
    "noCreatePermission": "Only the Financial Director can create transactions",
    "modal": {
      "addIncome": "Add New Income",
      "addExpense": "Add New Expense"
    }
  },
  "treasuryAccounts": {
    "title": "Treasury Accounts",
    "description": "Manage your company's bank and treasury accounts",
    "accessDenied": "You don't have permission to manage treasury accounts",
    "noData": "No treasury accounts found",
    "stats": {
      "totalAccounts": "Total Accounts",
      "totalBalance": "Total Balance",
      "averageBalance": "Average Balance"
    },
    "table": {
      "accountName": "Account Name",
      "balance": "Balance",
      "currency": "Currency",
      "actions": "Actions"
    },
    "actions": {
      "create": "Create Account",
      "edit": "Edit",
      "delete": "Delete"
    },
    "create": {
      "title": "Create Treasury Account"
    },
    "edit": {
      "title": "Edit Treasury Account"
    },
    "form": {
      "accountName": "Account Name",
      "accountNamePlaceholder": "Ex: Main BNP Account",
      "balance": "Initial Balance",
      "currency": "Currency",
      "accountType": "Account Type",
      "subsidiary": "Subsidiary"
    },
    "accountTypes": {
      "bank": "Bank",
      "cash": "Cash",
      "prefinancement": "Prefinancement Account"
    },
    "validation": {
      "accountNameRequired": "Account name is required",
      "validBalance": "Please enter a valid balance"
    },
    "confirm": {
      "delete": "Are you sure you want to delete this treasury account?",
      "deleteWithBalance": "WARNING: Account '{{accountName}}' has a balance of {{balance}}. Are you sure you want to delete it? This action is irreversible.",
      "forceDelete": "Server refused to delete account '{{accountName}}' (balance: {{balance}}). Do you want to force delete anyway?"
    },
    "success": {
      "created": "Treasury account created successfully",
      "updated": "Treasury account updated successfully",
      "deleted": "Treasury account deleted successfully"
    },
    "error": {
      "loading": "Error loading treasury accounts",
      "create": "Error creating treasury account",
      "update": "Error updating treasury account",
      "delete": "Error deleting treasury account",
      "deleteNonZeroBalance": "Cannot delete account '{{accountName}}' with balance {{balance}}. Please first bring the balance to zero.",
      "deleteWithTransactions": "Cannot delete this account as it contains financial transactions.",
      "cannotDeleteNonZero": "Cannot delete: balance {{balance}}",
      "forceDeleteFailed": "Force delete failed. Server still refuses to delete this account."
    }
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
  "externalTransactions": {
    "title": "External Transactions",
    "noData": "No external transactions found",
    "error": {
      "loading": "Error loading external transactions",
      "create": "Error creating transaction",
      "update": "Error updating transaction",
      "validate": "Error validating transaction",
      "cancel": "Error cancelling transaction",
      "delete": "Error deleting transaction"
    },
    "success": {
      "created": "Transaction created successfully",
      "updated": "Transaction updated successfully",
      "validated": "Transaction validated successfully",
      "cancelled": "Transaction cancelled successfully",
      "deleted": "Transaction deleted successfully",
      "exported": "Data exported successfully"
    },
    "confirm": {
      "delete": "Are you sure you want to delete this transaction? This action is irreversible."
    },
    "stats": {
      "total": "Total transactions",
      "totalAmount": "Total amount",
      "validated": "Validated transactions",
      "pending": "Pending transactions",
      "summary": "Summary",
      "totalIncome": "Total income",
      "totalExpenses": "Total expenses",
      "netAmount": "Net amount"
    },
    "filters": {
      "allTypes": "All types",
      "allStatus": "All status",
      "startDate": "Start date",
      "endDate": "End date",
      "search": "Search..."
    },
    "actions": {
      "create": "New transaction",
      "validate": "Validate",
      "cancel": "Cancel",
      "exportCSV": "Export CSV",
      "exportPDF": "Export PDF",
      "document": "View document"
    },
    "table": {
      "date": "Date",
      "description": "Description",
      "amount": "Amount",
      "type": "Type",
      "category": "Category",
      "status": "Status",
      "actions": "Actions",
      "reference": "Reference"
    },
    "create": {
      "title": "Create external transaction"
    },
    "edit": {
      "title": "Edit external transaction"
    },
    "form": {
      "date": "Transaction date",
      "description": "Description",
      "amount": "Amount",
      "type": "Transaction type",
      "category": "Category",
      "paymentMethod": "Payment method",
      "referenceNumber": "Reference number",
      "document": "Document",
      "documentUrl": "Document URL"
    },
    "types": {
      "INVESTMENT": "Investment",
      "INVESTMENT_RETURN": "Investment return",
      "LOAN": "Loan",
      "DONATION": "Donation",
      "PERSONAL_EXPENSE": "Personal expense",
      "PERSONAL_INCOME": "Personal income",
      "TAX_REFUND": "Tax refund",
      "INSURANCE_PAYOUT": "Insurance payout",
      "LEGAL_SETTLEMENT": "Legal settlement",
      "TRANSFER_PDG": "CEO Transfer",
      "OTHER_FINANCIAL": "Other financial transaction"
    },
    "categories": {
      "REAL_ESTATE": "Real estate",
      "VEHICLE": "Vehicle",
      "EQUIPMENT": "Equipment",
      "EDUCATION": "Education",
      "HEALTH": "Health",
      "TRAVEL": "Travel",
      "ENTERTAINMENT": "Entertainment",
      "PERSONAL_SAVINGS": "Personal savings",
      "FAMILY_SUPPORT": "Family support",
      "CHARITY": "Charity",
      "INVESTMENT_RETURN": "Investment return",
      "TAX_REFUND": "Tax refund",
      "INSURANCE_PAYOUT": "Insurance payout",
      "LEGAL_SETTLEMENT": "Legal settlement",
      "TRANSFER_PDG": "CEO Transfer",
      "OTHER": "Other"
    },
    "status": {
      "DRAFT": "Draft",
      "VALIDATED": "Validated",
      "CANCELLED": "Cancelled"
    },
    "notifications": {
      "created": {
        "title": "New External Transaction Created",
        "message": "{{creator}} created a new external transaction: {{description}} for {{amount}}"
      },
      "updated": {
        "title": "External Transaction Updated",
        "message": "{{creator}} updated the external transaction: {{description}} for {{amount}}"
      },
      "validated": {
        "title": "External Transaction Validated",
        "message": "{{creator}} validated the external transaction: {{description}} for {{amount}}"
      },
      "cancelled": {
        "title": "External Transaction Cancelled",
        "message": "{{creator}} cancelled the external transaction: {{description}} for {{amount}}"
      },
      "deleted": {
        "title": "External Transaction Deleted",
        "message": "{{creator}} deleted the external transaction: {{description}} for {{amount}}"
      }
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
    "units": "Units",
    "unitsManagement": {
      "title": "Units of measure",
      "subtitle": "Shared reference list — base unit and packaging units for stock products.",
      "addNew": "New unit",
      "name": "Name",
      "namePlaceholder": "Sheet",
      "symbol": "Symbol (optional)",
      "symbolPlaceholder": "u",
      "create": "Create",
      "save": "Save",
      "cancel": "Cancel",
      "empty": "No unit created yet.",
      "createError": "Could not create the unit (name already used?).",
      "deleteError": "This unit is used by at least one stock product."
    },
    "services": "Services",
    "addService": "Add a service",
    "referenceLists": "Reference lists",
    "users": "Users",
    "suppliers": "Suppliers",
    "taxes": "Taxes",
    "treasury": "Treasury",
    "productManagement": "Product Management",
    "addProduct": "Add Product",
    "addTax": "Add Tax",
    "productId": "ID",
    "name": "Name",
    "category": "Category",
    "sellingPrice": "Selling Price",
    "stock": "Stock",
    "clientManagement": "Client",
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
    "equipmentCosts": "Machine costs",
    "commercialParams": "Commercial params",
    "productionWorkflows": "Workflows",
    "catalogue": "Catalogue",
    "production": "Production",
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
      "editEmployeeTitle": "Edit Employee",
      "addEmployeeTitle": "Add Employee",
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
      "deleteTaxTitle": "Delete Tax",
      "editServiceTitle": "Edit service",
      "addServiceTitle": "Add service",
      "deleteServiceTitle": "Delete service"
    },
    "serviceForm": {
      "name": "Name",
      "category": "Category",
      "range": "Range",
      "description": "Description",
      "generateWithAI": "Generate with AI",
      "isActive": "Active",
      "isVisibleOnSite": "Visible on storefront",
      "displayOrder": "Display order",
      "images": "Images",
      "maxImages": "max {{count}}",
      "imageTooLarge": "Image exceeds the maximum size of 5MB",
      "removeImage": "Remove image",
      "acceptedFormats": "Accepted formats: JPG, PNG, GIF, WEBP • Max size: 5MB"
    },
    "builder": {
      "back": "Back to services",
      "configureFields": "Configure fields"
    },
    "form": {
      "name": "Name",
      "category": "Category",
      "description": "Description",
      "passwordRequired": "Password is required for a new user.",
      "passwordsDoNotMatch": "Passwords do not match.",
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
        "personal": "Personal Information",
        "professional": "Professional Information",
        "salary": "Salary & Benefits",
        "documents": "Documents",
        "leaves": "Leaves"
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
      "isDefault": "Default Tax",
      "minThreshold": "Minimum threshold",
      "baseUnit": "Base unit",
      "selectUnit": "Select a unit...",
      "packagingUnits": "Packaging units",
      "packagingUnitsHelp": "Purchase units (e.g. Ream, Box) and their equivalence in the base unit.",
      "conversionFactor": "Conversion factor"
    }
  },
  "specBuilder": {
    "fieldTypes": {
      "TEXT": "Text", "TEXTAREA": "Long text", "NUMBER": "Number", "DECIMAL": "Decimal number",
      "AMOUNT": "Amount", "SELECT": "Dropdown list", "MULTISELECT": "Multi-select",
      "RADIO": "Radio buttons", "CHECKBOX": "Checkbox", "BOOLEAN": "Yes / No", "DATE": "Date",
      "TIME": "Time", "COLOR": "Color", "UPLOAD": "Upload", "URL": "URL", "EMAIL": "Email",
      "PHONE": "Phone", "DIMENSIONS": "Dimensions (Width x Height)"
    },
    "card": {
      "required": "Required",
      "reorder": "Reorder"
    },
    "drawer": {
      "editTitle": "Edit specification",
      "addTitle": "New specification",
      "nameRequired": "Name is required",
      "technicalKeyRequired": "Technical key is required",
      "technicalKeyPattern": "snake_case required (e.g. paper_weight)",
      "fieldRequired": "Required",
      "name": "Name",
      "technicalKey": "Technical key",
      "technicalKeyPlaceholder": "e.g. paper_weight",
      "type": "Type",
      "group": "Group",
      "noGroup": "No group",
      "helpText": "Help text",
      "placeholder": "Placeholder",
      "unit": "Unit (mm, cm, g, kg, pages...)",
      "internalDescription": "Internal description",
      "required": "Required",
      "visibleToClient": "Visible to client",
      "visibleToProduction": "Visible to production",
      "editableAfterValidation": "Editable after validation",
      "searchable": "Usable in search",
      "possibleValues": "Possible values",
      "optionsSourceInline": "Entered here",
      "optionsSourceReference": "Shared reference list",
      "selectReferenceList": "Select a reference list...",
      "optionValuePlaceholder": "Value (e.g. A4)",
      "optionLabelPlaceholder": "Displayed label",
      "addOption": "Add a value",
      "uploadConfigTitle": "Upload configuration",
      "uploadExtensions": "Allowed extensions (comma-separated)",
      "uploadExtensionsPlaceholder": "PDF, AI, PSD, CDR",
      "uploadMaxSize": "Max size (MB)",
      "uploadMaxFiles": "Max number of files",
      "dimensionsConfigTitle": "Dimension bounds",
      "dimMinWidth": "Min width",
      "dimMaxWidth": "Max width",
      "dimMinHeight": "Min height",
      "dimMaxHeight": "Max height",
      "cancel": "Cancel",
      "save": "Save"
    },
    "groupList": {
      "addField": "Add a field",
      "noGroup": "No group",
      "emptyGroup": "No fields in this group.",
      "addGroup": "Add a group",
      "deleteGroupTooltip": "Delete group"
    },
    "builder": {
      "fieldsTitle": "Technical fields — {{productName}}",
      "previewTitle": "Preview — sales view",
      "loading": "Loading Builder...",
      "loadError": "Unable to load this service's configuration.",
      "noFields": "No fields configured for this service yet.",
      "newGroupPlaceholder": "Group name (e.g. Paper)",
      "cancel": "Cancel",
      "confirmDeleteSpec": "Delete specification \"{{name}}\"? This action cannot be undone.",
      "confirmDeleteGroup": "Delete group \"{{name}}\"? Its fields will be moved to \"No group\"."
    },
    "referenceLists": {
      "title": "Value reference lists",
      "subtitle": "Value lists shared across several services (e.g. paper types, weights).",
      "addNew": "New reference list",
      "technicalKey": "Technical key",
      "technicalKeyPlaceholder": "paper_types",
      "displayName": "Display name",
      "displayNamePlaceholder": "Paper types",
      "create": "Create",
      "cancel": "Cancel",
      "valueCount": "value(s)",
      "empty": "No reference list created yet.",
      "valuePlaceholder": "Value (e.g. A4)",
      "labelPlaceholder": "Displayed label",
      "createError": "Could not create the reference list (key already used?)."
    },
    "valuesModal": {
      "title": "Technical specifications — {{productName}}",
      "subtitle": "Fill in this line's specifications before adding it to the cart.",
      "cancel": "Cancel",
      "confirm": "Add to cart"
    },
    "formRenderer": {
      "selectPlaceholder": "Select..."
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
    "table": {
      "name": "Name",
      "email": "Email",
      "department": "Department",
      "position": "Position",
      "status": "Status",
      "salary": "Salary",
      "actions": "Actions"
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
      "title": "Payroll Scales & Configuration",
      "taxBracketsDesc": "Configure standard payroll parameters for Cameroon",
      "process": "Process this month's payroll",
      "employee": "Employee",
      "period": "Period",
      "netSalary": "Net Salary",
      "paymentDate": "Payment Date",
      "status": "Status",
      "signature": "Signature",
      "status_PENDING": "Pending",
      "status_PAID": "Paid",
      "sign": "Sign",
      "payAction": "Record Payment",
      "detailsTitle": "Payroll Details - {{period}}",
      "recordPaymentTitle": "Record a Payment",
      "recordPaymentSubtitle": "Confirm payment for {{employeeName}} of {{amount}}.",
      "deductions": "Deductions",
      "socialDeductions": "Social Contributions",
      "taxDeductions": "Tax Deductions",
      "absenceDeductions": "Absence Deductions",
      "minWage": "Minimum Wage",
      "cnpsEmployeeRate": "CNPS Employee Rate",
      "success": {
        "updated": "Configuration updated successfully"
      },
      "error": {
        "update": "Error updating configuration"
      },
      "modal": {
        "updateSmigDesc": "Update the minimum wage (SMIG) currently in effect",
        "updateCnpsTitle": "Update CNPS Rates",
        "updateIrppTitle": "Update IRPP Tax Brackets",
        "updateLeaveTitle": "Update Leave Entitlements"
      },
      "form": {
        "minWage": "Minimum Wage",
        "minAmount": "Minimum Amount",
        "maxAmount": "Maximum Amount",
        "rate": "Rate",
        "above": "Above",
        "daysPerYear": "days per year",
        "employeeRate": "Employee Rate",
        "employerRate": "Employer Rate",
        "paid": "Paid",
        "unpaid": "Unpaid"
      },
      "infoBox": {
        "title": "Note"
      },
      "infoBoxText": "These are the standard rates for Cameroon 2024. All values are used automatically when calculating employee payroll. Changes will apply to future payroll calculations."
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
    "bankingDetails": "Banking Details",
    "bankName": "Bank Name",
    "bankAccountNumber": "Account Number (RIB/IBAN)",
    "maritalStatus": "Marital Status",
    "maritalStatusOptions": {
      "SINGLE": "Single",
      "MARRIED": "Married",
      "DIVORCED": "Divorced",
      "WIDOWED": "Widowed"
    },
    "numberDependents": "Number of Dependents",
    "dependentsHelperText": "For tax deduction calculation",
    "form": {
      "sections": {
        "personal": "Personal Information",
        "professional": "Professional Information",
        "salary": "Salary & Compensation",
        "documents": "Documents",
        "leaves": "Leave Entitlements"
      },
      "salarySection": {
        "title": "Salary & Compensation",
        "subtitle": "Financial information",
        "baseSalary": "Base Salary",
        "baseSalaryHelper": "Minimum salary (FCFA)",
        "bonus": "Bonus",
        "bonusHelper": "Additional compensation (FCFA)",
        "paymentMethod": "Payment Method"
      },
      "documentsSection": {
        "title": "Documents",
        "subtitle": "Employee documentation",
        "uploadMessage": "📄 Document upload functionality would be implemented here"
      },
      "leavesSection": {
        "title": "Leave Entitlements",
        "subtitle": "Leave balance configuration",
        "tabBalance": "Leave Balance",
        "tabRecords": "Leave History"
      }
    },
    "cancel": "Cancel",
    "leaves": {
      "leaveHistory": "Leave History",
      "addLeaveRecord": "Record Leave",
      "noRecords": "No leave records",
      "daysHelper": "Number of leave days",
      "unpaidHelperText": "Unpaid leave days",
      "balanceInfo": "Available leave balance",
      "leaveType": "Leave Type",
      "days": "Days",
      "startDate": "Start Date",
      "endDate": "End Date",
      "configureBalance": "Configure Leave Balance"
    },
    "documents": {
      "title": "Documents",
      "addDocument": "Add Document",
      "document": "Document",
      "name": "Document Name",
      "type": "Document Type",
      "expiryDate": "Expiry Date",
      "status": "Status",
      "selectType": "Select a type",
      "noDocuments": "No documents added",
      "file": "File",
      "selectFile": "Select a file",
      "fileSelected": "File selected",
      "noFileSelected": "No file selected",
      "contract": "Employment Contract",
      "idCard": "ID Card / National ID",
      "workPermit": "Work Permit",
      "diplomas": "Diplomas & Certifications",
      "uploaded": "✓ Uploaded",
      "download": "Download",
      "remove": "Remove",
      "dragOrClick": "Drag and drop your file here, or click to select",
      "addDiplomas": "Add Diplomas & Certifications",
      "diplomasHelper": "You can upload multiple diplomas and certification documents",
      "uploadedDiplomas": "Uploaded Diplomas",
      "requirements": "Required documents: Employment Contract, ID Card/National ID, and Work Permit. Diplomas are optional but recommended."
    },
    "documentType": {
      "idCard": "ID Card",
      "passport": "Passport",
      "contract": "Contract",
      "cv": "CV",
      "diploma": "Diploma",
      "other": "Other"
    },
    "documentStatus": {
      "valid": "Valid",
      "expired": "Expired",
      "pending": "Pending"
    },
    "leaveType": {
      "annual": "Annual Leave",
      "sick": "Sick Leave",
      "personal": "Personal Leave",
      "maternity": "Maternity Leave",
      "paternity": "Paternity Leave",
      "other": "Other Leave",
      "unpaid": "Unpaid Leave"
    },
    "leaveBalance": {
      "title": "Leave Balance",
      "summary": "Summary",
      "totalDays": "Total Days",
      "days": "days",
      "unpaidLeave": "Unpaid Leave",
      "totalEntitlements": "Total Leave Entitlements"
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
    },
    "stats": {
      "totalEmployees": "Total Employees",
      "totalEmployeesSubtitle": "Active & all statuses",
      "active": "Active",
      "activeSubtitle": "% of workforce",
      "onLeave": "On Leave",
      "onLeaveSubtitle": "Currently away",
      "recentlyAdded": "Recently Added",
      "recentlyAddedSubtitle": "Last 30 days"
    },
    "actions": {
      "export": "Export",
      "csv": "CSV",
      "pdf": "PDF",
      "edit": "Edit",
      "delete": "Delete",
      "view": "View",
      "confirm": "Are you sure?"
    },
    "details": {
      "personalInfo": "Personal Information",
      "firstName": "First Name",
      "lastName": "Last Name",
      "birthDate": "Birth Date",
      "nationality": "Nationality",
      "phone": "Phone",
      "email": "Email",
      "address": "Address",
      "professionalInfo": "Professional Information",
      "department": "Department",
      "position": "Position",
      "workLocation": "Work Location",
      "hireDate": "Hire Date",
      "contractType": "Contract Type",
      "status": "Status",
      "yearsOfService": "Years of Service",
      "contract": "Contract",
      "salary": "Salary & Compensation",
      "baseSalary": "Base Salary",
      "bonus": "Bonus",
      "paymentMethod": "Payment Method",
      "lastSalaryAdjustment": "Last Salary Adjustment",
      "leaveEntitlements": "Leave Entitlements",
      "cameroonInfo": "Cameroon Information",
      "cnpsNumber": "CNPS Number",
      "cnpsCategory": "CNPS Category",
      "taxId": "N-tif",
      "maritalStatus": "Marital Status",
      "bankAccount": "Bank Account",
      "bankAccountNumber": "Bank Account Number",
      "documents": "Documents",
      "idCard": "ID Card",
      "workPermit": "Work Permit",
      "diplomas": "Diplomas"
    },
    "payrollInfo": {
      "cameroonPayroll": "Cameroon Payroll",
      "belowSmig": "Salary below SMIG",
      "grossSalary": "Gross Salary",
      "smig": "SMIG 2024",
      "deductions": "Deductions",
      "cnpsEmployee": "CNPS Employee (11%)",
      "cnpsEmployer": "Employer Contribution (17.6%)",
      "fcfa": "FCFA",
      "taxInfo": "Tax Info",
      "dependents": "Dependents",
      "taxReduction": "Tax reduction"
    },
    "editEmployee": "Edit Employee",
    "addEmployee": "Add Employee",
    "updateEmployee": "Update Employee"
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
    "allSubsidiaries": "All subsidiaries",
    "allCommercials": "All sales reps",
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
      "allPriorities": "All priorities",
      "complete": "completed",

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
        "log": "Enregistrer"
      },
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
      "log": "Enregistrer"
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
    "description": "View and record maintenance interventions by equipment.",
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
      "maintenanceDate": "Maintenance Date",
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
    "acquisitionValue": "Acquisition Value",
    "status_OPERATIONAL": "Operational",
    "status_UNDER_MAINTENANCE": "Under maintenance",
    "status_OUT_OF_SERVICE": "Out of service",
    "status_NEEDS_MAINTENANCE": "Needs maintenance"
  },
  "notifications": {
    "title": "Notifications",
    "markAllAsRead": "Mark all as read",
    "markAsRead": "Mark as read",
    "noNotifications": "No notifications",
    "error": {
      "loading": "Error loading notifications",
      "markAsRead": "Error marking notification as read",
      "markAllAsRead": "Error marking all notifications as read"
    },
    "types": {
      "EXTERNAL_TRANSACTION_CREATED": "External Transaction Created",
      "EXTERNAL_TRANSACTION_UPDATED": "External Transaction Updated",
      "EXTERNAL_TRANSACTION_VALIDATED": "External Transaction Validated",
      "EXTERNAL_TRANSACTION_CANCELLED": "External Transaction Cancelled",
      "EXTERNAL_TRANSACTION_DELETED": "External Transaction Deleted"
    }
  },
  "bonDeCommande": {
    "title": "Purchase Order",
    "orderNum": "Order Number",
    "date": "Date",
    "dueDate": "Due Date",
    "billedTo": "Billed To",
    "item": "Product",
    "items": "Order Details",
    "quantity": "Quantity",
    "unitPrice": "Unit Price",
    "totalPrice": "Total",
    "total": "TOTAL",
    "paymentMethod": "Payment Method",
    "paymentDueDate": "Payment Due Date",
    "print": "Print",
    "exportPdf": "Export to PDF",
    "footer": "Thank you for your trust. This order is valid until",
    "status": "Status",
    "noData": "No orders"
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
  setLanguage: () => { },
  t: (key: string) => key,
  formatCurrency: (amount: number) => String(amount),
  formatNumber: (amount: number) => String(amount),
});

export const useI18n = () => useContext(I18nContext);

type I18nProviderProps = { children: React.ReactNode };

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
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
    // Gérer les valeurs NaN, null, undefined ou non numériques
    if (isNaN(amount) || amount === null || amount === undefined || typeof amount !== 'number') {
      return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XOF', // CFA Franc
      }).format(0);
    }

    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'XOF', // CFA Franc
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
