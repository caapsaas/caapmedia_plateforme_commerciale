import React, { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShieldCheck, KeyRound, Plug, Search, RotateCcw } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DataTableColumn,
  TabBar,
} from '../components/ui';
import IntegrationSettings from './IntegrationSettings';
import {
  AuthAuditLogEntry,
  getAuthAuditLogs,
  getSystemAuditLogs,
  SystemAuditLogEntry,
} from '../services/apiCommon/apiAudit';
import { useI18n } from '../i18n';
import { formatDateTime } from '../utils/formatters';

type AuditTab = 'business' | 'auth' | 'integrations';

const PAGE_SIZE = 25;

const getActionBadgeVariant = (action: string): 'info' | 'success' | 'warning' | 'danger' | 'neutral' => {
  const upper = action.toUpperCase();
  if (upper.includes('REJECT') || upper.includes('DELETE') || upper.includes('ARCHIVE') || upper.includes('FAIL')) {
    return 'danger';
  }
  if (upper.includes('VALIDATE') || upper.includes('APPROVE') || upper.includes('RESTORE') || upper.includes('SUCCESS')) {
    return 'success';
  }
  if (upper.includes('TRANSFER') || upper.includes('SWITCH') || upper.includes('ACCESS')) {
    return 'warning';
  }
  return 'info';
};

