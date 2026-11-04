import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useI18n } from '../../i18n';
import ECommerceFooter from './ECommerceFooter';
import PublicSiteHeader from './PublicSiteHeader';
import PhotoPlaceholder from './PhotoPlaceholder';

const CompanyPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const tPage = (key: string) => t(`publicPages.companyContent.${key}`);

  return <div className="flex min-h-screen flex-col bg-white">
    <PublicSiteHeader />
    <main className="flex-1">
      <section className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">CaapMedia · Douala</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 md:text-5xl">{tPage('title')}</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">{tPage('intro')}</p>
          <Link to="/contact" className="mt-8 inline-flex rounded-full bg-[#c6e911] px-6 py-3 font-bold text-slate-900">{tPage('visitCta')}</Link>
        </div>
        <PhotoPlaceholder label={tPage('premisesPhoto')} className="aspect-[4/3] rounded-3xl" />
      </section>
      <section className="container mx-auto max-w-6xl px-4 pb-14">
        <h2 className="text-2xl font-bold text-slate-900">{tPage('premisesGalleryTitle')}</h2>
        <p className="mt-2 max-w-2xl text-slate-600">{tPage('premisesGalleryIntro')}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {['premisesPhoto', 'workshopPhoto', 'teamPhoto'].map(item => <PhotoPlaceholder key={item} label={tPage(item)} className="aspect-[4/3]" />)}
        </div>
      </section>
      <section className="bg-[#231F20] px-4 py-16 text-white">
        <div className="container mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {['production', 'services', 'reach'].map(item => <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-7"><h2 className="text-xl font-bold text-[#c6e911]">{tPage(`${item}Title`)}</h2><p className="mt-3 leading-7 text-slate-300">{tPage(item)}</p></article>)}
        </div>
      </section>
      <section className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-slate-50 p-8 md:flex-row md:items-center md:p-10">
          <div><p className="font-semibold uppercase tracking-widest text-slate-500">{tPage('visitLabel')}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{t('footer.address')}</h2><p className="mt-2 text-slate-600">{tPage('visitNote')}</p></div>
          <a href="https://www.google.com/maps/search/?api=1&query=Ange+Raphael%2C+Douala%2C+Cameroun" target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-[#c6e911] px-6 py-3 text-center font-bold text-slate-900">{tPage('directions')}</a>
        </div>
      </section>
    </main>
    <ECommerceFooter onBackToShop={() => navigate({ to: '/' })} />
  </div>;
};

export default CompanyPage;
