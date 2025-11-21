
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n';
import IconChevronLeft from '../icons/IconChevronLeft';
import IconChevronRight from '../icons/IconChevronRight';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface HeroBannerProps {
    onNavigateToRealisations: () => void;
    onQuoteRequest: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigateToRealisations, onQuoteRequest }) => {
    const { t } = useI18n();
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleScrollToProducts = () => {
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const slides = [
      {
        // Creative/Design - Vibrant colors, artistic, evokes creation
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop', 
        title: "Donnez Vie à Vos Idées",
        subtitle: 'Du concept créatif à la réalisation impeccable, notre équipe de designers vous accompagne.',
        cta: 'Découvrir nos services de design',
        action: onNavigateToRealisations,
      },
      {
        // Printing Press - High tech, quality, professional
        image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?q=80&w=2574&auto=format&fit=crop',
        title: "La Qualité d'Impression qui Fait la Différence",
        subtitle: 'Brochures, dépliants, et catalogues avec des couleurs riches et une finition parfaite.',
        cta: 'Voir nos produits imprimés',
        action: handleScrollToProducts,
      },
      {
        // Large Format - Urban, impactful, visibility
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=2629&auto=format&fit=crop',
        title: "Voyez les Choses en Grand",
        subtitle: 'Bâches, panneaux, et habillages de véhicules pour une visibilité maximale.',
        cta: 'Explorer le grand format',
        action: handleScrollToProducts,
      },
      {
        // Textile/Fashion - African context, stylish, vivid yellow
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2574&auto=format&fit=crop',
        title: "Votre Marque, Partout",
        subtitle: 'Textiles et objets publicitaires personnalisés pour marquer les esprits.',
        cta: 'Personnaliser mes objets',
        action: handleScrollToProducts,
      },
      {
        // Strategy/Team - Diverse group, collaboration, professional environment
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop',
        title: "Une Stratégie de Communication Intégrée",
        subtitle: 'Du marketing digital à la campagne print, nous orchestrons votre succès.',
        cta: 'Demander un devis',
        action: onQuoteRequest,
      },
      {
        // Packaging - Colorful, boxes, product presentation
        image: 'https://images.unsplash.com/photo-1632925369197-303b2c630591?q=80&w=2670&auto=format&fit=crop',
        title: "Un Packaging Qui Fait Vendre",
        subtitle: 'Des emballages sur mesure qui subliment vos produits et captivent vos clients.',
        cta: 'Créer mon packaging',
        action: handleScrollToProducts,
      },
      {
        // Branding/Workspace - Clean, colorful stationery
        image: 'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?q=80&w=2670&auto=format&fit=crop',
        title: "Matériel de Bureau & Goodies",
        subtitle: "Equipez vos bureaux et remerciez vos clients avec nos objets personnalisés.",
        cta: 'Voir le catalogue',
        action: handleScrollToProducts,
      },
    ];

    const nextSlide = useCallback(() => {
        setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    };
    
    useEffect(() => {
        const timer = setInterval(nextSlide, 5000); // Change slide every 5 seconds
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="relative w-full h-48 md:h-[250px] lg:h-[300px] overflow-hidden">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
<<<<<<< HEAD
                    <LazyLoadImage
                        src={slide.image}
                        alt={slide.title}
                        effect="blur"
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white p-4 max-w-2xl">
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
=======
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white p-4 max-w-4xl">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight drop-shadow-md">
>>>>>>> 4cb056116140c7563ff8aa2873a0f5069b890097
                                {slide.title}
                            </h2>
                            <p className="mt-2 text-sm md:text-base drop-shadow-md font-medium">
                                {slide.subtitle}
                            </p>
                            <button onClick={slide.action} className="mt-6 px-5 py-2 md:px-6 md:py-2.5 bg-[#c6e911] text-slate-800 font-bold rounded-full hover:bg-[#adc40f] transition-colors text-xs md:text-sm shadow-lg border-2 border-[#c6e911] hover:border-[#adc40f]">
                                {slide.cta}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Navigation Arrows */}
            <button 
                onClick={prevSlide}
                className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition-colors z-10 backdrop-blur-sm"
                aria-label="Previous slide"
            >
                <IconChevronLeft className="h-6 w-6" />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition-colors z-10 backdrop-blur-sm"
                aria-label="Next slide"
            >
                <IconChevronRight className="h-6 w-6" />
            </button>
            
            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all shadow-sm ${index === currentSlide ? 'bg-[#c6e911] w-6 scale-110' : 'bg-white/50 hover:bg-white'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroBanner;
