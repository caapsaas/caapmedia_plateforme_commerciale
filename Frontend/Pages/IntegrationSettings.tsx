import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import Pagination from '../components/common/Pagination';
import IconSettings from '../components/icons/IconSettings';
import { useAuth } from '../context/AuthContext';
import { useClientPagination } from '../hooks/useClientPagination';
import { useI18n } from '../i18n';
import {
  CheckState,
  getIntegrationChecks,
  getIntegrations,
  Integration,
  IntegrationCheck,
  IntegrationCategory,
} from '../services/apiCommon/apiIntegrations';
import { UserRole } from '../types';

const categories: IntegrationCategory[] = ['infrastructure', 'server', 'browser', 'seed', 'link'];
const checkStates: CheckState[] = ['passed', 'failed', 'stale', 'neverChecked', 'requiresSetup', 'inactive'];
const buttonClass = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

function CheckBadge({ state }: { state: CheckState | 'skipped' }) {
  const { t } = useI18n();
  const colors = state === 'passed' ? 'bg-emerald-100 text-emerald-900'
    : state === 'failed' ? 'bg-red-100 text-red-900'
    : state === 'stale' || state === 'requiresSetup' ? 'bg-amber-100 text-amber-950'
    : 'bg-slate-100 text-slate-700';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{t(`integrationAudit.state.${state}`)}</span>;
}

function CheckDate({ check }: { check: IntegrationCheck }) {
  const { language } = useI18n();
  return <time dateTime={check.checkedAt}>
    {new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(check.checkedAt))}
  </time>;
}

