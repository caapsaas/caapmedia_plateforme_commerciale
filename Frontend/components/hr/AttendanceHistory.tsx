import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconUserClock from '../icons/IconUserClock';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  attendanceDate: string;
  arrivalTime: string | null;
  departureTime: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LEFT' | 'LEFT_OUTSIDE_GEOFENCE' | 'LATE';
  isGeolocationValid: boolean;
  accuracyMeters?: number;
}

interface AttendanceHistoryProps {
  subsidiary?: any;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = () => {
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: async () => {
      const now = new Date();
      const response = await api.get<AttendanceRecord[]>('/hr/attendance-checkin/history', {
        params: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      });
      return response.data;
    },
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b-2 border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Historique des Présences</h2>
      </div>

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
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Employé</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Arrivée</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Départ</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendanceHistory && attendanceHistory.length > 0 ? (
                attendanceHistory.map((record: AttendanceRecord) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-800 font-medium">{record.employeeName}</td>
                    <td className="px-6 py-4 text-slate-800">{new Date(record.attendanceDate).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-slate-800">
                      {record.arrivalTime
                        ? new Date(record.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {record.departureTime
                        ? new Date(record.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'PRESENT' && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          <IconCheckCircle className="w-3 h-3" />
                          Présent
                        </span>
                      )}
                      {record.status === 'LATE' && (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                          <IconUserClock className="w-3 h-3" />
                          En retard
                        </span>
                      )}
                      {record.status === 'ABSENT' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Absent</span>
                      )}
                      {record.status === 'LEFT' && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Parti</span>
                      )}
                      {record.status === 'LEFT_OUTSIDE_GEOFENCE' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Parti - hors zone</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.isGeolocationValid ? (
                        <span className="text-green-600 font-semibold">✓ ±{record.accuracyMeters}m</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✕ Non validée</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Aucun enregistrement pour ce mois</td>
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
