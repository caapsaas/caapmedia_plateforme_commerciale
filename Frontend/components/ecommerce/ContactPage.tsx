import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useI18n } from '../../i18n';
import ECommerceFooter from './ECommerceFooter';
import ContactModal from './ContactModal';
import PublicSiteHeader from './PublicSiteHeader';

const ContactPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-slate-50">
    <PublicSiteHeader />
    <main className="container mx-auto grid flex-1 max-w-6xl items-start gap-10 px-4 py-10 md:grid-cols-[1.15fr_0.85fr] md:py-16">
      <section><p className="font-semibold uppercase tracking-[0.18em] text-slate-500">CaapMedia · Douala</p><h1 className="mt-3 text-4xl font-black text-slate-900">{t('publicPages.contactContent.title')}</h1><p className="mt-3 max-w-xl leading-7 text-slate-600">{t('publicPages.contactContent.intro')}</p><div className="mt-7"><ContactModal isOpen onClose={() => {}} variant="page" /></div></section>
      <aside className="rounded-3xl bg-[#231F20] p-8 text-white md:sticky md:top-28"><h2 className="text-2xl font-bold">{t('publicPages.contactContent.visitTitle')}</h2><p className="mt-4 flex gap-3 leading-7 text-slate-300"><span aria-hidden="true">📍</span><span>{t('footer.address')}</span></p><p className="mt-2 text-sm text-slate-400">{t('publicPages.contactContent.visitNote')}</p><a href="https://www.google.com/maps/search/?api=1&query=Ange+Raphael%2C+Douala%2C+Cameroun" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-full bg-[#c6e911] px-5 py-3 font-bold text-slate-900">{t('publicPages.contactContent.directions')}</a><div className="mt-8 border-t border-white/15 pt-6"><p className="text-sm font-semibold uppercase tracking-widest text-slate-400">{t('publicPages.contactContent.alsoReachUs')}</p><a className="mt-3 block hover:text-[#c6e911]" href={`tel:${t('footer.phone')}`}>{t('footer.phone')}</a><a className="mt-2 block hover:text-[#c6e911]" href={`mailto:${t('footer.email')}`}>{t('footer.email')}</a></div></aside>
    </main>
    <ECommerceFooter onBackToShop={() => navigate({ to: '/' })} />
  </div>;
};

export default ContactPage;
