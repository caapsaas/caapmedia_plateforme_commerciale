import React from 'react';
import { Link } from '@tanstack/react-router';
import { useI18n } from '../../i18n';

const PublicSiteHeader: React.FC = () => {
  const { t } = useI18n();
  const links = [
    { to: '/', label: t('publicPages.shop') },
    { to: '/realisations', label: t('footer.realisations') },
    { to: '/a-propos', label: t('publicPages.about') },
    { to: '/entreprise', label: t('publicPages.company') },
    { to: '/contact', label: t('footer.contact') },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link to="/" aria-label={t('publicPages.shop')}>
          <img src="/CaaMedia.png" alt="CaapMedia" className="h-12 w-12 rounded-full object-cover" />
        </Link>
        <nav aria-label={t('publicPages.navigation')} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
          {links.map(link => <Link key={link.to} to={link.to} className="transition-colors hover:text-slate-950 [&.active]:text-slate-950 [&.active]:underline [&.active]:decoration-[#c6e911] [&.active]:decoration-4 [&.active]:underline-offset-8">{link.label}</Link>)}
        </nav>
        <Link to="/contact" className="rounded-full bg-[#c6e911] px-4 py-2 text-sm font-bold text-slate-900 hover:bg-[#b5d40e]">{t('publicPages.requestContact')}</Link>
      </div>
    </header>
  );
};

export default PublicSiteHeader;
