import React from 'react';
import { useI18n } from '../../i18n';
import IconArrowLeft from '../icons/IconArrowLeft';
import ECommerceFooter from './ECommerceFooter';
import { useNavigate } from '@tanstack/react-router';

const services = [
    {
        title: 'Conseil en Marketing',
        description: "Nos consultants marketing analysent les possibilités de commercialisation d'un produit, conseillent nos clients dans la stratégie Marketing à adopter partant du design du logo, des produits et services jusqu'aux eléments impactant l'identité corporelle de l'entreprise.",
        icon: '💡'
    },
    {
        title: 'Design & Graphisme',
        description: "Nos experts en design et graphisme expriment l'art dont la compétence consiste à combiner du texte et des images dans des magazines, des publicités ou des livres pour présenter le savoir-faire de nos clients au grand public.",
        icon: '🎨'
    },
    {
        title: 'Impression Numérique',
        description: "Directement à partir des données numériques, nous imprimons vos besoins sur les machines de dernières générations.",
        icon: '🖨️'
    },
    {
        title: 'Impressions Offset',
        description: 'Nous utilisons les machines reputées Allemandes „Heidelberg MO“ et „- GTO“ pour la production d\'images et textes de grande quantité',
        icon: '📠'
    },
    {
        title: 'Sérigraphie',
        description: "Pour imprégner vos T-Shirts et vêtements nous utilisons nos appareils sérigraphiques. Cette technique par pochoir d'impression permet également de représenter des graphismes indépendants et très détaillés.",
        icon: '👕'
    },
    {
        title: 'Grands Formats',
        description: "Impression de qualité sur de grandes surfaces.",
        icon: '🖼️'
    },
    {
        title: 'Broderie',
        description: "La broderie est exclusivement utilisée pour marquer le textile et la bagagerie durable et qualitative.",
        icon: '🧵'
    },
    {
        title: 'Livraison',
        description: "Nous fournissons volontiers nos prestations conformément au contrat définit chez nos clients!",
        icon: '🚚'
    }
];

const clients = [
    'Groupe SABC',
    'Hôpital Laquintinie de Douala',
    'Yoomee Mobile',
    'MIGEC',
    'DP',
    'SA'
];

const RealisationsPage: React.FC = () => {
    const { t } = useI18n();
    const navigate = useNavigate();

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate({ to: '/' })} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <IconArrowLeft className="h-6 w-6 text-slate-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Nos Réalisations & Prestations</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 flex-grow">
                {/* A Propos Section */}
                <section className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-slate-800">À Propos de Nous</h2>
                    <div className="mt-4 max-w-3xl mx-auto">
                        <p className="text-slate-600 text-lg">
                            Département de Caap-Groupe Sarl, CaapMedia est spécialisé dans la communication et l'impression tous supports au coeur de la ville de Douala - Akwa.
                        </p>
                    </div>
                </section>
                
                {/* Prestations Section */}
                <section className="mb-16">
                    <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-10">Nos Prestations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {services.map(service => (
                            <div key={service.title} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center">
                                <div className="text-4xl mb-4">{service.icon}</div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{service.title}</h3>
                                <p className="text-slate-600 text-sm">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Clients Section */}
                <section>
                    <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-10">Ils nous font confiance</h2>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                        {clients.map(client => (
                            <div key={client} className="text-slate-500 font-semibold text-lg grayscale hover:grayscale-0 transition-all">
                                {client}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <ECommerceFooter onBackToShop={() => navigate({ to: '/' })} />
        </div>
    );
};

export default RealisationsPage;