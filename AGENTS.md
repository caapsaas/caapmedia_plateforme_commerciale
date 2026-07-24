# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Repository layout

This is a two-app monorepo, no shared root package.json/workspace tooling — each app is developed independently:

- `backend/` — NestJS 11 + TypeScript API (ERP/CRM/e-commerce backend for "CaapMedia")
- `Frontend/` — React 18 + Vite + TypeScript SPA (dashboard + public storefront)
- `Doc/` — French-language accounting reference docs (plan comptable, cycles comptables) used as domain knowledge for the `accounting` module

Always `cd` into `backend` or `Frontend` before running any command — there is no root-level script runner.

## Commands

### Backend (`backend/`)
```bash
npm run start:dev       # dev server, watch mode (NestExpressApplication, port from .env or 3000)
npm run build            # nest build
npm run lint              # eslint --fix on src/apps/libs/test
npm run format            # prettier --write
npm test                  # jest unit tests (single: npx jest path/to/file.spec.ts)
npm run test:watch
npm run test:e2e          # jest --config ./test/jest-e2e.json
npm run test:cov
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma generate                     # regenerate client (also runs on postinstall)
npm run seed               # npx ts-node prisma/seeds.ts
npm run seed:employees     # npx ts-node prisma/seeders/employee.seeder.ts
```
Before considering backend work done: `npm run lint && npm test` (and `tsc`/build if types were touched).

### Frontend (`Frontend/`)
```bash
npm run dev        # vite dev server
npm run build       # vite build
npm run preview     # preview production build
```
There is no configured lint/test script for the frontend package — rely on TypeScript (`strict: true`) and manual verification in the browser for UI changes.

## Architecture

### Backend — NestJS, domain-modules over Prisma

`src/app.module.ts` wires one Nest module per business domain, each domain typically has its own subdirectory with nested feature modules:

- `common/` — cross-cutting: `auth` (JWT strategy/guards, roles, subsidiary scoping), `subsidiaries`, `utils` (Prisma service, email, logger)
- `accounting/` — `accounts`, `entries`, `journals`, `journalization`, `periods`, `reports` (double-entry bookkeeping engine; see `Doc/plan_comptable.md` and `Doc/cycles_comptables_testables.txt` for the accounting rules this module implements)
- `crm/` — `accounts`, `contacts`, `contracts`, `crmtasks`, `interactions`, `leads`, `opportunities`
- `ecommerce/` — `orders`, `products`, `sales`, `taxes`
- `finance/` — `assets`, `balancesheet`, `debts`, `expense`, `external-transaction`, `incomestatement`, `prefinancement`, `treasury`
- `hr/` — `employee`, `attendancerecord`, `absencerecord`, `payrollrecord`
- `maintenance/` — `equipement`, `maintenance_record`
- `purchase/` — `purchase-orders`, `suppliers`
- `secretariat/`, `statistics/` (`analytics`, `finances_stats`), `newsletter`

Each feature follows the standard Nest triad: `*.module.ts`, `*.controller.ts`, `*.service.ts`, plus a `dto/` folder with `class-validator` DTOs. Persistence is Prisma (`prisma/schema.prisma`, one large multi-tenant schema keyed by `Subsidiary`) via `PrismaService` (`common/utils/prisma`); TypeORM is a listed dependency but Prisma is the actual ORM in use — don't introduce new TypeORM entities.

**Multi-tenancy**: almost every model hangs off `Subsidiary` (`subsidiaryId`). New queries/mutations must scope by subsidiary — see `SubsidiaryGuard` (`common/auth/subsidiary/subsidiary.guard.ts`) and existing services for the pattern.

**Auth**: JWT-based (`common/auth`), two parallel identities — platform `User` (staff, role-gated via `RoleGuard` + `@Roles()` decorator, `UserRole` enum with `additionalRoles`) and CRM `Contact` (customer-facing accounts, separate `contact-jwt` strategy/guard for the storefront/customer-account routes). Don't mix the two guards.

**API prefix**: global prefix is `api-caapmedia` (set in `main.ts`), static uploads served from `backend/public` under `/public`. CORS origins come from `CORS_ORIGINS` env var (comma-separated), falling back to localhost + `caapmedia.com`.

**Validation**: global `ValidationPipe` with `whitelist: true` and `transform: true` — DTOs are the enforcement point, unlisted properties are stripped automatically.

**Migrations**: Prisma migrations live in `prisma/migrations/`, applied sequentially — never hand-edit an already-applied migration; create a new one. Seeders live in `prisma/seeders/` (per-domain) plus a top-level `prisma/seeds.ts`.

### Frontend — React SPA, route-based, domain-mirrored services

- `router.tsx` — TanStack Router route tree, defined imperatively (`createRoute`/`addChildren`), not file-based. Public routes (`/`, `/realisations`, `/login`, `/account`) sit outside `dashboardRoute`; everything under `/dashboard/*` requires `context.auth.token` (checked in `beforeLoad`, redirects to `/login`). The customer `/account` route instead requires `context.auth.contactToken`.
- `context/AuthContext.tsx` — holds both `user`/`token` (staff) and `contact`/`contactToken` (customer) in parallel, persisted to `localStorage`, hydrated via `GET /auth/Userprofile` / `GET /crm/contacts/profile` on load.
- `context/AppContext.tsx` — UI/global state (sidebar, idle modal, role preview) via reducer, persisted to `localStorage`, rehydration signalled through `isRestored` (routes wait on this in their `loader`).
- `services/api.ts` — single shared Axios instance; request interceptor auto-attaches `Authorization` from `localStorage` (`token`, or `contactToken` for any URL containing `/crm/`). All domain API calls should go through this instance.
- `services/api<Domain>/` — one folder per backend domain (`apiAccounting`, `apiCrm`, `apiFinance`, `apiE-commerce`, `apiMaintenance`, `apiPurchasing`, `apiStatistic`, `apihr`, `apisecretariat`, `apiCommon`), mirroring the backend module split. Add new API calls in the matching domain folder rather than inline in components.
- `Pages/` — top-level route screens; `components/<domain>/` — domain-scoped components mirroring the same backend/service domain split; `components/ui`, `components/common`, `components/icons`, `components/filters` are shared/cross-domain.
- `i18n/` — `react-i18next`, locale files at `i18n/locales/{en,fr}.json`. UI copy should go through this, not hardcoded strings (per global instructions).
- `types/` — `models.ts` (domain entities), `context.ts` (Auth/App context shapes), `forms.ts`, plus a root `types.ts`.
- Styling is Tailwind v4 (via `@tailwindcss/vite`), no CSS modules in this app despite the global Next.js convention.
- The Vite `API_KEY`/`GEMINI_API_KEY` define in `vite.config.ts` powers `services/geminiService.ts` (AI marketing features) — needs `GEMINI_API_KEY` in `Frontend/.env.local`.

### Cross-cutting conventions
- Backend and frontend domain names are meant to line up 1:1 (`finance` ↔ `apiFinance`, `crm` ↔ `apiCrm`, etc.) — when adding a feature, place backend and frontend code in the matching domain folder on each side.
- Backend dev API origin is hardcoded to `http://localhost:3000/api-caapmedia` in `services/api.ts` (production URL is commented out above it) — check this before assuming an env-based switch exists.
