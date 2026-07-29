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
  subsidiaryId: string;
  employeeId: string;
  employee: Employee;
}

interface CheckInResponse {
  success: boolean;
  type: 'check-in' | 'check-out';
  message: string;
  employeeName?: string;
  status: string;
  duration?: string;
  record?: any;
}

interface AttendanceCardsProps {
  subsidiary: any;
}

// ============================================================
// Sons de feedback
// ============================================================
const playBeep = (opts?: {
  frequency?: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
}) => {
  try {
    const frequency = opts?.frequency ?? 880;
    const duration = opts?.duration ?? 120;
    const volume = opts?.volume ?? 0.25;
    const type = opts?.type ?? 'sine';

    const AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.value = volume;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();

    // Fade out doux
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    setTimeout(() => {
      o.stop();
      try {
        ctx.close();
      } catch (e) {
        /* ignore */
      }
    }, duration);
  } catch (e) {
    // ignore audio errors
  }
};

/** Son de succès (deux notes montantes) */
const playSuccessSound = () => {
  playBeep({ frequency: 660, duration: 100, volume: 0.2 });
  setTimeout(() => {
    playBeep({ frequency: 880, duration: 150, volume: 0.25 });
  }, 100);
};

/** Son d'erreur (note grave) */
const playErrorSound = () => {
  playBeep({ frequency: 220, duration: 250, volume: 0.3, type: 'square' });
};

