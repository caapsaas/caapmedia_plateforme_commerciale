import React, { useState } from 'react';
import { UserRole, View } from '../types';
import IconLogout from '../components/icons/IconLogout';
import { useI18n } from '../i18n';
import IconGlobe from '../components/icons/IconGlobe';
import IconMenu from '../components/icons/IconMenu';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { dispatch } = useAppContext();
  const { user, subsidiary, logout: authLogout, updateUserRole } = useAuth();
  const roles = Object.values(UserRole);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false); // Track if role has been selected

  if (!user || !subsidiary) return null;
  
  const getDefaultViewForRole = (role: UserRole): string => {
    switch (role) {
        case UserRole.CAISSIER: return '/dashboard/caisse';
        case UserRole.COMMERCIAL: return '/dashboard/crm';
        case UserRole.PURCHASING_MANAGER: return '/dashboard/purchasing';
        case UserRole.SECRETARY: return '/dashboard/secretariat';
        case UserRole.HR_MANAGER: return '/dashboard/hr';
        case UserRole.PRODUCTION_DIRECTOR: return '/dashboard/production';
        default: return '/dashboard';
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    // Vérifier si le rôle est déjà actif pour éviter une navigation inutile
    if (user.userRole === newRole) {
      setRoleSelected(true); // Still hide tabs even if same role
      return;
    }

    // 1. Masquer immédiatement les tabs pour un feedback visuel instantané
    setRoleSelected(true);

    // 2. Mettre à jour l'état dans AuthContext
    updateUserRole(newRole);

    // 3. Naviguer avec un léger délai pour permettre la mise à jour de l'UI
    const destination = getDefaultViewForRole(newRole);
    setTimeout(() => {
      window.location.href = destination;
    }, 100);
  };

  const onMenuButtonClick = () => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true });

  return (
    <header className="bg-white shadow-sm z-20 no-print">
      <div className="p-4 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center">
        
          
          <div className="relative w-full max-w-xs lg:max-w-md hidden sm:block">
            {/*<input
              type="search"
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
            />*/}
            {/*<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>*/}
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Bouton menu burger pour mobile */}
          <button 
            onClick={onMenuButtonClick}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none md:hidden"
            aria-label={t('header.openMenu')}
          >
            <IconMenu className="h-6 w-6 text-slate-600" />
          </button>
          
          {/*<button className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <svg className="h-6 w-6 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>*/}
          
          <div className="relative">
             <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none" aria-haspopup="true" aria-expanded={isLangMenuOpen}>
              <IconGlobe className="h-6 w-6 text-slate-600"/>
            </button>
             {isLangMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1 z-20"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  onClick={() => { setLanguage('fr'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${language === 'fr' ? 'font-bold text-[#c6e911]' : 'text-slate-700'} hover:bg-slate-100`}
                  role="menuitem"
                >
                  <span>Français</span>
                </button>
                 <button
                  onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${language === 'en' ? 'font-bold text-[#c6e911]' : 'text-slate-700'} hover:bg-slate-100`}
                  role="menuitem"
                >
                  <span>English</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 focus:outline-none" aria-haspopup="true" aria-expanded={isProfileMenuOpen}>
              <img
                src="https://picsum.photos/id/237/200/200"
                alt="Profil"
                className="h-10 w-10 rounded-full border-2 border-[#c6e911]"
              />
              <div className="text-left hidden md:block">
                <div className="font-semibold text-sm text-slate-700">{user?.userName}</div>
                <div className="text-xs text-slate-400">{t(`roles.${user?.userRole}`)}</div>
              </div>
            </button>
            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                {user.userRole === UserRole.ADMIN && roleSelected && (
                  <button
                    onClick={() => setRoleSelected(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                    role="menuitem"
                  >
                    <span>{t('header.changeRole')}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    authLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                  role="menuitem"
                >
                  <IconLogout className="h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
       {user.userRole === UserRole.ADMIN && !roleSelected && (
       <div className="px-4">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`${
                  user.userRole === role
                    ? 'border-[#c6e911] text-[#c6e911]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                aria-current={user.userRole === role ? 'page' : undefined}
              >
                {t(`roles.${role}`)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      )}
    </header>
  );
};

export default Header;
