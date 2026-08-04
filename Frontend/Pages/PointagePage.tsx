import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface PointageResponse {
  success: boolean;
  type: 'arrival' | 'departure';
  message: string;
  employeeName: string;
  status: string;
  duration?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  subsidiaryId: string;
}

interface EmployeesResponse {
  success: boolean;
  employees: Employee[];
}

export const PointagePage: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('t') || '';
  const queryClient = useQueryClient();

  const [matricule, setMatricule] = useState('');
  const [gpsLocation, setGpsLocation] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PointageResponse | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Debug: Log token on mount
  useEffect(() => {
    console.log('PointagePage mounted with token:', token);
  }, [token]);

  // Fetch employees when token is available
  useEffect(() => {
    if (!token) return;

    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const response = await api.get<EmployeesResponse>(`/pointage/employees?token=${token}`);
        setEmployees(response.data.employees);
        console.log('Employees loaded:', response.data.employees);
      } catch (err: any) {
        console.error('Failed to fetch employees:', err);
        setError('Erreur lors du chargement des employés');
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, [token]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation(position.coords);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Allow pointage without GPS
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 30000 } // Increased to 30 seconds
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!token) {
      setError('Token QR manquant');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        token,
        matricule,
      };

      if (gpsLocation) {
        payload.latitude = gpsLocation.latitude;
        payload.longitude = gpsLocation.longitude;
        payload.accuracy = gpsLocation.accuracy;
      }

      console.log('Submitting pointage with payload:', payload);
      const response = await api.post<PointageResponse>('/pointage', payload);
      setSuccess(response.data);
      setMatricule('');

      // Invalidate attendance records cache to refresh history
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    } catch (err: any) {
      console.error('Pointage error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Erreur lors du pointage';
      const errorDetails = err.response?.data;
      // Provide more user-friendly error messages
      if (errorMessage === 'Token invalide') {
        setError('Le QR code a expiré. Veuillez scanner un nouveau QR code.');
      } else if (errorMessage === 'Ce token a expiré') {
        setError('Le QR code a expiré. Veuillez scanner un nouveau QR code.');
      } else if (errorMessage === 'Employé non trouvé ou inactif') {
        setError(`Employé non trouvé ou inactif. Vérifiez que votre matricule est correct et que vous êtes actif dans cette filiale.`);
      } else {
        setError(`${errorMessage}${errorDetails ? ` (${JSON.stringify(errorDetails)})` : ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-center text-slate-600">
            Veuillez scanner le QR code pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-[#c6e911] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pointage</h1>
          <p className="text-slate-600">Entrez vos informations pour pointer</p>
        </div>

        {/* Location Status */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-600" />
            <div className="flex-1">
              {locationLoading ? (
                <p className="text-sm text-slate-600">Localisation en cours...</p>
              ) : gpsLocation ? (
                <p className="text-sm text-green-600 font-medium">
                  Position GPS activée (±{Math.round(gpsLocation.accuracy)}m)
                </p>
              ) : (
                <p className="text-sm text-orange-600 font-medium">
                  Position GPS non disponible
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
            {error.includes('expiré') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 underline hover:text-red-800 text-sm"
              >
                Scanner un nouveau QR code
              </button>
            )}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-800 font-bold">{success.message}</p>
            </div>
            <p className="text-green-700 text-sm">
              {success.employeeName} - {success.status}
            </p>
            {success.duration && (
              <p className="text-green-700 text-sm mt-1">
                Durée: {success.duration}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="matricule" className="block text-sm font-medium text-slate-700 mb-2">
             Entrez votre Matricule Employé
            </label>
            <input
              id="matricule"
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
              placeholder="Entrez votre matricule"
              disabled={loading}
              required
              autoFocus
            />
          </div>

    

          <button
            type="submit"
            disabled={loading || !matricule}
            className="w-full bg-[#c6e911] hover:bg-[#b0cc0f] text-slate-800 font-semibold py-3 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Pointer ma présence
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Système de pointage sécurisé - CaapMedia
        </p>
      </div>
    </div>
  );
};

export default PointagePage;
