import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconCancelX from '../icons/IconCancelX';
import IconMapPin from '../icons/IconMapPin';
import IconUserClock from '../icons/IconUserClock';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconSignature from '../icons/IconSignature';

interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  positions: string;
}

interface DailyQrCode {
  token: string;
  issuedAt: string;
  expiresAt: string;
  subsidiaryId: string;
  employeeId: string;
  employee: EmployeeInfo;
}

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

interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  averageArrivalTime: string;
}

interface AttendanceQRComponentProps {
  subsidiary: any;
}

export const AttendanceQRComponent: React.FC<AttendanceQRComponentProps> = ({ subsidiary }) => {
  const { api } = useAuth();

  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: dailyQr, isLoading: qrLoading } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: async () => {
      const response = await api.get<DailyQrCode>('/hr/attendance-checkin/daily-qr');
      return response.data;
    },
    refetchInterval: 60000
  });

  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: async () => {
      const now = new Date();
      const response = await api.get<AttendanceRecord[]>('/hr/attendance-checkin/history', {
        params: {
          year: now.getFullYear(),
          month: now.getMonth() + 1
        }
      });
      return response.data;
    }
  });

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: async () => {
      const response = await api.get<AttendanceSummary>('/hr/attendance-checkin/summary');
      return response.data;
    }
  });


  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMessage('Géolocalisation non disponible');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position.coords);
        setErrorMessage(null);
      },
      (error) => {
        setErrorMessage('Erreur GPS. Veuillez autoriser l\'accès à votre position.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Days */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-5 border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-200 p-3 rounded-lg">
              <IconCheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <span className="text-xs font-semibold text-green-700 bg-white px-2 py-1 rounded-full">Ce mois</span>
          </div>
          <p className="text-sm text-green-700 font-medium mb-1">Jours présents</p>
          <p className="text-3xl font-bold text-green-700">{summary?.presentDays || 0}</p>
        </div>

        {/* Absent Days */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md p-5 border border-red-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-200 p-3 rounded-lg">
              <IconCancelX className="w-6 h-6 text-red-700" />
            </div>
            <span className="text-xs font-semibold text-red-700 bg-white px-2 py-1 rounded-full">Ce mois</span>
          </div>
          <p className="text-sm text-red-700 font-medium mb-1">Jours absents</p>
          <p className="text-3xl font-bold text-red-700">{summary?.absentDays || 0}</p>
        </div>

        {/* Late Days */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-5 border border-amber-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-200 p-3 rounded-lg">
              <IconUserClock className="w-6 h-6 text-amber-700" />
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-white px-2 py-1 rounded-full">Ce mois</span>
          </div>
          <p className="text-sm text-amber-700 font-medium mb-1">Jours en retard</p>
          <p className="text-3xl font-bold text-amber-700">{summary?.lateDays || 0}</p>
        </div>

        {/* Average Arrival */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-5 border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-200 p-3 rounded-lg">
              <IconTrendingUp className="w-6 h-6 text-blue-700" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded-full">Moyenne</span>
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">Arrivée moyenne</p>
          <p className="text-3xl font-bold text-blue-700">{summary?.averageArrivalTime || '08:30'}</p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 flex items-center gap-3">
          <IconCancelX className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-800 font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* QR Code Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <IconSignature className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Votre QR Code Personnel</h3>
              </div>

              {qrLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#c6e911] rounded-full mx-auto"></div>
                  <p className="mt-3">Chargement...</p>
                </div>
              ) : (
                  <>
                    {dailyQr?.employee && (
                      <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                        <div className="mb-3">
                          <p className="text-xs text-indigo-600 font-semibold uppercase">Employé</p>
                          <p className="text-lg font-bold text-indigo-900">{dailyQr.employee.firstName} {dailyQr.employee.lastName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-indigo-600 font-semibold">Email</p>
                            <p className="text-indigo-800 truncate">{dailyQr.employee.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-indigo-600 font-semibold">Département</p>
                            <p className="text-indigo-800">{dailyQr.employee.department}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <IconUserClock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-700 font-medium">
                        Valide jusqu'à minuit
                      </span>
                    </div>

                    <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-slate-200">
                      <QRCode value={dailyQr?.token || ''} size={220} level="H" includeMargin />
                    </div>
                  </>
              )}
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <IconMapPin className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Votre Position</h3>
              </div>

              {currentLocation ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold mb-1">Latitude</p>
                    <p className="text-sm font-mono text-slate-800">{currentLocation.latitude.toFixed(6)}°</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold mb-1">Longitude</p>
                    <p className="text-sm font-mono text-slate-800">{currentLocation.longitude.toFixed(6)}°</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold mb-1">Précision GPS</p>
                    <p className="text-sm font-mono text-slate-800">±{Math.round(currentLocation.accuracy)}m</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    {currentLocation.accuracy < 50 ? (
                      <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Excellente
                      </span>
                    ) : currentLocation.accuracy < 100 ? (
                      <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                        Acceptable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                        Faible
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="animate-pulse w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto"></div>
                  <p className="mt-3">Localisation en cours...</p>
                </div>
              )}
            </div>
          </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Arrivée</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Départ</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Statut</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendanceHistory && attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
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
                          {record.status === 'PRESENT' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w-2 h-2 bg-green-600 rounded-full"></span>Présent</span>}
                          {record.status === 'LATE' && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w-2 h-2 bg-yellow-600 rounded-full"></span>Retard</span>}
                          {record.status === 'ABSENT' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w-2 h-2 bg-red-600 rounded-full"></span>Absent</span>}
                          {record.status === 'LEFT' && <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w-2 h-2 bg-blue-600 rounded-full"></span>Parti</span>}
                          {record.status === 'LEFT_OUTSIDE_GEOFENCE' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w-2 h-2 bg-red-600 rounded-full"></span>Hors zone</span>}
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
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Aucun enregistrement pour ce mois
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

export default AttendanceQRComponent;
