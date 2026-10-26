import React, { useState, useMemo } from 'react';
import { Subsidiary, AbsenceRecord, AbsenceType, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconDownload from '../icons/IconDownload';
import AbsenceFormModal from './AbsenceFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import { formatDate } from '../../utils/dateFormatter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { UseMutateFunction, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IconUsers from '../icons/IconUsers';
import {
  addSubsidiaryHoliday,
  deleteSubsidiaryHoliday,
  generateDailyAbsences,
  getSubsidiaryCalendar,
  saveSubsidiaryWorkingDays,
} from '../../services/apihr/apiAbsences';
import { api } from '../../services/api';
import { RefreshCw, Search, Filter, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface AbsenceManagementProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  absences: AbsenceRecord[];
  isLoading?: boolean;
  onSave: UseMutateFunction<AbsenceRecord, Error, Partial<AbsenceRecord>, unknown>;
  onDelete: UseMutateFunction<AbsenceRecord, Error, string, unknown>;
}

const TYPE_OPTIONS = [
  { value: 'ALL', translationKey: 'hr.absences.filters.allTypes' },
  { value: 'JUSTIFIED', translationKey: 'hr.absences.filters.justified' },
  { value: 'UNJUSTIFIED', translationKey: 'hr.absences.filters.unjustified' },
] as const;

const AbsenceManagement: React.FC<AbsenceManagementProps> = ({
  subsidiary,
  employees,
  absences = [],
  isLoading = false,
  onSave,
  onDelete,
}) => {
  const { t, language } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const calendarQueryKey = ['absence-calendar', subsidiary.id];
  const { data: subsidiaryCalendar } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: () => getSubsidiaryCalendar(subsidiary.id),
  });
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const workingDaysMutation = useMutation({
    mutationFn: (workingDays: number[]) => saveSubsidiaryWorkingDays(subsidiary.id, workingDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarQueryKey }),
    onError: () => toast.error(t('hr.absences.calendar.calendarError'), t('hr.absences.calendar.calendarErrorHelp')),
  });
  const addHolidayMutation = useMutation({
    mutationFn: () => addSubsidiaryHoliday(subsidiary.id, { date: holidayDate, name: holidayName }),
    onSuccess: () => {
      setHolidayDate('');
      setHolidayName('');
      queryClient.invalidateQueries({ queryKey: calendarQueryKey });
      toast.success(t('hr.absences.calendar.holidayAdded'), t('hr.absences.calendar.holidayAddedHelp'));
    },
    onError: () => toast.error(t('hr.absences.calendar.holidayError'), t('hr.absences.calendar.holidayErrorHelp')),
  });
  const removeHolidayMutation = useMutation({
    mutationFn: (holidayId: string) => deleteSubsidiaryHoliday(subsidiary.id, holidayId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarQueryKey }),
    onError: () => toast.error(t('hr.absences.calendar.deleteHolidayError'), t('hr.absences.calendar.deleteHolidayErrorHelp')),
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<AbsenceRecord | null>(null);
  const [deletingAbsence, setDeletingAbsence] = useState<AbsenceRecord | null>(null);
  const [generatingAbsences, setGeneratingAbsences] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AbsenceType>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState('');
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const datePart = (value: string | undefined | null) => value ? value.slice(0, 10) : '';
  const monthStart = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`;
  const monthEnd = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(new Date(calendarYear, calendarMonth + 1, 0).getDate()).padStart(2, '0')}`;
  const monthAbsences = useMemo(() => absences.filter((record) =>
    datePart(record.endDate) >= monthStart && datePart(record.startDate) <= monthEnd,
  ), [absences, monthStart, monthEnd]);
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    monthAbsences.forEach((record) => {
      const start = new Date(`${datePart(record.startDate)}T12:00:00`);
      const end = new Date(`${datePart(record.endDate)}T12:00:00`);
      for (const day = new Date(Math.max(start.getTime(), new Date(`${monthStart}T12:00:00`).getTime())); day <= end && day <= new Date(`${monthEnd}T12:00:00`); day.setDate(day.getDate() + 1)) {
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [monthAbsences, monthStart, monthEnd]);
  const calendarCells = useMemo(() => {
    const offset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
    return [...Array(offset).fill(null), ...Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }, (_, i) => i + 1)];
  }, [calendarMonth, calendarYear]);
  const holidayDates = useMemo(
    () => new Set((subsidiaryCalendar?.holidays || []).map((holiday) => datePart(holiday.date))),
    [subsidiaryCalendar?.holidays],
  );
  const weekdayOptions = [
    { value: 1, label: t('hr.absences.calendar.weekdays.0') }, { value: 2, label: t('hr.absences.calendar.weekdays.1') },
    { value: 3, label: t('hr.absences.calendar.weekdays.2') }, { value: 4, label: t('hr.absences.calendar.weekdays.3') },
    { value: 5, label: t('hr.absences.calendar.weekdays.4') }, { value: 6, label: t('hr.absences.calendar.weekdays.5') },
    { value: 0, label: t('hr.absences.calendar.weekdays.6') },
  ];

  // Mutation génération auto des absences
  const generateMutation = useMutation({
    mutationFn: () => generateDailyAbsences(subsidiary.id),
    onSuccess: (result) => {
      toast.success(t('hr.absences.feedback.generationComplete'), result.message);
      queryClient.invalidateQueries({ queryKey: ['absence-records'] });
      handleCloseModals();
    },
    onError: (error: any) => {
      toast.error(
        t('hr.absences.feedback.generationError'),
        error?.response?.data?.message ||
          t('hr.absences.feedback.generationErrorHelp'),
      );
      handleCloseModals();
    },
  });

  const filteredAbsences = useMemo(() => {
    return absences.filter((record) => {
      // Filtre recherche
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchLower ||
        record.employeeName?.toLowerCase().includes(searchLower) ||
        record.reason?.toLowerCase().includes(searchLower) ||
        record.startDate?.includes(searchTerm) ||
        record.endDate?.includes(searchTerm);

      // Filtre type
      const matchesType =
        typeFilter === 'ALL' || record.typeAbsence === typeFilter;

      // Helper pour extraire la date au format YYYY-MM-DD
      const getDatePart = (dateStr: string | undefined | null): string => {
        if (!dateStr) return '';
        // Si la date contient un T, on prend la partie avant
        if (dateStr.includes('T')) return dateStr.split('T')[0];
        // Sinon on retourne la date telle quelle (déjà au format YYYY-MM-DD)
        return dateStr;
      };

      const startDate = getDatePart(record.startDate);
      const endDate = getDatePart(record.endDate);
      const hasDateRange = Boolean(dateFrom || dateTo);
      const matchesCalendarPeriod = selectedDay
        ? startDate <= selectedDay && endDate >= selectedDay
        : showAllPeriods || hasDateRange || (endDate >= monthStart && startDate <= monthEnd);

      // Filtre date début
      const matchesDateFrom = !dateFrom || endDate >= dateFrom;

      // Filtre date fin
      const matchesDateTo = !dateTo || startDate <= dateTo;

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo && matchesCalendarPeriod;
    }).sort((a, b) => datePart(b.startDate).localeCompare(datePart(a.startDate)));
  }, [absences, searchTerm, typeFilter, dateFrom, dateTo, selectedDay, showAllPeriods, monthStart, monthEnd]);

  const hasActiveFilters =
    searchTerm !== '' || !showAllPeriods ||
    typeFilter !== 'ALL' || selectedDay !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSelectedDay('');
    setShowAllPeriods(false);
  };

  const absenceStats = useMemo(() => {
    const justified = monthAbsences.filter(
      (a) => a.typeAbsence === AbsenceType.JUSTIFIED,
    ).length;
    const unjustified = monthAbsences.filter(
      (a) => a.typeAbsence === AbsenceType.UNJUSTIFIED,
    ).length;
    const total = monthAbsences.length;

    return { justified, unjustified, total };
  }, [monthAbsences]);
  const globalStats = useMemo(() => ({
    total: absences.length,
    justified: absences.filter((a) => a.typeAbsence === AbsenceType.JUSTIFIED).length,
    unjustified: absences.filter((a) => a.typeAbsence === AbsenceType.UNJUSTIFIED).length,
  }), [absences]);

  const handleOpenAddModal = () => {
    setEditingAbsence(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (absence: AbsenceRecord) => {
    setEditingAbsence(absence);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (absence: AbsenceRecord) => {
    setDeletingAbsence(absence);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setDeletingAbsence(null);
    setEditingAbsence(null);
    setGeneratingAbsences(false);
  };

  const handleSaveAbsence = (absenceData: Partial<AbsenceRecord>) => {
    try {
      onSave(absenceData);
      toast.success(
        t('hr.absences.feedback.savedTitle'),
        t(editingAbsence ? 'hr.absences.feedback.updated' : 'hr.absences.feedback.added'),
      );
      handleCloseModals();
    } catch (error) {
      toast.error(
        t('hr.absences.feedback.saveError'),
        t('hr.absences.feedback.saveErrorHelp'),
      );
    }
  };

  const handleDeleteAbsence = () => {
    try {
      if (deletingAbsence) {
        onDelete(deletingAbsence.id);
        toast.success(
          t('hr.absences.feedback.deletedTitle'),
          t('hr.absences.feedback.deleted'),
        );
        handleCloseModals();
      }
    } catch (error) {
      toast.error(
        t('hr.absences.feedback.deleteError'),
        t('hr.absences.feedback.deleteErrorHelp'),
      );
    }
  };

  const handleGenerateDaily = () => {
    setGeneratingAbsences(true);
  };

  const handleConfirmGenerateDaily = () => {
    generateMutation.mutate();
  };

  const getTypeClass = (type: AbsenceType) => {
    switch (type) {
      case AbsenceType.JUSTIFIED:
        return 'bg-lime-100 text-lime-800';
      case AbsenceType.UNJUSTIFIED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handlePrint = () => {
    window.print();
    toast.info(t('hr.absences.feedback.printStarted'), t('hr.absences.feedback.printHelp'));
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.absences.table.employee') },
        { key: 'typeAbsence', label: t('hr.absences.table.type') },
        { key: 'startDate', label: t('hr.absences.table.startDate') },
        { key: 'endDate', label: t('hr.absences.table.endDate') },
        { key: 'reason', label: t('hr.absences.table.reason') },
      ];
      const data = absences.map((r) => ({
        ...r,
        typeAbsence: t(`hr.absenceType.${r.typeAbsence}`),
      }));
      exportToCsv('registre_absences', headers, data);
      toast.success(
        t('hr.absences.feedback.csvExported'),
        t('hr.absences.feedback.exportHelp'),
      );
    } catch (error) {
      toast.error(
        t('hr.absences.feedback.exportError'),
        t('hr.absences.feedback.csvExportErrorHelp'),
      );
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.absences.table.employee') },
        { key: 'typeAbsence', label: t('hr.absences.table.type') },
        { key: 'startDate', label: t('hr.absences.table.startDate') },
        { key: 'endDate', label: t('hr.absences.table.endDate') },
        { key: 'reason', label: t('hr.absences.table.reason') },
      ];
      const data = absences.map((r) => ({
        ...r,
        typeAbsence: t(`hr.absenceType.${r.typeAbsence}`),
      }));
      exportToPdf(t('hr.absences.title'), headers, data, 'absences');
      toast.success(
        t('hr.absences.feedback.pdfExported'),
        t('hr.absences.feedback.exportHelp'),
      );
    } catch (error) {
      toast.error(
        t('hr.absences.feedback.exportError'),
        t('hr.absences.feedback.pdfExportErrorHelp'),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {t('hr.absences.title')}
          </h1>
          <div className="flex items-center space-x-2 no-print flex-wrap">
            {/* Bouton génération auto */}
            <button
              onClick={handleGenerateDaily}
              disabled={generateMutation.isPending}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-lime-300 hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-60"
              title={t('hr.absences.actions.generateTooltip')}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  generateMutation.isPending ? 'animate-spin' : ''
                }`}
              />
              <span>
                {generateMutation.isPending
                  ? t('hr.absences.actions.generating')
                  : t('hr.absences.actions.generateDaily')}
              </span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 rounded-xl bg-[#c6e911] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-[#b6d90e]"
            >
              <IconPlus className="h-4 w-4" />
              <span>{t('hr.absences.add')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.print')}
              title={t('common.print')}
            >
              <IconPrint className="h-5 w-5" />
            </button>
            <button
              onClick={handleExportCsv}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.export')}
              title={t('common.export')}
            >
              <IconExport className="h-5 w-5" />
            </button>
            <button
              onClick={handleExportPdf}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.exportPdf')}
              title={t('common.exportPdf')}
            >
              <IconPdf className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Vue calendrier par mois et par année */}
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] gap-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-lime-50 p-2.5 text-lime-700"><CalendarDays className="w-5 h-5" /></span><div><h2 className="font-bold text-slate-900">{t('hr.absences.calendar.title')}</h2><p className="text-sm text-slate-500">{t('hr.absences.calendar.subtitle')}</p></div></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { const d = new Date(calendarYear, calendarMonth - 1, 1); setCalendarMonth(d.getMonth()); setCalendarYear(d.getFullYear()); setSelectedDay(''); setShowAllPeriods(false); }} className="p-2 rounded-lg border hover:bg-slate-50" aria-label={t('hr.absences.calendar.previousMonth')}><ChevronLeft className="w-4 h-4" /></button>
              <select aria-label={t('hr.absences.calendar.month')} value={calendarMonth} onChange={(e) => { setCalendarMonth(Number(e.target.value)); setSelectedDay(''); setShowAllPeriods(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">{Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date(2024, m, 1))}</option>)}</select>
              <select aria-label={t('hr.absences.calendar.year')} value={calendarYear} onChange={(e) => { setCalendarYear(Number(e.target.value)); setSelectedDay(''); setShowAllPeriods(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">{Array.from({ length: 9 }, (_, i) => calendarYear - 4 + i).map((year) => <option key={year} value={year}>{year}</option>)}</select>
              <button type="button" onClick={() => { const d = new Date(calendarYear, calendarMonth + 1, 1); setCalendarMonth(d.getMonth()); setCalendarYear(d.getFullYear()); setSelectedDay(''); setShowAllPeriods(false); }} className="p-2 rounded-lg border hover:bg-slate-50" aria-label={t('hr.absences.calendar.nextMonth')}><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{weekdayOptions.map((day) => <div key={day.value} className="py-2">{day.label}</div>)}</div>
          <div className="grid grid-cols-7 gap-1.5">{calendarCells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;
            const key = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = dayCounts[key] || 0;
            const selected = selectedDay === key;
            const holiday = holidayDates.has(key);
            const working = subsidiaryCalendar?.workingDays.includes(new Date(`${key}T00:00:00.000Z`).getUTCDay()) ?? true;
            return <button key={key} type="button" onClick={() => setSelectedDay(selected ? '' : key)} className={`min-h-[58px] rounded-lg border p-1 text-left transition ${selected ? 'border-lime-500 bg-lime-50 ring-2 ring-lime-200' : holiday ? 'border-violet-200 bg-violet-50 hover:border-violet-300' : count ? 'border-lime-200 bg-lime-50/70 hover:border-lime-400' : 'border-slate-100 hover:bg-slate-50'}`}><span className="block text-sm font-semibold text-slate-700">{day}</span>{holiday && <span className="mt-1 block truncate text-[10px] font-bold text-violet-800">{t('hr.absences.calendar.holidayTag')}</span>}{count > 0 && <span className="mt-1 inline-flex rounded-full bg-lime-200 px-1.5 py-0.5 text-[10px] font-bold text-lime-900">{t('hr.absences.calendar.dayCount', { count })}</span>}{!working && !holiday && <span className="mt-1 block text-[10px] text-slate-400">{t('hr.absences.calendar.restDay')}</span>}</button>;
          })}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-lime-400" />{t('hr.absences.calendar.absenceDay')}</span><span>{t('hr.absences.calendar.monthCount', { count: monthAbsences.length })}</span></div>
          <div className="mt-5 grid grid-cols-1 gap-5 border-t border-slate-100 pt-4 lg:grid-cols-2 no-print">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{t('hr.absences.calendar.workingDaysTitle')}</h3>
              <p className="mt-1 text-xs text-slate-500">{t('hr.absences.calendar.workingDaysHelp')}</p>
              <div className="mt-3 flex flex-wrap gap-2">{weekdayOptions.map((day) => {
                const checked = subsidiaryCalendar?.workingDays.includes(day.value) ?? [1, 2, 3, 4, 5].includes(day.value);
                return <label key={day.value} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${checked ? 'border-lime-300 bg-lime-50 text-slate-800' : 'border-slate-200 text-slate-500'}`}><input type="checkbox" checked={checked} disabled={workingDaysMutation.isPending || (checked && (subsidiaryCalendar?.workingDays.length || 5) === 1)} onChange={(event) => {
                  const current = subsidiaryCalendar?.workingDays ?? [1, 2, 3, 4, 5];
                  const next = event.target.checked ? [...current, day.value] : current.filter((value) => value !== day.value);
                  workingDaysMutation.mutate(next);
                }} className="accent-lime-600" />{day.label}</label>;
              })}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{t('hr.absences.calendar.holidaysTitle')}</h3>
              <p className="mt-1 text-xs text-slate-500">{t('hr.absences.calendar.holidaysHelp')}</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="text-xs text-slate-600">{t('hr.absences.calendar.date')}<input type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-2.5 py-2 text-sm" /></label>
                <label className="min-w-32 flex-1 text-xs text-slate-600">{t('hr.absences.calendar.name')}<input type="text" maxLength={150} value={holidayName} onChange={(event) => setHolidayName(event.target.value)} placeholder={t('hr.absences.calendar.holidayPlaceholder')} className="mt-1 block w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm" /></label>
                <button type="button" disabled={!holidayDate || !holidayName.trim() || addHolidayMutation.isPending} onClick={() => addHolidayMutation.mutate()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('hr.absences.calendar.addHoliday')}</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{(subsidiaryCalendar?.holidays || []).filter((holiday) => datePart(holiday.date).startsWith(`${calendarYear}-`)).map((holiday) => <span key={holiday.id} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-900">{formatDate(holiday.date)} · {holiday.name}<button type="button" onClick={() => removeHolidayMutation.mutate(holiday.id)} aria-label={t('hr.absences.calendar.deleteHoliday', { name: holiday.name })} className="ml-1 font-bold hover:text-red-600">×</button></span>)}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-slate-800 shadow-sm"><div><p className="text-sm text-slate-500">{t('hr.absences.calendar.globalTitle')}</p><p className="mt-2 text-4xl font-bold text-slate-900">{globalStats.total}</p><p className="text-sm text-slate-500">{t('hr.absences.calendar.globalTotal')}</p></div><div className="mt-6 space-y-4">
          <div><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{t('hr.absences.calendar.justified')}</span><strong>{globalStats.justified}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#c6e911]" style={{ width: `${globalStats.total ? (globalStats.justified / globalStats.total) * 100 : 0}%` }} /></div></div>
          <div><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{t('hr.absences.calendar.unjustified')}</span><strong>{globalStats.unjustified}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-rose-300" style={{ width: `${globalStats.total ? (globalStats.unjustified / globalStats.total) * 100 : 0}%` }} /></div></div>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">{t('hr.absences.calendar.monthLabel', { month: new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(new Date(calendarYear, calendarMonth, 1)) })}</span><strong>{absenceStats.total}</strong></div>
        </div></div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">{t('hr.absences.calendar.justified')} · {t('hr.absences.calendar.thisMonth')}</p>
              <p className="text-2xl font-semibold text-slate-900">
                {absenceStats.justified}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">
                {t('hr.absences.calendar.unjustified')} · {t('hr.absences.calendar.thisMonth')}
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {absenceStats.unjustified}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">{t('common.total')} · {t('hr.absences.calendar.thisMonth')}</p>
              <p className="text-2xl font-semibold text-slate-900">
                {absenceStats.total}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Absences Table Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            {t('hr.absences.registry.title')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('hr.absences.registry.subtitle')}
          </p>
        </div>
        <div className="no-print mb-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                aria-label={t('hr.absences.filters.searchPlaceholder')}
                placeholder={t('hr.absences.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                aria-label={t('hr.absences.filters.allTypes')}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'ALL' | AbsenceType)}
                className="min-w-[180px] appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.translationKey)}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span>{t('hr.absences.filters.fromDate')}</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="min-w-0 text-sm focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span>{t('hr.absences.filters.toDate')}</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="min-w-0 text-sm focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={showAllPeriods}
                onClick={() => { setShowAllPeriods((current) => !current); setSelectedDay(''); }}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${showAllPeriods ? 'border-lime-400 bg-lime-50 font-semibold text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                {t('hr.absences.filters.allPeriods')}
              </button>
              {!showAllPeriods && !dateFrom && !dateTo && (
                <span className="text-xs text-slate-500">{t('hr.absences.filters.calendarPeriod', { month: new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(new Date(calendarYear, calendarMonth, 1)) })}</span>
              )}
              {selectedDay && <span className="text-xs text-slate-500">{t('hr.absences.filters.selectedDate', { date: selectedDay })}</span>}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-500">
                {t('hr.absences.results.count', { count: filteredAbsences.length })}
                {hasActiveFilters && absences.length > 0 ? ` ${t('hr.absences.results.ofTotal', { total: absences.length })}` : ''}
              </p>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800">
                  <X className="h-4 w-4" />{t('hr.absences.filters.reset')}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.employee')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.type')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.startDate')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.endDate')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.reason')}
                </th>
                <th scope="col" className="px-6 py-3 text-center no-print">
                  {t('hr.absences.table.document')}
                </th>
                <th scope="col" className="px-6 py-3 text-center no-print">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={7} columns={7} />
              ) : filteredAbsences.length > 0 ? (
                filteredAbsences.map((record) => (
                  <tr
                    key={record.id}
                    className="bg-white border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                          record.typeAbsence,
                        )}`}
                      >
                        {t(`hr.absenceType.${record.typeAbsence}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(record.startDate)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(record.endDate)}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {record.reason}
                    </td>
                    <td className="px-6 py-4 text-center no-print">
                      {record.documentUrl ? (
                        <a
                          href={`${api.defaults.baseURL}${record.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-lime-100 hover:text-lime-800"
                        >
                          <IconDownload className="h-4 w-4" />
                          <span>{t('hr.absences.table.download')}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t('hr.absences.table.noDocument')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center space-x-1 no-print">
                      <button
                        onClick={() => handleOpenEditModal(record)}
                        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-lime-50 hover:text-lime-800"
                        aria-label={t('common.edit')}
                      >
                        <IconEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(record)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <IconDelete className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="inbox" title={t('hr.absences.registry.empty')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormModalOpen && (
        <AbsenceFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSave={handleSaveAbsence}
          absence={editingAbsence}
          employees={employees}
          subsidiary={subsidiary}
        />
      )}

      {deletingAbsence && (
        <ConfirmationModal
          isOpen={!!deletingAbsence}
          onClose={handleCloseModals}
          onConfirm={handleDeleteAbsence}
          title={t('hr.absences.confirmations.deleteTitle')}
          message={t('hr.absences.confirmations.deleteMessage', { employee: deletingAbsence.employeeName })}
        />
      )}

      {generatingAbsences && (
        <ConfirmationModal
          isOpen={generatingAbsences}
          onClose={handleCloseModals}
          onConfirm={handleConfirmGenerateDaily}
          title={t('hr.absences.confirmations.generateTitle')}
          message={t('hr.absences.confirmations.generateMessage')}
          confirmButtonText={t('hr.absences.confirmations.generateConfirm')}
          isLoading={generateMutation.isPending}
        />
      )}
    </div>
  );
};

export default AbsenceManagement;
