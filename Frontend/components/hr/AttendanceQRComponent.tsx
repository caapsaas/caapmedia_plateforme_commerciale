import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import jsQR from 'jsqr';
import html2canvas from 'html2canvas';
import { Camera, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scanningRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');

  const { data: employeesWithQr, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-with-qr'],
    queryFn: async () => {
      const response = await api.get<EmployeeWithQr[]>('/hr/attendance-checkin/daily-qr-all');
      return response.data;
    }
  });

  const filteredEmployees = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!employeesWithQr || !term) return employeesWithQr || [];
    return employeesWithQr.filter(item => {
      const emp = item.employee || {} as Employee;
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const id = (emp.id || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const positions = (emp.positions || '').toLowerCase();
      return fullName.includes(term) || id.includes(term) || email.includes(term) || positions.includes(term);
    });
  }, [employeesWithQr, searchTerm]);

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

  const startScanner = async () => {
    setScannerActive(true);
    setErrorMessage(null);

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
      setErrorMessage("Impossible d'accéder à la caméra");
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
  };

  const scanQRCode = () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && currentLocation) {
          scanningRef.current = false;
          handleCheckIn(code.data);
          stopScanner();
          return;
        }
      }
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleCheckIn = async (qrToken: string) => {
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
      setErrorMessage(error.response?.data?.message || "Erreur lors de l'enregistrement");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const downloadCard = async (employeeId: string, employeeName: string) => {
    const cardElement = document.getElementById(`card-${employeeId}`);
    if (cardElement) {
      try {
        const buttons = cardElement.querySelectorAll('.action-buttons');
        buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
        
        const canvas = await html2canvas(cardElement, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        buttons.forEach(btn => (btn as HTMLElement).style.display = 'flex');

        const image = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `carte_presence_${employeeName.replace(/\s+/g, '_')}.jpg`;
        link.click();
      } catch (error) {
        console.error('Erreur lors de la génération de la carte:', error);
      }
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
      {scannerActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Scanner une carte</h3>
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
                Pointez la caméra vers un QR code de carte de présence
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Cartes de Présence</h2>
            <div className="relative">
              <input
                type="search"
                placeholder="Rechercher (nom, id, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                aria-label="Rechercher cartes de présence"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 px-2"
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={startScanner}
            disabled={!currentLocation}
            className="bg-[#c6e911] hover:bg-[#b0cc0f] text-slate-800 font-semibold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Lancer le Scanner
          </button>
        </div>

        {employeesLoading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#c6e911] rounded-full mx-auto"></div>
            <p className="mt-3">Chargement des employés...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees && filteredEmployees.length > 0 ? (
              filteredEmployees.map((item: EmployeeWithQr) => {
                const employee = item.employee;
                return (
                  <div key={employee.id} id={`card-${employee.id}`} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 transition-shadow hover:shadow-lg">
                    {/* Employee Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white text-center">
                      <h3 className="text-xl font-bold mb-1">{employee.firstName} {employee.lastName}</h3>
                      <p className="text-sm text-indigo-100">{employee.positions || 'Poste non défini'}</p>
                      <p className="text-xs text-indigo-200 mt-1">{employee.department || 'Département non défini'}</p>
                    </div>

                    {/* QR Code */}
                    <div className="p-6 flex flex-col items-center">
                      <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">Carte d'accès & pointage</p>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner mb-4">
                        <QRCode
                          value={item.token}
                          size={160}
                          level="H"
                          includeMargin
                        />
                      </div>

                      <p className="text-xs text-slate-500 text-center mb-6">
                        Valide jusqu'à {new Date(item.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="w-full flex gap-2 action-buttons">
                        <button
                          onClick={() => downloadCard(employee.id, `${employee.firstName} ${employee.lastName}`)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Enregistrer (JPG)
                        </button>
                      </div>
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
                        {record.status === 'PRESENT' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold"><span className="w
                      {/* truncated for brevity in rendering */}
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
