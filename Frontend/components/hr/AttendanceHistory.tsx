import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconUserClock from '../icons/IconUserClock';
import { Search, Filter, X } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  attendanceDate: string;
  arrivalTime: string | null;
  departureTime: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LEFT' | 'LEFT_OUTSIDE_GEOFENCE' | 'LATE';
  isGeolocationValid: boolean;
  accuracyMeters?: number | null;
  qrCodeToken?: string | null;
}

interface AttendanceHistoryProps {
  subsidiary?: any;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'PRESENT', label: 'Présent' },
  { value: 'LATE', label: 'En retard' },
  { value: 'LEFT', label: 'Parti' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEFT_OUTSIDE_GEOFENCE', label: 'Parti (hors zone)' },
] as const;

const AttendanceHistory: React.FC<AttendanceHistoryProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Appel de findAll → GET /hr/attendance-records
  const {
    data: attendanceHistory,
    isLoading: historyLoading,
    error,
  } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: async () => {
      const response = await api.get('/hr/attendance-records');
      const payload = response.data;

      if (Array.isArray(payload)) return payload as AttendanceRecord[];
      if (Array.isArray(payload?.data)) return payload.data as AttendanceRecord[];

      return [];
    },
  });

  const filteredRecords = useMemo(() => {
    if (!attendanceHistory) return [];

    return attendanceHistory.filter((record) => {
      const recordDate = new Date(record.attendanceDate);

      // Filtre mois / année
      const matchesMonthYear =
        recordDate.getFullYear() === year &&
        recordDate.getMonth() + 1 === month;

      // Recherche texte
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (record.employeeName || '').toLowerCase().includes(term) ||
        record.status.toLowerCase().includes(term);

      // Filtre statut
      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter;

      // Filtre date début
      const matchesDateFrom = !dateFrom || recordDate >= new Date(dateFrom);

      // Filtre date fin
      const matchesDateTo =
        !dateTo || recordDate <= new Date(dateTo + 'T23:59:59');

      return (
        matchesMonthYear &&
        matchesSearch &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    attendanceHistory,
    year,
    month,
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const formatDuration = (
    arrival: string | null,
    departure: string | null,
  ): string => {
    if (!arrival || !departure) return '—';
    const start = new Date(arrival).getTime();
    const end = new Date(departure).getTime();
    const diffMs = end - start;
    if (diffMs < 0) return '—';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  };

  const renderStatus = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
            <IconCheckCircle className="w-3 h-3" />
            Présent
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
            <IconUserClock className="w-3 h-3" />
            En retard
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
            Absent
          </span>
        );
      case 'LEFT':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
            Parti
          </span>
        );
      case 'LEFT_OUTSIDE_GEOFENCE':
        return (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
            Parti (hors zone)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Historique des Présences
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Toutes les présences de la filiale
            </p>
          </div>

          {/* Sélecteur mois / année */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] appearance-none bg-white min-w-[180px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date de */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            title="Date de début"
          />

          {/* Date à */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            title="Date de fin"
          />

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Compteur de résultats */}
        <p className="text-xs text-slate-500">
          {filteredRecords.length} résultat
          {filteredRecords.length !== 1 ? 's' : ''}
          {hasActiveFilters && attendanceHistory
            ? ` sur ${attendanceHistory.length}`
            : ''}
        </p>
      </div>

      {/* Erreur API */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
          Erreur de chargement :{' '}
          {(error as any)?.response?.data?.message ||
            (error as Error).message}
        </div>
      )}

      {/* Tableau */}
      {historyLoading ? (
        <div className="text-center py-12 text-slate-500">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#c6e911] rounded-full mx-auto"></div>
          <p className="mt-3">Chargement...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Employé
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Date
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Arrivée
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Départ
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Durée
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Statut
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  GPS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {record.employeeName || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {new Date(record.attendanceDate).toLocaleDateString(
                        'fr-FR',
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {record.arrivalTime
                        ? new Date(record.arrivalTime).toLocaleTimeString(
                            'fr-FR',
                            { hour: '2-digit', minute: '2-digit' },
                          )
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {record.departureTime
                        ? new Date(record.departureTime).toLocaleTimeString(
                            'fr-FR',
                            { hour: '2-digit', minute: '2-digit' },
                          )
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-mono text-xs">
                      {formatDuration(
                        record.arrivalTime,
                        record.departureTime,
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatus(record.status)}</td>
                    <td className="px-6 py-4">
                      {record.isGeolocationValid &&
                      record.accuracyMeters != null ? (
                        <span className="text-slate-600 text-xs">
                          ±{Math.round(record.accuracyMeters)}m
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {hasActiveFilters
                      ? 'Aucun résultat pour ces filtres'
                      : 'Aucun enregistrement pour ce mois'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;