import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useI18n } from '../../i18n';
import ECommerceFooter from './ECommerceFooter';
import PublicSiteHeader from './PublicSiteHeader';
import communicationImage from '../../assets/slide1.jpg';

const AboutPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const tPage = (key: string) => t(`publicPages.aboutContent.${key}`);

  return <div className="flex min-h-screen flex-col bg-white">
    <PublicSiteHeader />
    <main className="flex-1">
      <section className="bg-[#231F20] px-4 py-20 text-white md:py-28">
        <div className="container mx-auto max-w-5xl">
          <p className="mb-4 font-semibold uppercase tracking-[0.2em] text-[#c6e911]">CaapMedia · Caap-Groupe SARL</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">{tPage('title')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{tPage('intro')}</p>
          <Link to="/entreprise" className="mt-8 inline-flex rounded-full bg-[#c6e911] px-6 py-3 font-bold text-slate-900">{tPage('cta')}</Link>
        </div>
      </section>
      <section className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div><h2 className="text-2xl font-bold text-slate-900">{tPage('storyTitle')}</h2><p className="mt-4 leading-8 text-slate-600">{tPage('story')}</p><div className="mt-8 rounded-2xl bg-slate-50 p-6"><h3 className="text-xl font-bold text-slate-900">{tPage('expertiseTitle')}</h3><p className="mt-3 leading-7 text-slate-600">{tPage('expertise')}</p><Link to="/realisations" className="mt-5 inline-block font-bold text-slate-900 underline decoration-[#c6e911] decoration-4 underline-offset-4">{tPage('projectsLink')}</Link></div></div>
        <figure className="overflow-hidden rounded-3xl shadow-xl"><img src={communicationImage} alt={tPage('visualAlt')} className="aspect-[4/3] w-full object-cover" /><figcaption className="bg-white px-5 py-3 text-sm text-slate-500">{tPage('visualCaption')}</figcaption></figure>
      </section>
      <section className="bg-slate-50 px-4 py-14 text-center"><h2 className="text-3xl font-bold text-slate-900">{tPage('regionalTitle')}</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{tPage('regional')}</p><Link to="/contact" className="mt-7 inline-block rounded-full bg-[#231F20] px-6 py-3 font-bold text-white">{tPage('contactCta')}</Link></section>
    </main>
    <ECommerceFooter onBackToShop={() => navigate({ to: '/' })} />
  </div>;
};

export default AboutPage;
