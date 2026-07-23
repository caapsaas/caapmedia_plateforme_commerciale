import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import jsQR from 'jsqr';
import { useAuth } from '../../context/AuthContext';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconCancelX from '../icons/IconCancelX';
import IconMapPin from '../icons/IconMapPin';
import IconUserClock from '../icons/IconUserClock';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  positions?: string;
}

interface EmployeeWithQr {
  token: string;
  issuedAt: string;
  expiresAt: string;
  subsidiaryId: string;
  employeeId: string;
  employee: Employee;
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

interface AttendanceQRComponentProps {
  subsidiary: any;
}

interface CheckInResponse {
  success: boolean;
  message: string;
  employeeName: string;
  status: string;
  distance: string;
  accuracy: string;
}

export const AttendanceQRComponent: React.FC<AttendanceQRComponentProps> = ({ subsidiary }) => {
  const { api } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const scanningRef = useRef(false);

  const { data: employeesWithQr, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-with-qr'],
    queryFn: async () => {
      const response = await api.get<EmployeeWithQr[]>('/hr/attendance-checkin/daily-qr-all');
      return response.data;
    }
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

  const checkInMutation = useMutation({
    mutationFn: async (dto: { qrToken: string; latitude: number; longitude: number; accuracy: number }) => {
      const response = await api.post<CheckInResponse>('/hr/attendance-checkin/check-in', dto);
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


  const [qrTokenToScan, setQrTokenToScan] = useState<string>('');

  const startScanner = async (employee: Employee, token: string) => {
    setSelectedEmployee(employee);
    setQrTokenToScan(token);
    setScannerActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        scanningRef.current = true;
        scanQRCode();
      }
    } catch (error) {
      setErrorMessage('Impossible d\'accéder à la caméra');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    scanningRef.current = false;
    setScannerActive(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    setSelectedEmployee(null);
  };

  const scanQRCode = () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && selectedEmployee && currentLocation && qrTokenToScan) {
        if (code.data === qrTokenToScan) {
          scanningRef.current = false;
          handleCheckIn(qrTokenToScan, selectedEmployee);
          stopScanner();
          return;
        } else {
          setErrorMessage('QR code non valide. Assurez-vous de scanner le QR code correct.');
          setTimeout(() => setErrorMessage(null), 2000);
        }
      }
    }

    requestAnimationFrame(scanQRCode);
  };

  const handleCheckIn = async (qrToken: string, employee: Employee) => {
    if (!currentLocation) {
      setErrorMessage('Position GPS non disponible');
      return;
    }

    try {
      const response = await checkInMutation.mutateAsync({
        qrToken,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy
      });

      setSuccessMessage(response.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 flex items-center gap-3">
          <IconCancelX className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-800 font-semibold">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-4 flex items-center gap-3">
          <IconCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Scanner Modal */}
      {scannerActive && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Scanner le QR Code</h3>
                <button onClick={stopScanner} className="text-slate-500 hover:text-slate-700">
                  <IconCancelX className="w-6 h-6" />
                </button>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-yellow-400 opacity-50"></div>
              </div>

              <p className="text-sm text-slate-600 text-center">
                Pointez votre caméra sur le QR code de {selectedEmployee.firstName} {selectedEmployee.lastName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <IconMapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Position Actuelle</h3>
        </div>

        {currentLocation ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">Latitude</p>
              <p className="text-sm font-mono text-slate-800">{currentLocation.latitude.toFixed(4)}°</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">Longitude</p>
              <p className="text-sm font-mono text-slate-800">{currentLocation.longitude.toFixed(4)}°</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">Précision</p>
              <p className="text-sm font-mono text-slate-800">±{Math.round(currentLocation.accuracy)}m</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-pulse w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto"></div>
            <p className="mt-3">Localisation en cours...</p>
          </div>
        )}
      </div>

      {/* Employees Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Liste des Employés</h2>

        {employeesLoading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#c6e911] rounded-full mx-auto"></div>
            <p className="mt-3">Chargement des employés...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employeesWithQr && employeesWithQr.length > 0 ? (
              employeesWithQr.map((item) => {
                const employee = item.employee;
                return (
                  <div key={employee.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Employee Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-indigo-100">{employee.positions || 'Position non définie'}</p>
                        <p className="text-xs text-indigo-100">{employee.department || 'Département non défini'}</p>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="p-6">
                      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Code QR Personnel</p>
                      <div className="bg-white p-4 rounded-lg border-2 border-slate-200 flex justify-center mb-4">
                        <QRCode
                          value={item.token}
                          size={120}
                          level="H"
                          includeMargin
                        />
                      </div>

                      <p className="text-xs text-slate-600 text-center mb-4">
                        Valide jusqu'à {new Date(item.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <button
                        onClick={() => startScanner(employee, item.token)}
                        disabled={checkInMutation.isPending || !currentLocation}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <IconUserClock className="w-5 h-5" />
                        {checkInMutation.isPending ? 'Enregistrement...' : 'Scanner Présence'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                Aucun employé trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Section */}
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
                  attendanceHistory.map((record) => (
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
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
