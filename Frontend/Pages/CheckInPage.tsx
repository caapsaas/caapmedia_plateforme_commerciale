import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type CheckInStatus = 'loading' | 'success' | 'error';

export const CheckInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CheckInStatus>('loading');
  const [message, setMessage] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    const performCheckIn = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          setStatus('error');
          setMessage('Token invalide');
          return;
        }

        // 1️⃣ Demander la géolocalisation
        const position = await new Promise<GeolocationCoordinates>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }
        );

        // 2️⃣ Envoyer le check-in au backend
        const response = await fetch('/api-caapmedia/hr/attendance-checkin/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrToken: token,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy
          })
        });

        if (!response.ok) {
          const error = await response.json();
          setStatus('error');
          setMessage(error.message || 'Erreur lors du check-in');
          return;
        }

        const data = await response.json();
        setStatus('success');
        setEmployeeName(data.employeeName || 'Employé');
        setMessage(`✓ Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`);

        // Auto-fermer après 3 secondes
        setTimeout(() => window.close(), 3000);
      } catch (error: any) {
        setStatus('error');
        if (error.code === 1) {
          setMessage('Veuillez autoriser la géolocalisation');
        } else if (error.message === 'User denied geolocation') {
          setMessage('Veuillez autoriser la géolocalisation');
        } else {
          setMessage(error.message || 'Erreur inconnue');
        }
      }
    };

    performCheckIn();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Check-in en cours...</h1>
            <p className="text-slate-600">Veuillez autoriser la géolocalisation</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Bienvenue {employeeName}!</h1>
            <p className="text-slate-600 mb-4">{message}</p>
            <p className="text-xs text-slate-500">Fenêtre qui se ferme automatiquement...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Erreur</h1>
            <p className="text-slate-600 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