const AttendanceCards: React.FC<AttendanceCardsProps> = ({ subsidiary }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentLocation, setCurrentLocation] =
    useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanFlash, setScanFlash] = useState(false); // flash vert au moment du scan
  const scanningRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');

  const { data: employeesWithQr, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-with-qr'],
    queryFn: async () => {
      const response = await api.get<EmployeeWithQr[]>(
        '/hr/attendance-checkin/daily-qr-all',
      );
      return response.data;
    },
  });

  const filteredEmployees = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!employeesWithQr || !term) return employeesWithQr || [];
    return employeesWithQr.filter((item) => {
      const emp = item.employee || ({} as Employee);
      const fullName =
        `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const id = (emp.id || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const positions = (emp.positions || '').toLowerCase();
      return (
        fullName.includes(term) ||
        id.includes(term) ||
        email.includes(term) ||
        positions.includes(term)
      );
    });
  }, [employeesWithQr, searchTerm]);

  const checkInMutation = useMutation({
    mutationFn: async (dto: {
      qrToken: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    }) => {
      const response = await api.post<CheckInResponse>(
        '/hr/attendance-checkin/check-in',
        dto,
      );
      return response.data;
    },
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => setCurrentLocation(position.coords),
      () => setCurrentLocation(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const startScanner = async () => {
    setScannerActive(true);
    setErrorMessage(null);
    setScanFlash(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
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
    setScanFlash(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
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

        if (code) {
          scanningRef.current = false;

          // Flash visuel + son immédiat au moment de la détection
          setScanFlash(true);
          playSuccessSound();

          handleCheckIn(code.data);

          // Petit délai pour laisser voir le flash avant de fermer
          setTimeout(() => {
            stopScanner();
          }, 600);
          return;
        }
      }
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleCheckIn = async (qrToken: string) => {
    try {
      const payload: {
        qrToken: string;
        latitude?: number;
        longitude?: number;
        accuracy?: number;
      } = { qrToken };

      if (currentLocation) {
        payload.latitude = currentLocation.latitude;
        payload.longitude = currentLocation.longitude;
        payload.accuracy = currentLocation.accuracy;
      }

      const response = await checkInMutation.mutateAsync(payload);

      const msg =
        response.type === 'check-out'
          ? `${response.message}${
              response.duration ? ` (${response.duration})` : ''
            }`
          : response.message;

      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error: any) {
      playErrorSound();
      setErrorMessage(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const downloadCard = async (employeeId: string, employeeName: string) => {
    const cardElement = document.getElementById(`card-${employeeId}`);
    if (cardElement) {
      try {
        const buttons = cardElement.querySelectorAll('.action-buttons');
        buttons.forEach((btn) => ((btn as HTMLElement).style.display = 'none'));

        const canvas = await html2canvas(cardElement, {
          scale: 2,
          backgroundColor: '#ffffff',
        });

        buttons.forEach((btn) => ((btn as HTMLElement).style.display = 'flex'));

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
      {/* Styles CSS pour les animations du scanner */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes pulse-corner {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes flash-green {
          0%   { background-color: transparent; }
          30%  { background-color: rgba(34, 197, 94, 0.45); }
          100% { background-color: transparent; }
        }
        .scan-line {
          position: absolute;
          left: 12%;
          right: 12%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c6e911, transparent);
          box-shadow: 0 0 12px 2px rgba(198, 233, 17, 0.7);
          animation: scan-line 2s ease-in-out infinite;
          z-index: 10;
        }
        .scan-corner {
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: #c6e911;
          border-style: solid;
          animation: pulse-corner 1.5s ease-in-out infinite;
          z-index: 10;
        }
        .scan-corner-tl { top: 12%; left: 12%; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
        .scan-corner-tr { top: 12%; right: 12%; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
        .scan-corner-bl { bottom: 12%; left: 12%; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
        .scan-corner-br { bottom: 12%; right: 12%; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
        .scan-flash {
          animation: flash-green 0.6s ease-out;
        }
      `}</style>

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Scanner une carte
                </h3>
                <button
                  onClick={stopScanner}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <IconCancelX className="w-6 h-6" />
                </button>
              </div>

              {/* Zone caméra avec effets */}
              <div
                className={`relative bg-black rounded-lg overflow-hidden mb-4 ${
                  scanFlash ? 'scan-flash' : ''
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-72 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay sombre autour de la zone de scan */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Coins animés */}
                  <div className="scan-corner scan-corner-tl" />
                  <div className="scan-corner scan-corner-tr" />
                  <div className="scan-corner scan-corner-bl" />
                  <div className="scan-corner scan-corner-br" />

                  {/* Ligne de scan animée */}
                  {!scanFlash && <div className="scan-line" />}
                </div>

                {/* Indicateur "scan en cours" */}
                {!scanFlash && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#c6e911] rounded-full animate-pulse" />
                      Recherche du QR code...
                    </span>
                  </div>
                )}

                {/* Message flash succès */}
                {scanFlash && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <IconCheckCircle className="w-5 h-5" />
                      QR détecté !
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 text-center">
                Pointez la caméra vers un QR code de carte de présence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Status (informatif uniquement) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <IconMapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Position Actuelle
          </h3>
          <span className="text-xs text-slate-400 ml-2">(informatif)</span>
        </div>

        {currentLocation ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">
                Latitude
              </p>
              <p className="text-sm font-mono text-slate-800">
                {currentLocation.latitude.toFixed(4)}°
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">
                Longitude
              </p>
              <p className="text-sm font-mono text-slate-800">
                {currentLocation.longitude.toFixed(4)}°
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600 font-semibold mb-1">
                Précision
              </p>
              <p className="text-sm font-mono text-slate-800">
                ±{Math.round(currentLocation.accuracy)}m
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <p className="text-sm">
              Position GPS non disponible (le pointage reste possible)
            </p>
          </div>
        )}
      </div>

      {/* Employees Grid */}
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800">
              Cartes de Présence
            </h2>
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
                  <div
                    key={employee.id}
                    id={`card-${employee.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 transition-shadow hover:shadow-lg"
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white text-center">
                      <h3 className="text-xl font-bold mb-1">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-indigo-100">
                        {employee.positions || 'Poste non défini'}
                      </p>
                      <p className="text-xs text-indigo-200 mt-1">
                        {employee.department || 'Département non défini'}
                      </p>
                    </div>

                    <div className="p-6 flex flex-col items-center">
                      <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">
                        Carte d'accès & pointage
                      </p>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner mb-4">
                        <QRCode
                          value={item.token}
                          size={160}
                          level="H"
                          includeMargin
                        />
                      </div>

                      <p className="text-xs text-slate-500 text-center mb-6">
                        Émise le{' '}
                        {new Date(item.issuedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>

                      <div className="w-full flex gap-2 action-buttons">
                        <button
                          onClick={() =>
                            downloadCard(
                              employee.id,
                              `${employee.firstName} ${employee.lastName}`,
                            )
                          }
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
    </div>
  );
};

export default AttendanceCards;