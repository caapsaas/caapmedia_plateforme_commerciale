import React, { useState, useRef, useEffect } from "react";
import { useRouter, Link } from "@tanstack/react-router";
import { Building2, Search } from "lucide-react";
import { UserRole } from "../types";
import IconLogout from "../components/icons/IconLogout";
import IconLock from "../components/icons/IconLock";
import { useI18n } from "../i18n";
import IconGlobe from "../components/icons/IconGlobe";
import IconMenu from "../components/icons/IconMenu";
import NotificationDropdown from "../components/common/NotificationDropdown";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getDefaultViewForRole } from "../utils/roleViews";

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const { t, language, setLanguage } = useI18n();
  const { dispatch } = useAppContext();
  const { user, subsidiary, logout: authLogout, switchRole, switchSubsidiary } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // ✅ Router TanStack

  // activeRole est desormais une valeur enforcee cote backend
  // (POST /auth/switch-role, voir AuthContext.switchRole) - pas un simple
  // apercu d'affichage local (l'ancien previewRole d'AppContext).
  const activeRole = user?.activeRole ?? user?.userRole;
  // Roles reellement assignes a l'utilisateur (pas tous les roles du systeme) -
  // meme logique que Frontend_GMO/components/Header.tsx: user.roles.filter(...).length > 1
  const ownRoles = Array.from(new Set([user?.userRole, ...(user?.additionalRoles ?? [])])).filter(
    (r): r is UserRole => !!r
  );

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isSwitchingSubsidiary, setIsSwitchingSubsidiary] = useState(false);

  const allowedSubsidiaries = user?.allowedSubsidiaries ?? (subsidiary
    ? [{ id: subsidiary.id, subsidiaryName: subsidiary.subsidiaryName || subsidiary.name, isHeadquarter: subsidiary.isHeadquarter }]
    : []);

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

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === activeRole || isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await switchRole(newRole);
      // ✅ Navigation sans reload de page
      router.navigate({ to: getDefaultViewForRole(newRole) });
    } catch (err) {
      console.error('Echec du changement de role', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleSubsidiaryChange = async (nextSubsidiaryId: string) => {
    if (!nextSubsidiaryId || nextSubsidiaryId === subsidiary.id || isSwitchingSubsidiary) return;
    setIsSwitchingSubsidiary(true);
    try {
      await switchSubsidiary(nextSubsidiaryId);
      router.invalidate();
    } catch {
      toast('error', t('headerV3.switchSubsidiaryError'));
    } finally {
      setIsSwitchingSubsidiary(false);
    }
  };

  const onMenuButtonClick = () =>
    dispatch({ type: "SET_SIDEBAR_OPEN", payload: true });

  return (
    <header className="bg-white border-b border-[var(--border)] z-20 no-print">
      <div className="px-4 py-2.5 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {allowedSubsidiaries.length > 1 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--muted)]">
              <Building2 className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
              <select
                aria-label={t('headerV3.activeSubsidiary')}
                value={subsidiary.id}
                onChange={(e) => handleSubsidiaryChange(e.target.value)}
                disabled={isSwitchingSubsidiary}
                className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {allowedSubsidiaries.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subsidiaryName}{sub.isHeadquarter ? ' (Siège)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)]">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{subsidiary.subsidiaryName || subsidiary.name}</span>
            </div>
          )}

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center justify-between gap-4 px-3 py-1.5 w-56 md:w-64 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--muted)]/60 hover:bg-[var(--muted)] text-xs text-[var(--muted-foreground)] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>{t('headerV3.searchTrigger')}</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-[var(--border)] rounded text-slate-600">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={onMenuButtonClick}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none md:hidden"
            aria-label={t("header.openMenu")}
          >
            <IconMenu className="h-6 w-6 text-slate-600" />
          </button>

          <NotificationDropdown />

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
                    className={`w-full text-left px-4 py-2 text-sm ${language === lang ? "font-bold text-[var(--brand-text)]" : "text-slate-700"} hover:bg-slate-100`}
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
                  {t(`roles.${activeRole}`)}
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
                    // authLogout() ne fait que vider l'etat auth - TanStack
                    // Router ne re-evalue pas automatiquement le beforeLoad
                    // d'une route deja resolue juste parce que le contexte
                    // change de facon reactive, il faut naviguer
                    // explicitement (meme raison que le bug de refresh /
                    // login corrige plus tot dans router.tsx).
                    router.navigate({ to: '/login', replace: true });
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
                  disabled={isSwitchingRole}
                  className={`${
                    activeRole === role
                      ? "border-[var(--brand)] text-[var(--brand-text)] font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
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