const AuditSystem: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<AuditTab>('business');

  // Filtres Audit Metier
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actorEmailFilter, setActorEmailFilter] = useState('');
  const [businessPage, setBusinessPage] = useState(0);

  // Filtres Journal Auth
  const [authEmailFilter, setAuthEmailFilter] = useState('');
  const [authEventFilter, setAuthEventFilter] = useState('');
  const [authPage, setAuthPage] = useState(0);

  const systemAuditQuery = useQuery({
    queryKey: ['system-audit-logs', actionFilter, entityFilter, actorEmailFilter, businessPage],
    queryFn: () =>
      getSystemAuditLogs({
        action: actionFilter.trim() || undefined,
        entityType: entityFilter.trim() || undefined,
        actorEmail: actorEmailFilter.trim() || undefined,
        take: PAGE_SIZE,
        skip: businessPage * PAGE_SIZE,
      }),
    enabled: activeTab === 'business',
    placeholderData: keepPreviousData,
  });

  const authAuditQuery = useQuery({
    queryKey: ['auth-audit-logs', authEmailFilter, authEventFilter, authPage],
    queryFn: () =>
      getAuthAuditLogs({
        email: authEmailFilter.trim() || undefined,
        event: authEventFilter.trim() || undefined,
        take: PAGE_SIZE,
        skip: authPage * PAGE_SIZE,
      }),
    enabled: activeTab === 'auth',
    placeholderData: keepPreviousData,
  });

  const businessColumns: DataTableColumn<SystemAuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: t('auditPage.columns.date'),
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-[var(--muted-foreground)] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: t('auditPage.columns.actor'),
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--foreground)]">{row.actorEmail || 'Système'}</span>
          {row.actorRole && (
            <span className="text-[11px] font-mono text-[var(--muted-foreground)]">{row.actorRole}</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: t('auditPage.columns.action'),
      render: (row) => <Badge variant={getActionBadgeVariant(row.action)}>{row.action}</Badge>,
    },
    {
      key: 'entity',
      header: t('auditPage.columns.entity'),
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[var(--foreground)]">{row.entityType}</span>
          {row.entityId && (
            <span className="text-[11px] font-mono text-[var(--muted-foreground)]">{row.entityId}</span>
          )}
        </div>
      ),
    },
    {
      key: 'summary',
      header: t('auditPage.columns.details'),
      render: (row) => <span className="text-[13px] text-slate-700">{row.summary}</span>,
    },
  ];

  const authColumns: DataTableColumn<AuthAuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: t('auditPage.columns.date'),
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-[var(--muted-foreground)] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'event',
      header: t('auditPage.columns.event'),
      render: (row) => <Badge variant={getActionBadgeVariant(row.event)}>{row.event}</Badge>,
    },
    {
      key: 'email',
      header: t('auditPage.columns.actor'),
      render: (row) => <span className="font-medium">{row.email || row.userId || '—'}</span>,
    },
    {
      key: 'ipAddress',
      header: t('auditPage.columns.ip'),
      render: (row) => <span className="font-mono text-xs tabular-nums">{row.ipAddress || '—'}</span>,
    },
    {
      key: 'userAgent',
      header: 'User-Agent',
      render: (row) => (
        <span className="text-xs text-[var(--muted-foreground)] line-clamp-1 max-w-xs" title={row.userAgent || ''}>
          {row.userAgent || '—'}
        </span>
      ),
    },
  ];

  const businessTotal = systemAuditQuery.data?.total ?? 0;
  const authTotal = authAuditQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {t('auditPage.title')}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {t('auditPage.subtitle')}
          </p>
        </div>
      </div>

      <TabBar<AuditTab>
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            value: 'business',
            label: t('auditPage.tabs.businessAudit'),
            icon: <ShieldCheck className="w-4 h-4" />,
            badge: activeTab === 'business' ? businessTotal : undefined,
          },
          {
            value: 'auth',
            label: t('auditPage.tabs.authSecurity'),
            icon: <KeyRound className="w-4 h-4" />,
            badge: activeTab === 'auth' ? authTotal : undefined,
          },
          {
            value: 'integrations',
            label: t('auditPage.tabs.integrations'),
            icon: <Plug className="w-4 h-4" />,
          },
        ]}
      />

      {activeTab === 'business' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {t('auditPage.filters.action')}
                </label>
                <input
                  type="text"
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setBusinessPage(0);
                  }}
                  placeholder="Ex: TREASURY_VALIDATED, USER_TRANSFER"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {t('auditPage.filters.entityType')}
                </label>
                <input
                  type="text"
                  value={entityFilter}
                  onChange={(e) => {
                    setEntityFilter(e.target.value);
                    setBusinessPage(0);
                  }}
                  placeholder="Ex: FinancialTransaction, Supplier, User"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {t('auditPage.filters.actorEmail')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={actorEmailFilter}
                    onChange={(e) => {
                      setActorEmailFilter(e.target.value);
                      setBusinessPage(0);
                    }}
                    placeholder="admin@caapmedia.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActionFilter('');
                    setEntityFilter('');
                    setActorEmailFilter('');
                    setBusinessPage(0);
                  }}
                >
                  {t('auditPage.filters.reset')}
                </Button>
              </div>
            </div>
          </Card>

          <DataTable
            data={systemAuditQuery.data?.entries ?? []}
            columns={businessColumns}
            keyExtractor={(row) => row.id}
            isLoading={systemAuditQuery.isLoading}
            emptyTitle={t('auditPage.empty')}
          />

          {businessTotal > PAGE_SIZE && (
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span className="tabular-nums">
                {businessPage * PAGE_SIZE + 1} – {Math.min((businessPage + 1) * PAGE_SIZE, businessTotal)} / {businessTotal}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={businessPage === 0}
                  onClick={() => setBusinessPage((p) => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={(businessPage + 1) * PAGE_SIZE >= businessTotal}
                  onClick={() => setBusinessPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'auth' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {t('auditPage.filters.actorEmail')}
                </label>
                <input
                  type="text"
                  value={authEmailFilter}
                  onChange={(e) => {
                    setAuthEmailFilter(e.target.value);
                    setAuthPage(0);
                  }}
                  placeholder="utilisateur@caapmedia.com"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {t('auditPage.columns.event')}
                </label>
                <input
                  type="text"
                  value={authEventFilter}
                  onChange={(e) => {
                    setAuthEventFilter(e.target.value);
                    setAuthPage(0);
                  }}
                  placeholder="Ex: LOGIN_SUCCESS, LOGIN_FAILURE"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setAuthEmailFilter('');
                    setAuthEventFilter('');
                    setAuthPage(0);
                  }}
                >
                  {t('auditPage.filters.reset')}
                </Button>
              </div>
            </div>
          </Card>

          <DataTable
            data={authAuditQuery.data?.entries ?? []}
            columns={authColumns}
            keyExtractor={(row) => row.id}
            isLoading={authAuditQuery.isLoading}
            emptyTitle={t('auditPage.empty')}
          />

          {authTotal > PAGE_SIZE && (
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span className="tabular-nums">
                {authPage * PAGE_SIZE + 1} – {Math.min((authPage + 1) * PAGE_SIZE, authTotal)} / {authTotal}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={authPage === 0}
                  onClick={() => setAuthPage((p) => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={(authPage + 1) * PAGE_SIZE >= authTotal}
                  onClick={() => setAuthPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="pt-1">
          <IntegrationSettings />
        </div>
      )}
    </div>
  );
};

export default AuditSystem;