function CheckHistory({ entry }: { entry: Integration }) {
  const { t } = useI18n();
  const [previousCursors, setPreviousCursors] = useState<number[]>([]);
  const cursor = previousCursors.at(-1);
  const { data, isPending, isError, isPlaceholderData } = useQuery({
    queryKey: ['integration-checks', entry.id, cursor],
    queryFn: () => getIntegrationChecks(entry.id, cursor),
    placeholderData: keepPreviousData,
    refetchInterval: cursor === undefined ? 60_000 : false,
  });
  const nextCursor = data?.nextBeforeId;
  return <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
    <h3 className="font-semibold text-slate-900">{t('integrationAudit.history')}</h3>
    {isPending && <p role="status" className="mt-3 text-sm text-slate-600">{t('common.loading')}</p>}
    {isError && <p role="alert" className="mt-3 text-sm text-red-800">{t('integrationAudit.historyError')}</p>}
    {data?.checks.length === 0 && <p className="mt-3 text-sm text-slate-600">{t('integrationAudit.noChecks')}</p>}
    {!!data?.checks.length && <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200 text-sm text-slate-700">
      {data.checks.map((check) => <li key={check.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <CheckDate check={check} />
        <CheckBadge state={check.status} />
        {check.durationMs !== null && <span>{t('integrationAudit.duration', { value: check.durationMs })}</span>}
        {check.diagnostic && <span>{t(`integrationAudit.diagnostic.${check.diagnostic}`)}</span>}
      </li>)}
    </ul>}
    {(cursor !== undefined || nextCursor != null) && <div className="mt-3 flex gap-2">
      <button type="button" className={buttonClass} disabled={cursor === undefined || isPlaceholderData}
        onClick={() => setPreviousCursors((stack) => stack.slice(0, -1))}>
        {t('integrationAudit.newer')}
      </button>
      <button type="button" className={buttonClass} disabled={nextCursor == null || isPlaceholderData}
        onClick={() => { if (nextCursor != null) setPreviousCursors((stack) => [...stack, nextCursor]); }}>
        {t('integrationAudit.older')}
      </button>
    </div>}
  </div>;
}

export default function IntegrationSettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const authorized = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;
  const [category, setCategory] = useState('all');
  const [state, setState] = useState('all');
  const [expanded, setExpanded] = useState<string>();
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['integration-audit'],
    queryFn: getIntegrations,
    enabled: authorized,
    refetchInterval: 60_000,
  });

  const filtered = (data ?? []).filter((entry) =>
    (category === 'all' || entry.category === category) &&
    (state === 'all' || entry.checkState === state)
  );
  const { pageItems, meta, setPage } = useClientPagination(filtered, 10);

  if (!authorized) return null;

  return <section className="mx-auto max-w-6xl space-y-5 pb-8 text-slate-900">
    <header>
      <Link to="/dashboard/configuration" className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900">
        {t('configuration.title')}
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
          <IconSettings className="h-7 w-7 text-slate-500" aria-hidden="true" />
          {t('integrationAudit.title')}
        </h1>
        <button type="button" className={buttonClass} disabled={isFetching} onClick={() => void refetch()}>
          {t('integrationAudit.refresh')}
        </button>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">{t('integrationAudit.intro')}</p>
    </header>

    <div className="flex flex-wrap gap-3 border-y border-slate-200 py-3">
      <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {t('integrationAudit.categoryLabel')}
        <select className={buttonClass} value={category} onChange={(event) => {
          setCategory(event.target.value);
          setPage(1);
        }}>
          <option value="all">{t('integrationAudit.all')}</option>
          {categories.map((key) => <option key={key} value={key}>{t(`integrationAudit.category.${key}`)}</option>)}
        </select>
      </label>
      <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {t('integrationAudit.checkLabel')}
        <select className={buttonClass} value={state} onChange={(event) => {
          setState(event.target.value);
          setPage(1);
        }}>
          <option value="all">{t('integrationAudit.all')}</option>
          {checkStates.map((key) => <option key={key} value={key}>{t(`integrationAudit.state.${key}`)}</option>)}
        </select>
      </label>
    </div>
    {isPending && <p role="status" className="text-sm text-slate-600">{t('common.loading')}</p>}
    {isError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{t('integrationAudit.loadError')}</p>}
    {data && filtered.length === 0 && <p className="text-sm text-slate-600">{t('integrationAudit.noMatches')}</p>}
    {!!pageItems.length && <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
      {pageItems.map((entry) => <li key={entry.id}>
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
          <div>
            <h2 className="font-semibold">{t(`integrationAudit.services.${entry.id}.name`)}</h2>
            <p className="mt-1 text-sm text-slate-600">{t(`integrationAudit.services.${entry.id}.usage`)}</p>
            {entry.capability && <p className="mt-1 text-xs text-slate-600">{t(`integrationAudit.capability.${entry.capability}`)}</p>}
          </div>
          <div className="text-sm text-slate-700">
            <p>{t(`integrationAudit.category.${entry.category}`)}</p>
            <p className="mt-1">{t(`integrationAudit.configuration.${entry.configuration}`)}</p>
          </div>
          <div className="text-sm">
            <CheckBadge state={entry.checkState} />
            {entry.lastCheck && <p className="mt-1 text-slate-600"><CheckDate check={entry.lastCheck} /></p>}
            {entry.checkState === 'requiresSetup' && <p className="mt-1 text-slate-600">{t('integrationAudit.diagnostic.missingProbeObject')}</p>}
            {entry.id === 'gemini' && entry.configuration === 'incomplete' && <p className="mt-1 text-slate-600">{t('integrationAudit.geminiSetup')}</p>}
            {entry.checkState === 'failed' && entry.lastCheck?.diagnostic && <p className="mt-1 text-slate-600">{t(`integrationAudit.diagnostic.${entry.lastCheck.diagnostic}`)}</p>}
            {entry.capability && <button type="button" className="mt-2 block font-semibold text-slate-700 underline underline-offset-4"
              aria-expanded={expanded === entry.id}
              onClick={() => setExpanded((id) => id === entry.id ? undefined : entry.id)}>
              {t('integrationAudit.history')}
            </button>}
          </div>
        </div>
        {expanded === entry.id && <CheckHistory key={entry.id} entry={entry} />}
      </li>)}
    </ul>}
    <Pagination meta={meta} onPageChange={setPage} />
  </section>;
}
