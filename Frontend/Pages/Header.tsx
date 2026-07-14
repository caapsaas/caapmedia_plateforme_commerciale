import React, { useState, useRef, useEffect } from "react";
import { useRouter, Link } from "@tanstack/react-router";
import { UserRole } from "../types";
import IconLogout from "../components/icons/IconLogout";
import IconLock from "../components/icons/IconLock";
import { useI18n } from "../i18n";
import IconGlobe from "../components/icons/IconGlobe";
import IconMenu from "../components/icons/IconMenu";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const Header: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { dispatch } = useAppContext();
  const { state } = useAppContext();
  const { user, subsidiary, logout: authLogout } = useAuth();
  const router = useRouter(); // ✅ Router TanStack

  const realUserRole = user?.userRole;
  const previewRole = state.previewRole;
  const activeRole = previewRole ?? realUserRole;
  // Roles reellement assignes a l'utilisateur (pas tous les roles du systeme) -
  // meme logique que Frontend_GMO/components/Header.tsx: user.roles.filter(...).length > 1
  const ownRoles = Array.from(new Set([user?.userRole, ...(user?.additionalRoles ?? [])])).filter(
    (r): r is UserRole => !!r
  );

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // ✅ Fermer les menus en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !subsidiary) return null;

  const getDefaultViewForRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.CAISSIER:
        return "/dashboard/caisse";
      case UserRole.COMMERCIAL:
        return "/dashboard/crm";
      case UserRole.PURCHASING_MANAGER:
        return "/dashboard/purchasing";
      case UserRole.SECRETARY:
        return "/dashboard/secretariat";
      case UserRole.HR_MANAGER:
        return "/dashboard/hr";
      case UserRole.PRODUCTION_DIRECTOR:
        return "/dashboard/production";
      default:
        return "/dashboard/";
    }
  };

  const handleRoleChange = (newRole: UserRole) => {   
    if (newRole === realUserRole) {
      // Si on sélectionne le vrai rôle, on annule la preview
      dispatch({ type: "SET_PREVIEW_ROLE", payload: null });
    } else {
      // Sinon, on met la preview
      dispatch({ type: "SET_PREVIEW_ROLE", payload: newRole });
    }
    // ✅ Navigation sans reload de page
    router.navigate({ to: getDefaultViewForRole(newRole) });
  };

  const onMenuButtonClick = () =>
    dispatch({ type: "SET_SIDEBAR_OPEN", payload: true });

  return (
    <header className="bg-white shadow-sm z-20 no-print">
      <div className="p-4 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center" />

        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={onMenuButtonClick}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none md:hidden"
            aria-label={t("header.openMenu")}
          >
            <IconMenu className="h-6 w-6 text-slate-600" />
          </button>

          {/* Menu langue */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangMenuOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isLangMenuOpen}
            >
              <IconGlobe className="h-6 w-6 text-slate-600" />
            </button>
            {isLangMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1 z-20"
                role="menu"
              >
                {(["fr", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${language === lang ? "font-bold text-[#c6e911]" : "text-slate-700"} hover:bg-slate-100`}
                    role="menuitem"
                  >
                    {lang === "fr" ? "Français" : "English"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu profil */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileMenuOpen((v) => !v)}
              className="flex items-center space-x-2 focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
            >
              <img
                src="https://picsum.photos/id/237/200/200"
                alt="Profil"
                className="h-10 w-10 rounded-full border-2 border-[#c6e911]"
              />
              <div className="text-left hidden md:block">
                <div className="font-semibold text-sm text-slate-700">
                  {user.userName}
                </div>
                <div className="text-xs text-slate-400">
                  {t(`roles.${user.userRole}`)}
                </div>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
                role="menu"
              >
                <Link
                  to="/dashboard/security"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                  role="menuitem"
                >
                  <IconLock className="h-4 w-4" />
                  <span>{t("security.title")}</span>
                </Link>
                <button
                  onClick={() => {
                    authLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                  role="menuitem"
                >
                  <IconLogout className="h-4 w-4" />
                  <span>{t("common.logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de rôles: affichees uniquement quand l'utilisateur a plusieurs
          roles qui lui sont reellement assignes (pas tous les roles du
          systeme) - meme emplacement et meme condition que
          Frontend_GMO/components/Header.tsx. */}
      {ownRoles.length > 1 && (
        <div className="px-4">
          <div className="border-b border-slate-200">
            <nav
              className="-mb-px flex space-x-6 overflow-x-auto"
              aria-label="Tabs"
            >
              {ownRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`${
                    activeRole === role
                      ? "border-[#c6e911] text-[#c6e911]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                  aria-current={activeRole === role ? "page" : undefined}
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
