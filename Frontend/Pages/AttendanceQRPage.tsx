import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import QRCode from 'qrcode.react';
import jsQR from 'jsqr';
import { useAuth } from '../context/AuthContext';
import '../styles/attendance-qr.scss';

interface DailyQrCode {
  token: string;
  issuedAt: string;
  expiresAt: string;
  subsidiaryId: string;
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

export const AttendanceQRPage: React.FC = () => {
  const { api, subsidiary } = useAuth();
  const [scanMode, setScanMode] = useState<'qr' | 'history'>('qr');
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Récupérer le QR code du jour
  const { data: dailyQr, isLoading: qrLoading } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: () => api.get<DailyQrCode>('/hr/attendance-checkin/daily-qr'),
    refetchInterval: 60000
  });

  // Récupérer l'historique
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => {
      const now = new Date();
      return api.get<AttendanceRecord[]>('/hr/attendance-checkin/history', {
        params: {
          year: now.getFullYear(),
          month: now.getMonth() + 1
        }
      });
    }
  });

  // Récupérer statistiques
  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => api.get<AttendanceSummary>('/hr/attendance-checkin/summary')
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/hr/attendance-checkin/check-in', data),
    onSuccess: () => {
      setScanSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setScanSuccess(false), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || 'Erreur lors du check-in'
      );
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/hr/attendance-checkin/check-out', data),
    onSuccess: () => {
      setScanSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setScanSuccess(false), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || 'Erreur lors du check-out'
      );
    }
  });

  // Géolocalisation
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMessage('Géolocalisation non disponible sur cet appareil');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position.coords);
        setErrorMessage(null);
      },
      (error) => {
        setErrorMessage(
          `Erreur GPS: ${error.message}. Veuillez autoriser l'accès à votre position.`
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Scanner QR
  useEffect(() => {
    if (scanMode !== 'qr' || !videoRef.current) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scanQRLoop();
        }
      })
      .catch((err) => {
        setErrorMessage('Impossible d\'accéder à la caméra');
      });
  }, [scanMode]);

  const scanQRLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || scanMode !== 'qr') return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context?.drawImage(video, 0, 0);
    const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);

    if (imageData) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data && currentLocation) {
        handleQrScanned(code.data);
      }
    }

    requestAnimationFrame(scanQRLoop);
  };

  const handleQrScanned = async (qrData: string) => {
    if (!currentLocation) {
      setErrorMessage('Position GPS non disponible');
      return;
    }

    checkInMutation.mutate({
      qrToken: qrData,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy
    });
  };

  const handleCheckOut = async () => {
    if (!currentLocation) {
      setErrorMessage('Position GPS non disponible');
      return;
    }

    checkOutMutation.mutate({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy
    });
  };

  const downloadQr = () => {
    const canvas = document.querySelector('.qr-code-wrapper canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qr-${new Date().toISOString().split('T')[0]}.png`;
          a.click();
        }
      });
    }
  };

  return (
    <div className="attendance-qr-page">
      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card present">
          <div className="icon">✓</div>
          <div className="label">Présents</div>
          <div className="value">{summary?.presentDays || 0}</div>
        </div>
        <div className="stat-card absent">
          <div className="icon">✕</div>
          <div className="label">Absents</div>
          <div className="value">{summary?.absentDays || 0}</div>
        </div>
        <div className="stat-card late">
          <div className="icon">⏰</div>
          <div className="label">En retard</div>
          <div className="value">{summary?.lateDays || 0}</div>
        </div>
        <div className="stat-card">
          <div className="icon">🕐</div>
          <div className="label">Arrivée moy</div>
          <div className="value">{summary?.averageArrivalTime || '09:00'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${scanMode === 'qr' ? 'active' : ''}`}
          onClick={() => setScanMode('qr')}
        >
          🔲 Scanner QR
        </button>
        <button
          className={`tab ${scanMode === 'history' ? 'active' : ''}`}
          onClick={() => setScanMode('history')}
        >
          📋 Historique
        </button>
      </div>

      {/* Messages */}
      {scanSuccess && (
        <div className="success-message">✓ Enregistrement réussi!</div>
      )}
      {errorMessage && (
        <div className="error-message">⚠️ {errorMessage}</div>
      )}

      {/* QR Scanner */}
      {scanMode === 'qr' && (
        <div className="qr-section">
          <div className="qr-display">
            <h2>📸 QR Code d'Aujourd'hui</h2>
            {qrLoading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <>
                <p className="expiry">
                  Valide jusqu'à{' '}
                  {new Date(dailyQr?.expiresAt || '').toLocaleTimeString('fr-FR')}
                </p>
                <div className="qr-code-wrapper">
                  <QRCode
                    value={dailyQr?.token || ''}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>
                <button className="btn-download" onClick={downloadQr}>
                  ⬇️ Télécharger
                </button>
              </>
            )}
          </div>

          <div className="location-info">
            <h3>📍 Votre Position</h3>
            {currentLocation ? (
              <>
                <div className="coord">
                  <strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}°
                </div>
                <div className="coord">
                  <strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}°
                </div>
                <div className="coord">
                  <strong>Précision:</strong> ±{Math.round(currentLocation.accuracy)}m
                </div>
                <div className="accuracy-status">
                  {currentLocation.accuracy < 50 ? (
                    <span className="badge excellent">✓ Excellente</span>
                  ) : currentLocation.accuracy < 100 ? (
                    <span className="badge acceptable">⚠ Acceptable</span>
                  ) : (
                    <span className="badge poor">✕ Faible</span>
                  )}
                </div>
              </>
            ) : (
              <p className="loading-gps">📡 GPS en cours...</p>
            )}
          </div>
        </div>
      )}

      {/* Scanner */}
      {scanMode === 'qr' && (
        <div className="scanner-container">
          <h3>📱 Pointez le QR Code vers la caméra</h3>
          <video ref={videoRef} autoPlay playsInline className="video-feed"></video>
          <canvas ref={canvasRef} hidden></canvas>
        </div>
      )}

      {/* Checkout */}
      {scanMode === 'qr' && (
        <div className="checkout-section">
          <button
            className="btn-checkout"
            onClick={handleCheckOut}
            disabled={checkOutMutation.isPending}
          >
            {checkOutMutation.isPending ? '⏳ Traitement...' : '👋 Marquer le Départ'}
          </button>
        </div>
      )}

      {/* History */}
      {scanMode === 'history' && (
        <div className="history-section">
          {historyLoading ? (
            <div className="loading">Chargement...</div>
          ) : (
            <div className="table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Arrivée</th>
                    <th>Départ</th>
                    <th>Statut</th>
                    <th>GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory && attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.attendanceDate).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {record.arrivalTime
                            ? new Date(record.arrivalTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                        <td>
                          {record.departureTime
                            ? new Date(record.departureTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                        <td>
                          <span className={`badge ${record.status.toLowerCase()}`}>
                            {record.status === 'PRESENT' && '✓ Présent'}
                            {record.status === 'LATE' && '⏰ Retard'}
                            {record.status === 'ABSENT' && '✕ Absent'}
                            {record.status === 'LEFT' && '👋 Parti'}
                            {record.status === 'LEFT_OUTSIDE_GEOFENCE' && '⚠ Hors zone'}
                          </span>
                        </td>
                        <td>
                          {record.isGeolocationValid ? (
                            <span className="geo-valid">✓ ±{record.accuracyMeters}m</span>
                          ) : (
                            <span className="geo-invalid">✕ Non validée</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty">
                        Aucun enregistrement
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceQRPage;
