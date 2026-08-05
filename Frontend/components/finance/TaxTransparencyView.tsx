import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import {
    getPayrollTaxSummary, getVatSummary, getIrppDetail, getCnpsDetail, getCfcFneDetail, getVatDetail,
} from '../../services/apiFinance/apiTaxTransparency';
import TaxDeclarationModal, { TaxDeclarationColumn } from './TaxDeclarationModal';
import IconDocumentText from '../icons/IconDocumentText';
import IconSearch from '../icons/IconSearch';
import IconCancelX from '../icons/IconCancelX';
import Pagination from '../common/Pagination';

interface TaxTransparencyViewProps {
    subsidiary: Subsidiary;
}

type TaxTab = 'resume' | 'irpp' | 'cnps' | 'cfcFne' | 'tva';
const PAGE_SIZE = 10;

function getMonthOptions(language: string): { value: number; label: string }[] {
    const formatter = new Intl.DateTimeFormat(language, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: formatter.format(new Date(2000, i, 1)),
    }));
}

const MetricCard: React.FC<{ label: string; value: string; sub?: string; color?: 'lime' | 'blue' | 'purple' | 'dark' }> = ({ label, value, sub, color = 'lime' }) => {
    const styles: Record<string, string> = {
        lime: 'from-[#c6e911]/20 to-white border-[#c6e911]/40',
        blue: 'from-blue-50 to-white border-blue-100',
        purple: 'from-purple-50 to-white border-purple-100',
        dark: 'from-slate-800 to-slate-700 border-slate-600 text-white',
    };
    const valueColor: Record<string, string> = { lime: 'text-[#7a8e00]', blue: 'text-blue-600', purple: 'text-purple-600', dark: 'text-white' };
    return (
        <div className={`bg-gradient-to-br ${styles[color]} border rounded-xl p-5 shadow-sm`}>
            <div className={`text-sm mb-1 ${color === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
            <div className={`text-2xl font-bold ${valueColor[color]}`}>{value}</div>
            {sub && <div className={`text-xs mt-2 ${color === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{sub}</div>}
        </div>
    );
};

const TaxTransparencyView: React.FC<TaxTransparencyViewProps> = ({ subsidiary }) => {
    const { t, formatCurrency, language } = useI18n();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [activeTab, setActiveTab] = useState<TaxTab>('resume');
    const [cnpsSearch, setCnpsSearch] = useState('');
    const [irppPage, setIrppPage] = useState(1);
    const [cnpsPage, setCnpsPage] = useState(1);
    const [tvaPage, setTvaPage] = useState(1);
    const [showIrppDeclaration, setShowIrppDeclaration] = useState(false);
    const [showCnpsDeclaration, setShowCnpsDeclaration] = useState(false);
    const [showCfcDeclaration, setShowCfcDeclaration] = useState(false);
    const [showFneDeclaration, setShowFneDeclaration] = useState(false);
    const [showTvaDeclaration, setShowTvaDeclaration] = useState(false);

    const monthOptions = useMemo(() => getMonthOptions(language), [language]);
    const params = { month, year, subsidiaryId: subsidiary.id };
    const periodLabel = `${monthOptions.find(m => m.value === month)?.label} ${year}`;

    const { data: payroll, isLoading: isLoadingPayroll } = useQuery({
        queryKey: ['taxTransparency', 'payroll', subsidiary.id, month, year],
        queryFn: () => getPayrollTaxSummary(params),
        enabled: activeTab === 'resume',
    });
    const { data: vat, isLoading: isLoadingVat } = useQuery({
        queryKey: ['taxTransparency', 'vat', subsidiary.id, month, year],
        queryFn: () => getVatSummary(params),
        enabled: activeTab === 'resume' || activeTab === 'tva',
    });
    const { data: irpp, isLoading: isLoadingIrpp } = useQuery({
        queryKey: ['taxTransparency', 'irpp', subsidiary.id, month, year],
        queryFn: () => getIrppDetail(params),
        enabled: activeTab === 'irpp',
    });
    const { data: cnps, isLoading: isLoadingCnps } = useQuery({
        queryKey: ['taxTransparency', 'cnps', subsidiary.id, month, year],
        queryFn: () => getCnpsDetail(params),
        enabled: activeTab === 'cnps',
    });
    const { data: cfcFne, isLoading: isLoadingCfcFne } = useQuery({
        queryKey: ['taxTransparency', 'cfcFne', subsidiary.id, month, year],
        queryFn: () => getCfcFneDetail(params),
        enabled: activeTab === 'cfcFne',
    });
    const { data: vatDetail, isLoading: isLoadingVatDetail } = useQuery({
        queryKey: ['taxTransparency', 'vatDetail', subsidiary.id, month, year],
        queryFn: () => getVatDetail(params),
        enabled: activeTab === 'tva',
    });

    const filteredCnps = useMemo(() => {
        if (!cnps) return [];
        const q = cnpsSearch.trim().toLowerCase();
        if (!q) return cnps.details;
        return cnps.details.filter(d => d.employeeName.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q));
    }, [cnps, cnpsSearch]);

    const irppRows = irpp?.details ?? [];
    const irppPageRows = irppRows.slice((irppPage - 1) * PAGE_SIZE, irppPage * PAGE_SIZE);
    const irppMeta = { page: irppPage, limit: PAGE_SIZE, total: irppRows.length, totalPages: Math.max(1, Math.ceil(irppRows.length / PAGE_SIZE)), hasNextPage: irppPage * PAGE_SIZE < irppRows.length, hasPreviousPage: irppPage > 1 };

    const cnpsPageRows = filteredCnps.slice((cnpsPage - 1) * PAGE_SIZE, cnpsPage * PAGE_SIZE);
    const cnpsMeta = { page: cnpsPage, limit: PAGE_SIZE, total: filteredCnps.length, totalPages: Math.max(1, Math.ceil(filteredCnps.length / PAGE_SIZE)), hasNextPage: cnpsPage * PAGE_SIZE < filteredCnps.length, hasPreviousPage: cnpsPage > 1 };

    const vatRows = vatDetail?.details ?? [];
    const vatPageRows = vatRows.slice((tvaPage - 1) * PAGE_SIZE, tvaPage * PAGE_SIZE);
    const vatMeta = { page: tvaPage, limit: PAGE_SIZE, total: vatRows.length, totalPages: Math.max(1, Math.ceil(vatRows.length / PAGE_SIZE)), hasNextPage: tvaPage * PAGE_SIZE < vatRows.length, hasPreviousPage: tvaPage > 1 };

    const TABS: { view: TaxTab; label: string }[] = [
        { view: 'resume', label: t('taxTransparency.tabs.resume') },
        { view: 'irpp', label: t('taxTransparency.tabs.irpp') },
        { view: 'cnps', label: t('taxTransparency.tabs.cnps') },
        { view: 'cfcFne', label: t('taxTransparency.tabs.cfcFne') },
        { view: 'tva', label: t('taxTransparency.tabs.tva') },
    ];

    const irppColumns: TaxDeclarationColumn<typeof irppRows[number]>[] = [
        { key: 'employeeName', label: t('taxTransparency.table.employee'), render: r => r.employeeName },
        { key: 'matricule', label: t('taxTransparency.table.matricule'), render: r => r.matricule },
        { key: 'baseAmount', label: t('taxTransparency.table.base'), align: 'right', render: r => formatCurrency(r.baseAmount) },
        { key: 'irppAmount', label: t('taxTransparency.tabs.irpp'), align: 'right', render: r => formatCurrency(r.irppAmount) },
    ];
    const cnpsColumns: TaxDeclarationColumn<typeof filteredCnps[number]>[] = [
        { key: 'employeeName', label: t('taxTransparency.table.employee'), render: r => r.employeeName },
        { key: 'matricule', label: t('taxTransparency.table.matricule'), render: r => r.matricule },
        { key: 'employeeShare', label: t('taxTransparency.employeeShare'), align: 'right', render: r => formatCurrency(r.employeeShare) },
        { key: 'employerShare', label: t('taxTransparency.table.employerShare'), align: 'right', render: r => formatCurrency(r.employerShare) },
        { key: 'total', label: t('proforma.template.total'), align: 'right', render: r => formatCurrency(r.total) },
    ];
    const cfcFneLineColumns = (label: string): TaxDeclarationColumn<{ employeeName: string; matricule: string; baseAmount: number; amount: number }>[] => [
        { key: 'employeeName', label: t('taxTransparency.table.employee'), render: r => r.employeeName },
        { key: 'matricule', label: t('taxTransparency.table.matricule'), render: r => r.matricule },
        { key: 'baseAmount', label: t('taxTransparency.table.base'), align: 'right', render: r => formatCurrency(r.baseAmount) },
        { key: 'amount', label, align: 'right', render: r => formatCurrency(r.amount) },
    ];
    const vatColumns: TaxDeclarationColumn<typeof vatRows[number]>[] = [
        { key: 'date', label: t('proforma.template.date'), render: r => new Date(r.date).toLocaleDateString(language) },
        { key: 'clientName', label: t('taxTransparency.table.client'), render: r => r.clientName },
        { key: 'taxableAmount', label: t('taxTransparency.taxableSubtotal'), align: 'right', render: r => formatCurrency(r.taxableAmount) },
        { key: 'vatAmount', label: t('taxTransparency.vatCollected'), align: 'right', render: r => formatCurrency(r.vatAmount) },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-white to-[#c6e911]/10 border-b border-slate-100">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t('taxTransparency.title')}</h3>
                            <p className="text-sm text-slate-500 mt-1">{t('taxTransparency.subtitle')}</p>
                        </div>
                        <div className="flex gap-3">
                            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] capitalize">
                                {monthOptions.map((m) => <option key={m.value} value={m.value} className="capitalize">{m.label}</option>)}
                            </select>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
                                className="h-9 w-24 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.view}
                                onClick={() => setActiveTab(tab.view)}
                                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                                    activeTab === tab.view
                                        ? 'bg-white text-[#7a8e00] border-b-2 border-[#c6e911] shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="min-h-[400px]">
                    {activeTab === 'resume' && (
                        isLoadingPayroll || isLoadingVat ? (
                            <p className="text-sm text-slate-400">{t('common.loading')}</p>
                        ) : (
                            <div className="space-y-6">
                                <h4 className="font-semibold text-slate-800">{t('taxTransparency.payrollSection')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard label={t('taxTransparency.irppTotal')} value={formatCurrency(payroll?.irppTotal ?? 0)} sub={`${payroll?.employeeCount ?? 0} ${t('taxTransparency.employeeCount').toLowerCase()}`} />
                                    <MetricCard label={t('taxTransparency.table.employerShare')} value={formatCurrency(payroll?.cnpsEmployer ?? 0)} color="purple" />
                                    <MetricCard label={t('taxTransparency.employeeShare')} value={formatCurrency(payroll?.cnpsEmployee ?? 0)} color="blue" />
                                    <MetricCard label={t('taxTransparency.cnpsTotal')} value={formatCurrency(payroll?.cnpsTotal ?? 0)} sub={t('taxTransparency.employerAndEmployee')} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard label={t('taxTransparency.cfcTotal')} value={formatCurrency(payroll?.cfcTotal ?? 0)} color="blue" />
                                    <MetricCard label={t('taxTransparency.fne')} value={formatCurrency(payroll?.fne ?? 0)} color="purple" />
                                    <MetricCard label={t('taxTransparency.totalEmployerCost')} value={formatCurrency(payroll?.totalEmployerCost ?? 0)} color="dark" sub={t('taxTransparency.allChargesCombined')} />
                                </div>
                                <h4 className="font-semibold text-slate-800 pt-2">{t('taxTransparency.vatSection')}</h4>
                                <p className="text-xs text-slate-400">{t('taxTransparency.vatDisclaimer')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard label={t('taxTransparency.vatCollected')} value={formatCurrency(vat?.vatCollected ?? 0)} />
                                    <MetricCard label={t('taxTransparency.taxableSubtotal')} value={formatCurrency(vat?.taxableSubtotal ?? 0)} color="blue" />
                                    <MetricCard label={t('taxTransparency.orderCount')} value={String(vat?.orderCount ?? 0)} color="purple" />
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'irpp' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-slate-800">{t('taxTransparency.declaration.irppTitle')}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#c6e911]/20 text-[#7a8e00]">
                                        {t('common.total')}: {formatCurrency(irpp?.totalAmount ?? 0)}
                                    </span>
                                    <button onClick={() => setShowIrppDeclaration(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                                        <IconDocumentText className="h-4 w-4" />
                                        {t('taxTransparency.declaration.view')}
                                    </button>
                                </div>
                            </div>
                            <TaxTable columns={irppColumns} rows={irppPageRows} isLoading={isLoadingIrpp} />
                            <Pagination meta={irppMeta} onPageChange={setIrppPage} />
                        </div>
                    )}

                    {activeTab === 'cnps' && (
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                                <h4 className="font-semibold text-slate-800">{t('taxTransparency.tabs.cnps')}</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{t('taxTransparency.employeeShare')}: {formatCurrency(cnps?.totalEmployee ?? 0)}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">{t('taxTransparency.table.employerShare')}: {formatCurrency(cnps?.totalEmployer ?? 0)}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#c6e911] text-slate-800">{t('common.total')}: {formatCurrency(cnps?.total ?? 0)}</span>
                                    <button onClick={() => setShowCnpsDeclaration(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                                        <IconDocumentText className="h-4 w-4" />
                                        {t('taxTransparency.declaration.view')}
                                    </button>
                                </div>
                            </div>
                            <div className="relative mb-3 max-w-sm">
                                <IconSearch className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={cnpsSearch}
                                    onChange={(e) => { setCnpsSearch(e.target.value); setCnpsPage(1); }}
                                    placeholder={t('common.searchPlaceholder')}
                                    className="w-full pl-9 pr-9 h-9 rounded-md border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                />
                                {cnpsSearch && (
                                    <button onClick={() => setCnpsSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <IconCancelX className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <TaxTable columns={cnpsColumns} rows={cnpsPageRows} isLoading={isLoadingCnps} />
                            <Pagination meta={cnpsMeta} onPageChange={setCnpsPage} />
                        </div>
                    )}

                    {activeTab === 'cfcFne' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                                    <h4 className="font-semibold text-slate-800">{t('taxTransparency.cfcTotal')}</h4>
                                    <button onClick={() => setShowCfcDeclaration(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors">
                                        <IconDocumentText className="h-4 w-4" />
                                        {t('taxTransparency.declaration.view')}
                                    </button>
                                </div>
                                <p className="px-4 pt-3 text-lg font-bold text-[#7a8e00]">{formatCurrency(cfcFne?.cfc.totalAmount ?? 0)}</p>
                                <div className="max-h-96 overflow-y-auto p-4">
                                    <TaxTable columns={cfcFneLineColumns(t('taxTransparency.cfcTotal'))} rows={cfcFne?.cfc.details ?? []} isLoading={isLoadingCfcFne} compact />
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                                    <h4 className="font-semibold text-slate-800">{t('taxTransparency.fne')}</h4>
                                    <button onClick={() => setShowFneDeclaration(true)} className="flex items-center gap-2 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors">
                                        <IconDocumentText className="h-4 w-4" />
                                        {t('taxTransparency.declaration.view')}
                                    </button>
                                </div>
                                <p className="px-4 pt-3 text-lg font-bold text-teal-600">{formatCurrency(cfcFne?.fne.totalAmount ?? 0)}</p>
                                <div className="max-h-96 overflow-y-auto p-4">
                                    <TaxTable columns={cfcFneLineColumns(t('taxTransparency.fne'))} rows={cfcFne?.fne.details ?? []} isLoading={isLoadingCfcFne} compact />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tva' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-slate-800">{t('taxTransparency.tabs.tva')}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                        {t('taxTransparency.vatCollected')}: {formatCurrency(vat?.vatCollected ?? 0)}
                                    </span>
                                    <button onClick={() => setShowTvaDeclaration(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                                        <IconDocumentText className="h-4 w-4" />
                                        {t('taxTransparency.declaration.view')}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mb-3">{t('taxTransparency.vatDisclaimer')}</p>
                            <TaxTable columns={vatColumns} rows={vatPageRows} isLoading={isLoadingVatDetail} />
                            <Pagination meta={vatMeta} onPageChange={setTvaPage} />
                        </div>
                    )}
                </div>
            </div>

            <TaxDeclarationModal
                isOpen={showIrppDeclaration}
                onClose={() => setShowIrppDeclaration(false)}
                title={t('taxTransparency.declaration.irppTitle')}
                periodLabel={periodLabel}
                columns={irppColumns}
                rows={irppRows}
                totalLabel={t('common.total')}
                totalValue={formatCurrency(irpp?.totalAmount ?? 0)}
            />
            <TaxDeclarationModal
                isOpen={showCnpsDeclaration}
                onClose={() => setShowCnpsDeclaration(false)}
                title={t('taxTransparency.tabs.cnps')}
                periodLabel={periodLabel}
                columns={cnpsColumns}
                rows={cnps?.details ?? []}
                totalLabel={t('common.total')}
                totalValue={formatCurrency(cnps?.total ?? 0)}
            />
            <TaxDeclarationModal
                isOpen={showCfcDeclaration}
                onClose={() => setShowCfcDeclaration(false)}
                title={t('taxTransparency.cfcTotal')}
                periodLabel={periodLabel}
                columns={cfcFneLineColumns(t('taxTransparency.cfcTotal'))}
                rows={cfcFne?.cfc.details ?? []}
                totalLabel={t('common.total')}
                totalValue={formatCurrency(cfcFne?.cfc.totalAmount ?? 0)}
            />
            <TaxDeclarationModal
                isOpen={showFneDeclaration}
                onClose={() => setShowFneDeclaration(false)}
                title={t('taxTransparency.fne')}
                periodLabel={periodLabel}
                columns={cfcFneLineColumns(t('taxTransparency.fne'))}
                rows={cfcFne?.fne.details ?? []}
                totalLabel={t('common.total')}
                totalValue={formatCurrency(cfcFne?.fne.totalAmount ?? 0)}
            />
            <TaxDeclarationModal
                isOpen={showTvaDeclaration}
                onClose={() => setShowTvaDeclaration(false)}
                title={t('taxTransparency.tabs.tva')}
                periodLabel={periodLabel}
                columns={vatColumns}
                rows={vatRows}
                totalLabel={t('taxTransparency.vatCollected')}
                totalValue={formatCurrency(vat?.vatCollected ?? 0)}
            />
        </div>
    );
};

interface TaxTableProps<T> {
    columns: TaxDeclarationColumn<T>[];
    rows: T[];
    isLoading: boolean;
    compact?: boolean;
}

function TaxTable<T>({ columns, rows, isLoading, compact = false }: TaxTableProps<T>) {
    const { t } = useI18n();
    const alignClass = (align?: 'left' | 'right' | 'center') =>
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                {!compact && (
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className={`px-4 py-3 ${alignClass(col.align)}`}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">{t('common.loading')}</td></tr>
                    ) : rows.length === 0 ? (
                        <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">{t('common.notAvailable')}</td></tr>
                    ) : rows.map((row, idx) => (
                        <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                            {columns.map(col => (
                                <td key={col.key} className={`px-4 py-3 ${alignClass(col.align)}`}>{col.render(row)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TaxTransparencyView;
