import React, { useState, useEffect } from 'react';
import IconGmoLogo from '../components/icons/IconGmoLogo';
import IconAtSymbol from '../components/icons/IconAtSymbol';
import IconLock from '../components/icons/IconLock';
import IconBuilding from '../components/icons/IconBuilding';
import { useI18n } from '../i18n';
import { useAppContext } from '../context/AppContext';
import { loginUser as apiLogin, forgotPassword as apiForgotPassword } from '../services/apiCommon/apiUserAuth';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries'; // Importation depuis le nouveau fichier
import { Subsidiary } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const { t } = useI18n();
  const { login, user: authUser } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/login' }); // Récupère le paramètre 'redirect' de l'URL
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    // Ce `useEffect` réagit au changement de l'état d'authentification.
    // Si l'utilisateur est authentifié, on le redirige selon son rôle.
    if (authUser) {
      // Déterminer la page par défaut selon le rôle
      const getDefaultViewForRole = (role: UserRole): string => {
        switch (role) {
          case UserRole.CAISSIER: return '/dashboard/caisse';
          case UserRole.COMMERCIAL: return '/dashboard/crm';
          case UserRole.PURCHASING_MANAGER: return '/dashboard/purchasing';
          case UserRole.SECRETARY: return '/dashboard/secretariat';
          case UserRole.HR_MANAGER: return '/dashboard/hr';
          case UserRole.PRODUCTION_DIRECTOR: return '/dashboard/production';
          case UserRole.FINANCIAL_DIRECTOR: return '/dashboard/finance';
          default: return '/dashboard';
        }
      };

      const destination = redirect || getDefaultViewForRole(authUser.role);
      navigate({ to: destination, replace: true });
    }
  }, [authUser, navigate, redirect]);


 /* useEffect(() => {
    const fetchSubsidiaries = async () => {
      const subs = await getSubsidiaries();
      setSubsidiaries(subs);
    };
    fetchSubsidiaries();
  }, []);*/

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!email || !password) {
    setError(t('login.errorFillFields'));
    return;
  }

  setIsLoading(true);

  try {
    // 1️⃣ Appel à l’API d’authentification
    const { user, access_token, subsidiary } = await apiLogin({ email, password });

    // 2️⃣ Mise à jour complète du contexte Auth (token + user)
    login({ user, token: access_token, subsidiary });

  } catch (err: any) {
    setError(err.message || t('login.errorIncorrectCredentials'));
  } finally {
    setIsLoading(false);
  }
};


  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetSent(false);
    setResetEmail('');
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError(null);
    setIsResetting(true);
    try {
      await apiForgotPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setForgotPasswordError(err.message || t('forgotPassword.errorMessage'));
    } finally {
      setIsResetting(false);
    }
  };

  const ForgotPasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleForgotPasswordSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">{t('forgotPassword.title')}</h3>
            <div className="mt-4 space-y-4">
              {resetSent ? (
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">
                  <p>{t('forgotPassword.successMessage')}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">{t('forgotPassword.instruction')}</p>
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">{t('login.emailLabel')}</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconAtSymbol className="h-5 w-5 text-gray-400" />
                      </div>
                      <input type="email" id="reset-email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition" />
                    </div>
                  </div>
                  {forgotPasswordError && (
                    <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={() => setShowForgotPassword(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{resetSent ? t('common.close') : t('common.cancel')}</button>
            {!resetSent && (
              <button type="submit" disabled={isResetting} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors flex items-center min-w-[120px] justify-center">
                {isResetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('forgotPassword.sending')}
                  </>
                ) : t('forgotPassword.sendLink')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-[#c6e911] hover:bg-white rounded-lg transition-colors font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Retour à l'e-commerce
        </a>
      </div>
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="w-full md:w-1/2 bg-[#231F20] p-12 flex flex-col justify-center items-center text-white">
          <IconGmoLogo className="w-48 h-auto mb-8" />
          <h1 className="text-3xl font-bold text-center">{t('login.platformTitle')}</h1>
          <p className="mt-4 text-center text-gray-300">{t('login.platformSubtitle')}</p>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('login.title')}</h2>
          <p className="text-slate-600 mb-8">{t('login.subtitle')}</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* <div>
              <label htmlFor="subsidiary" className="block text-sm font-medium text-slate-700">{t('login.subsidiary')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconBuilding className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="subsidiary"
                  name="subsidiary"
                  required
                  value={selectedSubsidiary}
                  onChange={(e) => setSelectedSubsidiary(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
                  disabled={isLoading}
                  aria-label={t('login.subsidiary')}
                >
                  <option value="" disabled>{t('login.selectSubsidiary')}</option>
                  {subsidiaries.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div> */}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('login.emailLabel')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconAtSymbol className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
                  placeholder={t('login.emailPlaceholder')}
                  disabled={isLoading}
                  aria-label={t('login.emailLabel')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('login.passwordLabel')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
                  placeholder="********"
                  disabled={isLoading}
                  aria-label={t('login.passwordLabel')}
                />
              </div>
            </div>

            {error && <p role="alert" className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#c6e911] focus:ring-lime-400 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">{t('login.rememberMe')}</label>
              </div>
              <div className="text-sm">
                <button type="button" onClick={handleForgotPassword} className="font-medium text-[#c6e911] hover:text-[#adc40f]">{t('login.forgotPassword')}</button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-3 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] disabled:bg-lime-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('login.loggingIn')}
                  </>
                ) : t('login.loginButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showForgotPassword && <ForgotPasswordModal />}
    </div>
  );
};

export default LoginPage;
