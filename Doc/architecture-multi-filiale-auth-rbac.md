# Plan d'architecture — Multi-filiale, Authentification, RBAC

> **Suivi d'implémentation** (branche `feat/multi-filiale-auth-rbac`) :
> - ✅ Phase 0 — quick wins sécurité (`/auth/register` protégé, secret JWT fail-fast, guards sur `finances-stats/*`)
> - ✅ Phase 1 — modèle de données (`SUPER_ADMIN` dans l'enum, `Subsidiary.isHeadquarter`, `User.roles[]` backfillé). Nuance par rapport au plan initial : `userRole`/`additionalRoles` sont **conservés en parallèle** de `roles[]` pour l'instant (au lieu d'être supprimés immédiatement) — retrait prévu en phase 4 une fois tous les guards/le frontend migrés dessus, pour réduire le risque d'un big-bang.
> - ✅ Phase 2 — multi-filiale : `subsidiary-scope.ts` + migration de `analytics`, `finance/balancesheet`, `finance/incomestatement`, `auth.service` (getAllUsers/searchUsers) ; corrige une IDOR reelle (subsidiaryId de requete non verifie contre l'utilisateur). **Correction post-retour utilisateur** : SUPER_ADMIN n'a PAS de page dediee — il partage exactement les memes vues/routes `/dashboard/*` qu'ADMIN, seule la donnee change (consolidee au lieu de filtree sur la filiale), deja automatique cote backend pour les modules migres. La route `/super-admin` et la page `SuperAdminDashboard` initialement créées ont été supprimées. **Reste a migrer** (module par module, meme pattern) : ecommerce, crm, finance (assets/debts/expense/treasury/prefinancement/external-transaction), hr, purchase, accounting, maintenance, secretariat — tant que ce n'est pas fait, SUPER_ADMIN ne voit PAS de donnees consolidees sur ces vues-la (juste sa propre filiale, comme ADMIN). Le doublon `finance/balancesheet`+`incomestatement` vs `statistics/finances_stats` sur les memes routes n'est pas encore dedupliqué.
> - ✅ Phase 3 — authentification, **terminée**. Cookies httpOnly (access 15 min + refresh 30 jours avec rotation et détection de réutilisation), `POST /auth/refresh`, logout qui révoque réellement (avant : no-op), CSRF double-submit cookie, `helmet` actif, frontend migré (plus de token en `localStorage`, `withCredentials`, intercepteur refresh-retry) — login confirmé fonctionnel en navigateur réel par l'utilisateur. 2FA (TOTP) via `otplib`+`qrcode` : setup/verify/disable/login, codes de secours à usage unique, page `SecuritySettings` (`/dashboard/security`). Rate limiting dédié sur les routes sensibles (login, 2FA, forgot-password) + journal d'audit (`AuthAuditLog`, consultable via `GET /auth/audit-log` pour SUPER_ADMIN). **Découverte en vérifiant le rate limiting** : `ThrottlerGuard` n'était branché nulle part dans l'app (`ThrottlerModule.forRoot()` seul ne suffit pas, il faut `APP_GUARD`) — aucune limite n'a jamais été active, même le throttle global censé exister depuis le début. Corrigé. Vérifié en HTTP réel (login/refresh/logout/CSRF/2FA/rate-limit/audit-log, dizaines de scénarios cumulés sur les sous-phases) ; pas de clic réel en navigateur sur le 2FA/audit-log spécifiquement (pas d'outil de rendu disponible).
> - 🟡 Phase 4 — RBAC finalisé. **Fait** : bypass `SUPER_ADMIN` dans `RoleGuard`/`checkRole` (avancé depuis la phase 2) ; audit systématique des 26 controllers à restriction de rôle — aucun 4e cas du bug "guard jamais branché" trouvé (après RoleGuard×5 et ThrottlerGuard trouvés en phases 2/3h) ; `RoleGuard` corrigé pour vérifier `roles[]` en entier (logique OR) au lieu du seul rôle principal — bug réel confirmé et corrigé (un utilisateur avec un rôle secondaire ne passait jamais les routes gardées par ce rôle) ; les 80 usages de `@SetMetadata('roles', [...])` unifiés en `@Roles(...)`. **Reste** : suppression des champs legacy `userRole`/`additionalRoles` (gros chantier, touche des dizaines de fichiers, pas encore commencé), garde de route par rôle généralisée côté frontend (aujourd'hui seule la présence du token est vérifiée par route, pas le rôle — seul le menu Sidebar cache visuellement).

Document de cadrage pour 3 chantiers structurants sur `caapmedia_plateforme_commerciale_v2` :
1. Architecture multi-filiale (dashboard filiale + dashboard super-admin consolidé)
2. Authentification (cookies httpOnly, 2FA, refresh token, durcissement)
3. Multirole / RBAC (rôles, accès par rôle)

Basé sur un audit du code actuel (backend NestJS + Prisma, frontend React + TanStack Router) et sur l'analyse du projet `gmo-plateforme-commerciale-241025`, cité comme référence.

---

## 0. Ce qu'il faut savoir avant de commencer

**Correction sur la référence gmo-plateforme** : elle a bien du httpOnly et du multirole (tableau `roles[]` réel, pas juste un enum scalaire), mais **pas de 2FA** (aucune lib, aucun champ DB — vérifié par grep exhaustif) et **pas de CSRF** (`helmet` est en dépendance mais jamais activé). Le 2FA et le CSRF de ce plan sont donc conçus from scratch, rien à copier-coller de là-bas sur ces deux points.

**Ce qui est réellement réutilisable de gmo-plateforme** :
- Le pattern cookie httpOnly + fallback Bearer dans la stratégie Passport JWT.
- Le pattern de scoping multi-filiale (`subsidiary-scope.ts`) : c'est propre, centralisé, et couvre exactement le besoin "dashboard filiale vs vue consolidée".
- Le modèle `roles: UserRole[]` + `activeRole` porté dans le JWT avec un endpoint `switch-role` — plus cohérent que le split actuel `userRole` / `additionalRoles`.

**Dépendance technique entre les 3 chantiers** : l'ordre demandé (1. multi-filiale, 2. auth, 3. rôles) est le bon ordre produit/métier, mais techniquement le modèle de rôle (chantier 3) conditionne ce qui part dans le JWT (chantier 2) et la logique de scope filiale/super-admin (chantier 1) repose sur ce même JWT. Recommandation : traiter le **modèle de données rôle + filiale d'abord** (petite partie du chantier 3, low-risk, surtout backend), puis dérouler 1 et 2 dans l'ordre annoncé. Le détail est dans la section 5 (séquencement).

---

## 1. État des lieux — audit du code actuel

### 1.1 Authentification backend (`backend/src/common/auth/`)

| Point | État actuel | Problème |
|---|---|---|
| Transport du token | `access_token` renvoyé dans le **corps JSON** de la réponse | Le frontend le stocke en `localStorage` → exposé au XSS |
| Secret JWT | `process.env.JWT_SECRET \|\| 'your-secret-key'` | Fallback en dur, secret prévisible si la var d'env est absente |
| Expiration | Fixe à 60 min (`auth.module.ts`) | Pas configurable, pas de refresh |
| Refresh token | Aucun | Reconnexion forcée toutes les heures, ou expiration jamais gérée proprement |
| Révocation / logout | `POST /auth/logout` ne fait que logguer — le commentaire dans le code dit explicitement qu'un JWT stateless ne peut pas être invalidé | Un token volé reste valide jusqu'à expiration, même après "déconnexion" |
| `POST /auth/register` | **Aucun guard** | N'importe qui peut créer un compte, y compris `ADMIN` |
| `RoleGuard` | Compare `requiredRoles` à `user.role` uniquement | Ignore `user.additionalRoles` pourtant présent dans le payload JWT — incohérent avec `checkRole()` (utilitaire manuel) qui lui vérifie tous les rôles |
| `SubsidiaryGuard` | Existe, mais aucun `@SetMetadata('subsidiaryId', ...)` n'est posé nulle part | Guard mort, aucun effet réel |
| `finance/balancesheet/balancesheet.controller.ts` | Aucun `@UseGuards` | Bilan comptable et consolidé lisible sans authentification |
| CORS | `credentials: true` déjà configuré | Prêt pour des cookies cross-origin, rien à changer ici |
| `helmet`, `cookie-parser` | Absents de `main.ts` | À ajouter |

### 1.2 Authentification frontend

- Token stocké en `localStorage` (`AuthContext.tsx`), attaché manuellement via un interceptor Axios (`services/api.ts`).
- `router.tsx` : la seule vérification de route est `if (!context.auth.token)` sur `/dashboard` — **présence** du token, pas validité, pas rôle. Aucune sous-route (`/dashboard/finance`, `/dashboard/hr`...) n'a de garde par rôle : seul le masquage du menu `Sidebar.tsx` limite l'accès visuellement. Le backend reste la seule vraie barrière aujourd'hui — et on vient de voir qu'il a des trous (register public, balance-sheet sans guard).

### 1.3 Modèle de rôles actuel (Prisma)

```prisma
enum UserRole {
  ADMIN
  COMMERCIAL
  CAISSIER
  PURCHASING_MANAGER
  FINANCIAL_DIRECTOR
  SECRETARY
  HR_MANAGER
  PRODUCTION_DIRECTOR
}

model User {
  userRole        UserRole
  additionalRoles UserRole[] @default([])
  subsidiaryId    String
  ...
}
```

Bonne nouvelle : les rôles métier que tu listes (Admin, commercial, secrétaire, directeur d'achat...) sont **déjà quasiment tous là** (`PURCHASING_MANAGER` = directeur d'achat). Il manque principalement **`SUPER_ADMIN`**. Le RBAC est déjà appliqué sur 26 controllers, mais via deux mécanismes redondants (`@Roles(...)` et `@SetMetadata('roles', [...])` posé à la main) qu'il faudra unifier.

### 1.4 Multi-filiale actuel

Le modèle `Subsidiary` est déjà central (113 références à `subsidiaryId` dans le schema), mais l'isolation par filiale est gérée **service par service, à la main** (`where: { subsidiaryId: currentUser.subsidiaryId }` copié-collé), sans utilitaire commun. Il n'y a **aucun rôle ni concept de "super-admin"** distinct de `ADMIN` — le seul embryon de vue consolidée est dans `balancesheet.controller.ts` ("si `subsidiaryId` non fourni, retourne le bilan consolidé"), non protégé et non généralisé aux autres modules.

---

## 2. Chantier 1 — Architecture multi-filiale

### 2.1 Modèle de données

Ajouter le rôle `SUPER_ADMIN` à l'enum `UserRole`. Ne pas rendre `subsidiaryId` nullable sur `User` (trop de code et 113 relations en dépendent) : suivre le pattern gmo-plateforme — le super-admin reste rattaché à une filiale "siège", identifiée par un flag :

```prisma
model Subsidiary {
  // ...
  isHeadquarter Boolean @default(false) @map("is_headquarter")
}

enum UserRole {
  SUPER_ADMIN   // nouveau
  ADMIN
  COMMERCIAL
  CAISSIER
  PURCHASING_MANAGER
  FINANCIAL_DIRECTOR
  SECRETARY
  HR_MANAGER
  PRODUCTION_DIRECTOR
}
```

Un seul enregistrement `Subsidiary` a `isHeadquarter = true`. Le `SUPER_ADMIN` y est rattaché comme n'importe quel `User`, mais son rôle lui donne un scope global au lieu d'un scope filiale.

### 2.2 Couche de scoping (backend) — le vrai cœur du chantier

Porter un utilitaire équivalent à `subsidiary-scope.ts` de gmo-plateforme, dans `backend/src/common/utils/subsidiary-scope.ts` :

- `resolveScopeContext(user)` → dérive `{ subsidiaryId, hasGlobalScope }` depuis le JWT décodé.
- `hasGlobalScope(ctx, allowedRoles)` → `true` seulement si `SUPER_ADMIN` (ou un rôle explicitement autorisé en vue consolidée pour un module donné, ex. `FINANCIAL_DIRECTOR` sur les rapports financiers).
- `withSubsidiaryScope(prismaWhere, ctx)` → injecte `subsidiaryId` dans la clause `where` si pas de scope global, sinon laisse passer.
- `assertSubsidiaryAccess(entity.subsidiaryId, ctx)` → à appeler après un `findUnique` pour empêcher qu'un ID d'une autre filiale soit consultable en devinant l'UUID.

**Pourquoi cette couche plutôt qu'un guard de route** : un guard tout-ou-rien (comme l'actuel `SubsidiaryGuard`, mort) ne peut pas exprimer "consolidé si super-admin, filtré sinon" — c'est une logique de requête, pas d'accès à la route. Prévoir aussi de retirer `SubsidiaryGuard` une fois la couche de scoping en place (code mort sinon).

Migration module par module (ne pas tout faire d'un coup) — prioriser dans cet ordre, guidé par "vue consolidée de tous les modules" :
1. `statistics/analytics`, `finance/balancesheet` (déjà l'embryon de consolidation, les corriger en premier)
2. `ecommerce` (orders, sales) — cœur d'activité
3. `crm`, `finance`, `hr`, `purchase`, `accounting`, `maintenance`, `secretariat` — reste des modules

### 2.3 Frontend

**Décision (corrigée après retour utilisateur, implémentée)** : pas de route dédiée `/super-admin`. `SUPER_ADMIN` utilise exactement les mêmes routes `/dashboard/*` et le même menu qu'`ADMIN` — seule la donnée affichée diffère (consolidée toutes filiales au lieu de filtrée), ce qui est déjà automatique côté backend une fois un module migré vers `subsidiary-scope.ts` (aucun flag ni composant spécifique requis côté frontend pour ça).

- `Sidebar.tsx` : `SUPER_ADMIN` partage le même `case` qu'`ADMIN` dans le switch de navigation (fallthrough), pas de menu séparé.
- `router.tsx` : pas de route séparée à garder par rôle pour ce cas — `SUPER_ADMIN` passe par `/dashboard/*` comme n'importe quel autre rôle authentifié.
- Un sélecteur de filiale (drill-down manuel pour consulter une filiale précise plutôt que la vue consolidée par défaut) reste une piste valable pour plus tard, mais n'est pas demandé pour l'instant — à ajouter uniquement si le besoin se confirme (YAGNI).

---

## 3. Chantier 2 — Authentification

### 3.1 Cookies httpOnly + refresh token

Remplacer le JWT unique renvoyé en JSON par deux cookies httpOnly :

| Cookie | Contenu | Durée | Usage |
|---|---|---|---|
| `access_token` | JWT signé, payload `{ sub, subsidiaryId, activeRole, roles }` | 15 min | Envoyé à chaque requête, vérifié par `JwtStrategy` |
| `refresh_token` | JWT opaque ou random token | 7–30 jours | Utilisé uniquement sur `POST /auth/refresh`, `path` restreint à cette route |

```ts
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,
});
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api-caapmedia/auth/refresh',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
```

**Révocation réelle** (ce qui manque dans les deux projets existants) : stocker le refresh token **hashé** en base (nouvelle table `RefreshToken` : `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`). À chaque refresh : rotation (l'ancien est révoqué, un nouveau est émis) — permet de détecter un vol de refresh token (réutilisation d'un token déjà révoqué = signal d'alerte, on peut révoquer toute la session). Le logout devient réel : `DELETE`/`revokedAt = now()` sur la ligne correspondante, plus `res.clearCookie` des deux cookies.

### 3.2 CSRF

`sameSite: strict` couvre l'essentiel mais pas tout (navigation directe, certains contextes). Ajouter une protection CSRF explicite puisqu'aucun des deux projets ne l'a : pattern double-submit cookie — un cookie **non httpOnly** `csrf_token` lisible par le JS, renvoyé en header `X-CSRF-Token` sur chaque requête mutante (`POST`/`PUT`/`PATCH`/`DELETE`), vérifié côté serveur par un middleware/guard dédié qui compare cookie vs header.

### 3.3 Double authentification (2FA — TOTP)

À construire intégralement (absent des deux codebases) :

- Lib : `otplib` (maintenue activement) + `qrcode` pour l'enrôlement.
- Modèle `User` : `twoFactorSecret String?`, `twoFactorEnabled Boolean @default(false)`, `twoFactorRecoveryCodes String[]` (codes hashés, usage unique).
- Flow d'activation : `POST /auth/2fa/setup` (génère secret + QR code) → utilisateur scanne → `POST /auth/2fa/verify` (confirme un code TOTP valide) → `twoFactorEnabled = true` + génération de recovery codes affichés une seule fois.
- Flow de login si 2FA actif : après validation du mot de passe, ne pas émettre les cookies finaux tout de suite — renvoyer un token intermédiaire court (`pending_2fa`, 5 min, non utilisable sur les autres routes) ; `POST /auth/2fa/login` avec ce token + code TOTP émet alors les cookies `access_token`/`refresh_token` définitifs.
- Recovery code accepté en remplacement du TOTP une seule fois, puis invalidé.

### 3.4 Autres durcissements (indépendants mais à faire dans ce chantier)

- `JWT_SECRET` : plus de fallback en dur. Valider les variables d'env au démarrage (schéma de validation `@nestjs/config` avec `Joi`/`Zod`, fail-fast si absent) — cohérent avec la règle globale "pas de `process.env` direct dans le code, passe par une config validée".
- Protéger `POST /auth/register` : réservé à `ADMIN`/`SUPER_ADMIN` (création de compte interne par un admin), pas d'auto-inscription publique pour les comptes staff.
- Activer `helmet` dans `main.ts`.
- Rate limiting dédié et plus strict sur `/auth/login`, `/auth/2fa/*`, `/auth/refresh` (le `ThrottlerModule` global existe déjà à 10 req/60s, prévoir un guard spécifique plus serré sur ces routes sensibles).
- Table d'audit des événements d'auth (login réussi/échoué, activation 2FA, changement de rôle, refresh suspect) — utile pour la détection d'anomalies, cohérent avec "si tu vois du code qui fuit des données sensibles, arrête et dis-le moi".
- Politique de mot de passe (longueur min, complexité) validée par `class-validator` sur les DTO d'auth.

### 3.5 Frontend

- Supprimer tout usage de `localStorage` pour le token. Axios : `withCredentials: true`, plus d'`Authorization` géré manuellement pour les users internes (garder le principe actuel pour le token `contact` du portail client, à traiter séparément ou migrer aussi en cookie httpOnly dédié).
- Lire le `csrf_token` depuis son cookie et l'injecter en header sur les requêtes mutantes (interceptor Axios).
- Gestion du refresh : interceptor Axios sur 401 → tentative `POST /auth/refresh` → rejoue la requête initiale ; si le refresh échoue aussi → redirection `/login`.
- Écran de saisie du code 2FA après login si le backend répond "2FA requise".

---

## 4. Chantier 3 — Multirole / RBAC

### 4.1 Modèle de rôle unifié

Remplacer le split `userRole` (scalaire) + `additionalRoles` (tableau) par un modèle unique, comme gmo-plateforme :

```prisma
model User {
  roles      UserRole[] @map("roles")   // tous les rôles possédés
  // activeRole n'est pas stocké en DB, il vit dans le JWT
}
```

- Migration Prisma : `roles = [userRole, ...additionalRoles]` (dédupliqué) en backfill, puis suppression des deux anciens champs.
- `POST /auth/switch-role` : l'utilisateur choisit son `activeRole` parmi `user.roles`, ré-émission du cookie `access_token` avec ce claim. Résout l'ambiguïté actuelle (le `RoleGuard` ne regardait que `userRole`, ignorant les rôles additionnels).

### 4.2 Guards unifiés (backend)

Un seul mécanisme au lieu de deux : décorateur `@Roles(...UserRole[])` + `RolesGuard` qui vérifie `requiredRoles.includes(user.activeRole)`. Supprimer les usages bruts de `@SetMetadata('roles', [...])` restants, les remplacer par `@Roles(...)` partout pour la cohérence et la lisibilité.

**Décision de conception (ajoutée après implémentation de la phase 1)** : `SUPER_ADMIN` doit **bypasser automatiquement** tout check de rôle dans `RolesGuard`, plutôt que d'être ajouté manuellement à chaque `@Roles(...)` sur les ~26 controllers existants. L'ajout manuel partout est exactement le genre d'oubli qui a produit le trou de sécurité sur `finances-stats/*` (section 1.1) — un bypass centralisé dans le guard est plus sûr et plus simple à maintenir. Concrètement : `if (user.roles.includes(UserRole.SUPER_ADMIN)) return true;` avant la vérification `requiredRoles.includes(...)`.

À corriger dans la foulée (relevé dans l'audit, section 1.1) :
- ~~Ajouter un guard sur `finance/balancesheet/balancesheet.controller.ts`~~ et `finance/incomestatement/incomestatement.controller.ts` — fait en phase 0 (guard `[ADMIN, FINANCIAL_DIRECTOR]` en attendant la dédup avec `statistics/finances_stats` qui expose les mêmes routes en double, voir phase 2).
- Revoir les controllers où la liste de rôles autorisés est trop large par facilité (ex. gestion des users ouverte à `COMMERCIAL`/`SECRETARY` — à restreindre à `ADMIN`/`SUPER_ADMIN`/`HR_MANAGER` selon le cas réel).

### 4.3 Frontend

- `useHasRole.ts` existe déjà et est cohérent avec le futur modèle unifié (`[user.activeRole]` au lieu de `[user.userRole, ...additionalRoles]`) — à adapter, pas à réécrire.
- Ajouter une vraie garde de route par rôle dans `router.tsx` (aujourd'hui seule la présence du token est vérifiée) : chaque route du dashboard déclare les rôles autorisés dans sa config, vérifiés dans `beforeLoad` contre `context.auth.user.activeRole`, avec redirection (page 403 ou dashboard par défaut) si non autorisé — ne plus compter uniquement sur le masquage du menu.

---

## 5. Séquencement recommandé

| Phase | Contenu | Pourquoi à cet ordre |
|---|---|---|
| **0. Quick wins sécurité** | Protéger `/auth/register`, retirer le fallback `JWT_SECRET`, guard sur `balancesheet.controller.ts` | Failles actives dès aujourd'hui, indépendantes des 3 chantiers, à corriger sans attendre |
| **1. Socle rôle + filiale (data model)** | Enum `UserRole` unifié (+`SUPER_ADMIN`), migration `roles[]`, flag `isHeadquarter` sur `Subsidiary` | Chantier 3 en petit format — tout le reste (JWT, scoping, guards) dépend de ce modèle |
| **2. Multi-filiale (chantier 1)** | Couche `subsidiary-scope.ts`, migration module par module, dashboard super-admin | Peut avancer avec l'auth actuelle en parallèle, pas bloquant |
| **3. Authentification (chantier 2)** | Cookies httpOnly + refresh + CSRF + 2FA | Le plus gros changement frontend (retrait localStorage) — à faire une fois le modèle de rôle stabilisé pour ne pas migrer le payload JWT deux fois |
| **4. RBAC finalisé (reste du chantier 3)** | Guards unifiés, `switch-role`, garde de route frontend | Vient naturellement une fois les cookies et le modèle de rôle en place |

---

## 6. Ce que ce document ne couvre pas (à trancher plus tard, hors scope immédiat)

- Permissions granulaires au-delà des rôles (ex. table `Permission` par action) — non nécessaire pour l'instant vu le nombre de rôles (YAGNI), à reconsidérer seulement si un rôle a besoin d'accès partiels à un module.
- Migration du token `contact` (portail client CRM) vers cookie httpOnly — même logique que pour les users internes, mais à traiter comme un sous-chantier séparé pour ne pas mélanger deux populations d'utilisateurs dans la même migration.
- SSO / OAuth externe — non demandé, pas dans le périmètre actuel.
