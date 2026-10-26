import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutList, Plus, Search, Table2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { convertPreHireTraining, deletePreHireTraining, getPreHireTrainings, PreHireEmployeeInput, PreHireTraining, PreHireTrainingInput, PreHireTrainingStatus, savePreHireTraining } from '../../services/apihr/apiPreHireTraining';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { firstName: '', lastName: '', email: '', phone: '', targetPosition: '', department: '', mentorName: '', startDate: today(), plannedEndDate: '', status: 'PLANNED' as PreHireTrainingStatus, progress: 0, acquiredClients: 0, acquiredProspects: 0, evaluation: '', outcome: '', notes: '' };
const emptyEmployee = (): PreHireEmployeeInput => ({ firstName: '', lastName: '', birthDate: '', address: '', phone: '', email: '', nationality: '', socialSecurityNumber: '', positions: '', department: '', hireDate: today(), workLocation: '', baseSalary: 0, bonus: 0, gender: 'OTHER', contractType: 'CDI', status: 'ACTIVE', paymentMethod: 'CASH' });

const PreHireTrainingManagement: React.FC<{ subsidiaryId: string; onConverted: () => void }> = ({ subsidiaryId, onConverted }) => {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const activeRole = user?.activeRole ?? user?.userRole;
  const canManagePreHire = activeRole === UserRole.PRE_HIRE_MANAGER || activeRole === UserRole.SUPER_ADMIN;
  const client = useQueryClient();
  const [editing, setEditing] = useState<PreHireTraining | null>(null);
  const [converting, setConverting] = useState<PreHireTraining | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [employeeForm, setEmployeeForm] = useState<PreHireEmployeeInput>(emptyEmployee());
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | PreHireTrainingStatus>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const closeForm = () => { setEditing(null); setForm(emptyForm); setError(''); };
  const openCreate = () => { closeForm(); setEditing({ id: '' } as PreHireTraining); };
  const closeConversion = () => { setConverting(null); setEmployeeForm(emptyEmployee()); setError(''); };
  const { data = [], isLoading } = useQuery({ queryKey: ['pre-hire-training', subsidiaryId], queryFn: () => getPreHireTrainings(subsidiaryId) });
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['pre-hire-training', subsidiaryId] });
    client.invalidateQueries({ queryKey: ['employees'] });
  };
  const save = useMutation({ mutationFn: (input: PreHireTrainingInput) => savePreHireTraining(input, editing?.id || undefined), onSuccess: () => { refresh(); closeForm(); } });
  const remove = useMutation({ mutationFn: deletePreHireTraining, onSuccess: refresh });
  const convert = useMutation({ mutationFn: ({ id, input }: { id: string; input: PreHireEmployeeInput }) => convertPreHireTraining(id, input), onSuccess: () => { refresh(); closeConversion(); onConverted(); } });
  const startEdit = (record: PreHireTraining) => {
    setError('');
    setEditing(record);
    setForm({ ...emptyForm, ...record, email: record.email || '', department: record.department || '', mentorName: record.mentorName || '', startDate: record.startDate.slice(0, 10), plannedEndDate: record.plannedEndDate?.slice(0, 10) || '', evaluation: record.evaluation || '', outcome: record.outcome || '', notes: record.notes || '' });
  };
  const openConversion = (record: PreHireTraining) => {
    setConverting(record);
    setEmployeeForm({ ...emptyEmployee(), firstName: record.firstName, lastName: record.lastName, email: record.email || '', phone: record.phone, positions: record.targetPosition, department: record.department || '', workLocation: record.subsidiary?.subsidiaryName || '' });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const input = { ...form, email: form.email || undefined, department: form.department || undefined, mentorName: form.mentorName || undefined, plannedEndDate: form.plannedEndDate || undefined, evaluation: form.evaluation || undefined, outcome: form.outcome || undefined, notes: form.notes || undefined, subsidiaryId, ...(!canManagePreHire ? { acquiredClients: undefined, acquiredProspects: undefined } : {}) };
    save.mutate(input, { onError: () => setError(t('hr.preHire.saveError')) });
  };
  const submitConversion = (event: React.FormEvent) => {
    event.preventDefault();
    if (!converting) return;
    setError('');
    convert.mutate({ id: converting.id, input: employeeForm }, { onError: () => setError(t('hr.preHire.convertError')) });
  };
  const statusLabel = (status: PreHireTrainingStatus) => t(`hr.preHire.status.${status}`);
  const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(language).format(new Date(value)) : '—';
  const renderActions = (record: PreHireTraining) => <div className="flex flex-wrap items-center justify-end gap-2">{!record.employeeId && !['NOT_RETAINED', 'CANCELLED'].includes(record.status) && <button onClick={() => openConversion(record)} className="mr-auto rounded-xl bg-[#c6e911] px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#b6d90e]">↗ {t('hr.preHire.convert')}</button>}{record.employeeId && <span className="mr-auto self-center text-xs font-semibold text-emerald-700">✓ {t('hr.preHire.employeeCreated')}</span>}<button onClick={() => startEdit(record)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{t('hr.preHire.edit')}</button><button onClick={() => { if (window.confirm(t('hr.preHire.confirmDelete'))) remove.mutate(record.id); }} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">{t('hr.preHire.delete')}</button></div>;
  const filtered = useMemo(() => data.filter((record) => {
    const matchesStatus = filter === 'ALL' || record.status === filter;
    const text = `${record.firstName} ${record.lastName} ${record.email || ''} ${record.targetPosition} ${record.department || ''}`.toLocaleLowerCase();
    return matchesStatus && text.includes(search.toLocaleLowerCase().trim());
  }), [data, filter, search]);
  const stats = [
    { label: t('hr.preHire.stats.total'), value: data.length, tone: 'bg-slate-100 text-slate-600', icon: '👥' },
    { label: t('hr.preHire.stats.active'), value: data.filter((item) => item.status === 'IN_PROGRESS').length, tone: 'bg-lime-100 text-lime-800', icon: '↗' },
    { label: t('hr.preHire.stats.completed'), value: data.filter((item) => item.status === 'COMPLETED').length, tone: 'bg-amber-50 text-amber-700', icon: '✓' },
    { label: t('hr.preHire.stats.hired'), value: data.filter((item) => item.status === 'HIRED').length, tone: 'bg-emerald-50 text-emerald-700', icon: '★' },
    { label: t('hr.preHire.results.clientsTotal'), value: data.reduce((sum, item) => sum + (item.acquiredClients || 0), 0), tone: 'bg-lime-100 text-lime-800', icon: '◎' },
    { label: t('hr.preHire.results.prospectsTotal'), value: data.reduce((sum, item) => sum + (item.acquiredProspects || 0), 0), tone: 'bg-slate-100 text-slate-700', icon: '↗' },
  ];
  const employeeFields: { key: keyof PreHireEmployeeInput; type?: string; required?: boolean }[] = [
    { key: 'firstName', required: true }, { key: 'lastName', required: true }, { key: 'email', type: 'email', required: true }, { key: 'phone', required: true },
    { key: 'birthDate', type: 'date', required: true }, { key: 'address', required: true }, { key: 'nationality', required: true }, { key: 'socialSecurityNumber', required: true },
    { key: 'positions', required: true }, { key: 'department', required: true }, { key: 'hireDate', type: 'date', required: true }, { key: 'workLocation', required: true },
    { key: 'baseSalary', type: 'number', required: true }, { key: 'bonus', type: 'number' },
  ];

  return <section className="space-y-6">
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-700">{t('hr.preHire.eyebrow')}</p><h3 className="mt-1 text-2xl font-bold text-slate-800">{t('hr.preHire.title')}</h3><p className="mt-1 max-w-2xl text-sm text-slate-500">{t('hr.preHire.subtitle')}</p></div>
        {canManagePreHire && <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#c6e911] px-5 py-2.5 font-semibold text-slate-900 shadow-sm transition hover:bg-[#b6d90e]"><Plus size={18} /> {t('hr.preHire.add')}</button>}
      </div>
      <div className="mt-4 rounded-xl border border-lime-200/80 bg-lime-50/60 p-3 text-sm text-slate-700">ⓘ {t('hr.preHire.noCommitment')}</div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>{stat.icon}</span></div></div>)}</div>

    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1"><Search size={17} className="absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('hr.preHire.search')} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100" /></div>
        <div className="flex flex-wrap gap-2">{(['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'HIRED'] as const).map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${filter === status ? 'bg-[#c6e911] text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-lime-50'}`}>{status === 'ALL' ? t('hr.preHire.allStatuses') : statusLabel(status)}</button>)}</div>
        <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={t('hr.preHire.viewMode')}>
          <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><LayoutList size={16} />{t('hr.preHire.listView')}</button>
          <button type="button" aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Table2 size={16} />{t('hr.preHire.tableView')}</button>
        </div>
      </div>
    </div>

    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !save.isPending) closeForm(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="prehire-form-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-7">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-700">{t('hr.preHire.eyebrow')}</p><h4 id="prehire-form-title" className="mt-1 text-xl font-bold text-slate-900">{editing.id ? t('hr.preHire.edit') : t('hr.preHire.add')}</h4></div><button type="button" disabled={save.isPending} onClick={closeForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label={t('hr.preHire.cancel')}><X size={20} /></button></div>
      <div className="grid gap-3 md:grid-cols-2">
      {(['firstName','lastName','phone','email','targetPosition','department','mentorName','startDate','plannedEndDate'] as const).map((key) => <label key={key} className="space-y-1 text-sm text-slate-600"><span>{t(`hr.preHire.fields.${key}`)}{['firstName','lastName','phone','targetPosition','startDate'].includes(key) ? ' *' : ''}</span><input required={['firstName','lastName','phone','targetPosition','startDate'].includes(key)} type={key.toLowerCase().includes('date') ? 'date' : key === 'email' ? 'email' : 'text'} value={form[key] as string} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
      <label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.fields.status')}</span><select value={form.status} disabled={!!editing.employeeId} onChange={(event) => setForm({ ...form, status: event.target.value as PreHireTrainingStatus })} className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100">{(['PLANNED','IN_PROGRESS','COMPLETED','HIRED','NOT_RETAINED','CANCELLED'] as PreHireTrainingStatus[]).map((status) => <option key={status} value={status} disabled={status === 'HIRED' && !editing.employeeId}>{statusLabel(status)}</option>)}</select></label>
      <label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.fields.progress')} · {form.progress}%</span><input type="range" min="0" max="100" value={form.progress} onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })} className="w-full accent-lime-500" /></label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2"><h5 className="font-semibold text-slate-800">{t('hr.preHire.results.title')}</h5><p className="mt-1 text-xs text-slate-500">{t('hr.preHire.results.help')}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.results.clients')}</span><input type="number" min="0" step="1" value={form.acquiredClients} disabled={!canManagePreHire || !['COMPLETED','HIRED'].includes(form.status)} onChange={(event) => setForm({ ...form, acquiredClients: Math.max(0, Number(event.target.value)) })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100 disabled:bg-slate-100" /></label><label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.results.prospects')}</span><input type="number" min="0" step="1" value={form.acquiredProspects} disabled={!canManagePreHire || !['COMPLETED','HIRED'].includes(form.status)} onChange={(event) => setForm({ ...form, acquiredProspects: Math.max(0, Number(event.target.value)) })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100 disabled:bg-slate-100" /></label></div></div>
      {(['evaluation','outcome','notes'] as const).map((key) => <label key={key} className="space-y-1 text-sm text-slate-600 md:col-span-2"><span>{t(`hr.preHire.fields.${key}`)}</span><textarea rows={2} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 md:col-span-2"><button type="button" disabled={save.isPending} onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-50">{t('hr.preHire.cancel')}</button><button disabled={save.isPending} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{save.isPending ? t('hr.preHire.saving') : t('hr.preHire.save')}</button></div>
      </div></form>
    </div>}

    {isLoading ? <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 shadow-sm">{t('hr.preHire.loading')}</div> : filtered.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{search || filter !== 'ALL' ? t('hr.preHire.noResults') : t('hr.preHire.empty')}</div> : viewMode === 'table' ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">{t('hr.preHire.candidate')}</th><th className="px-4 py-3">{t('hr.preHire.fields.targetPosition')}</th><th className="px-4 py-3">{t('hr.preHire.fields.status')}</th><th className="px-4 py-3">{t('hr.preHire.fields.startDate')}</th><th className="px-4 py-3">{t('hr.preHire.fields.plannedEndDate')}</th><th className="px-4 py-3">{t('hr.preHire.fields.progress')}</th><th className="px-4 py-3 text-right">{t('hr.preHire.actions')}</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((record) => <tr key={record.id} className="align-middle hover:bg-lime-50/30"><td className="px-4 py-3"><div className="font-semibold text-slate-800">{record.firstName} {record.lastName}</div><div className="mt-0.5 text-xs text-slate-500">{record.email || record.phone}</div></td><td className="px-4 py-3"><div className="font-medium text-slate-700">{record.targetPosition}</div><div className="text-xs text-slate-500">{record.department || '—'}</div></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'HIRED' ? 'bg-emerald-50 text-emerald-700' : record.status === 'COMPLETED' ? 'bg-amber-50 text-amber-700' : record.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel(record.status)}</span></td><td className="px-4 py-3 text-slate-600">{formatDate(record.startDate)}</td><td className="px-4 py-3 text-slate-600">{formatDate(record.plannedEndDate)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#c6e911]" style={{ width: `${record.progress}%` }} /></div><span className="text-xs text-slate-600">{record.progress}%</span></div></td><td className="px-4 py-3">{renderActions(record)}</td></tr>)}</tbody></table></div> : <div className="grid gap-4 xl:grid-cols-2">{filtered.map((record) => <article key={record.id} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-lime-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100 text-lg font-bold text-lime-800">{record.firstName[0]}{record.lastName[0]}</div><div><h4 className="text-lg font-bold text-slate-800">{record.firstName} {record.lastName}</h4><p className="text-sm text-slate-500">{record.targetPosition}{record.department ? ` · ${record.department}` : ''}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'HIRED' ? 'bg-emerald-50 text-emerald-700' : record.status === 'COMPLETED' ? 'bg-amber-50 text-amber-700' : record.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel(record.status)}</span></div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600"><p>☎ {record.phone}</p><p>◉ {record.mentorName || '—'}</p><p>{t('hr.preHire.fields.startDate')}: {formatDate(record.startDate)}</p><p>{t('hr.preHire.fields.plannedEndDate')}: {formatDate(record.plannedEndDate)}</p></div>
      <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{t('hr.preHire.fields.progress')}</span><span>{record.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#c6e911] transition-all duration-700" style={{ width: `${record.progress}%` }} /></div></div>
      <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500">{t('hr.preHire.results.clients')}</p><p className="mt-1 text-xl font-semibold text-slate-900">{record.acquiredClients || 0}</p></div><div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500">{t('hr.preHire.results.prospects')}</p><p className="mt-1 text-xl font-semibold text-slate-900">{record.acquiredProspects || 0}</p></div></div>
      {record.evaluation && <p className="mt-3 line-clamp-2 text-sm text-slate-600"><strong>{t('hr.preHire.fields.evaluation')}:</strong> {record.evaluation}</p>}
      <div className="mt-5 border-t border-slate-100 pt-4">{renderActions(record)}</div>
    </article>)}</div>}

    {converting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><form onSubmit={submitConversion} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-700">{t('hr.preHire.convert')}</p><h3 className="mt-1 text-2xl font-bold text-slate-900">{converting.firstName} {converting.lastName}</h3><p className="mt-1 text-sm text-slate-500">{t('hr.preHire.convertHelp')}</p></div><button type="button" onClick={closeConversion} className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100" aria-label={t('hr.preHire.cancel')}>×</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{employeeFields.map(({ key, type, required }) => <label key={key} className="space-y-1 text-sm text-slate-600"><span>{t(`hr.preHire.employeeFields.${key}`)}{required ? ' *' : ''}</span><input required={required} type={type || 'text'} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} value={String(employeeForm[key] ?? '')} onChange={(event) => setEmployeeForm({ ...employeeForm, [key]: type === 'number' ? Number(event.target.value) : event.target.value } as PreHireEmployeeInput)} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
        <label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.employeeFields.gender')} *</span><select required value={employeeForm.gender} onChange={(event) => setEmployeeForm({ ...employeeForm, gender: event.target.value as PreHireEmployeeInput['gender'] })} className="w-full rounded-md border border-slate-300 px-3 py-2"><option value="MALE">{t('hr.preHire.gender.MALE')}</option><option value="FEMALE">{t('hr.preHire.gender.FEMALE')}</option><option value="OTHER">{t('hr.preHire.gender.OTHER')}</option></select></label>
        <label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.employeeFields.contractType')} *</span><select required value={employeeForm.contractType} onChange={(event) => setEmployeeForm({ ...employeeForm, contractType: event.target.value as PreHireEmployeeInput['contractType'] })} className="w-full rounded-md border border-slate-300 px-3 py-2">{(['CDI','CDD','FREELANCE','INTERNSHIP'] as const).map((value) => <option key={value} value={value}>{t(`hr.preHire.contract.${value}`)}</option>)}</select></label>
        <label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.employeeFields.paymentMethod')} *</span><select required value={employeeForm.paymentMethod} onChange={(event) => setEmployeeForm({ ...employeeForm, paymentMethod: event.target.value as PreHireEmployeeInput['paymentMethod'] })} className="w-full rounded-md border border-slate-300 px-3 py-2">{(['CASH','CHECK','BANK_TRANSFER'] as const).map((value) => <option key={value} value={value}>{t(`hr.preHire.payment.${value}`)}</option>)}</select></label>
        {employeeForm.paymentMethod === 'BANK_TRANSFER' && <><label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.employeeFields.bankName')} *</span><input required value={employeeForm.bankName || ''} onChange={(event) => setEmployeeForm({ ...employeeForm, bankName: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="space-y-1 text-sm text-slate-600"><span>{t('hr.preHire.employeeFields.bankAccountNumber')} *</span><input required value={employeeForm.bankAccountNumber || ''} onChange={(event) => setEmployeeForm({ ...employeeForm, bankAccountNumber: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label></>}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={closeConversion} className="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50">{t('hr.preHire.cancel')}</button><button disabled={convert.isPending} className="rounded-xl bg-[#c6e911] px-4 py-2 font-semibold text-slate-900 hover:bg-[#b6d90e] disabled:opacity-50">{convert.isPending ? t('hr.preHire.converting') : t('hr.preHire.confirmConvert')}</button></div>
    </form></div>}
  </section>;
};

export default PreHireTrainingManagement;
