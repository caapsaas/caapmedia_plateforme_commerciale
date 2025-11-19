import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n';
import { Link } from '@tanstack/react-router';
import IconChevronLeft from '../icons/IconChevronLeft';
import IconChevronRight from '../icons/IconChevronRight';

interface HeroBannerProps {
    realisationsPath: string;
    onQuoteRequest: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ realisationsPath, onQuoteRequest }) => {
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
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: "L'excellence de l'impression, au cœur de l'Afrique",
        subtitle: 'Des technologies de pointe pour un rendu impeccable, à chaque fois.',
        cta: { text: 'Découvrir nos services', to: realisationsPath },
      },
      {
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1945&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: 'Vos idées prennent vie avec des couleurs éclatantes',
        subtitle: 'Notre équipe d’experts vous accompagne de la conception à la réalisation.',
        cta: { text: 'Voir nos réalisations', to: realisationsPath },
      },
      {
        image: 'https://images.unsplash.com/photo-1522120691812-dcdfb625f397?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: "La couleur est notre métier, votre succès notre passion.",
        subtitle: "Donnez une nouvelle dimension à votre communication avec des impressions vibrantes.",
        cta: { text: 'Explorer nos produits', action: handleScrollToProducts },
      },
      {
        image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=1778&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: 'Des supports qui parlent pour vous.',
        subtitle: 'Flyers, affiches, brochures... tout pour faire passer votre message avec impact.',
        cta: { text: 'Demander un devis', action: onQuoteRequest },
      },
      {
        image: 'https://images.unsplash.com/photo-1618337362778-651368972864?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: 'De la carte de visite au grand format, la qualité est notre signature',
        subtitle: 'Des supports de communication qui marquent les esprits et valorisent votre image.',
        cta: { text: 'Demander un devis', action: onQuoteRequest },
      },
      {
        image: 'https://images.unsplash.com/photo-1502691851195-6e43a9c75d69?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: "Une explosion de couleurs pour vos projets",
        subtitle: "Laissez votre créativité s'exprimer, nous nous occupons de la technique.",
        cta: { text: 'Demander un devis', action: onQuoteRequest },
      },
      {
        image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
        title: "Du digital à l'imprimé, une communication 360°",
        subtitle: 'Nous créons des expériences de marque cohérentes sur tous les canaux.',
        cta: { text: 'Découvrir nos services digitaux', to: realisationsPath },
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
        <div className="relative w-full h-[125px] sm:h-[150px] md:h-[175px] lg:h-[200px] overflow-hidden  shadow-xl mb-12">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white p-4 max-w-2xl">
                            <h2 className="text-md md:text-xl lg:text-2xl font-extrabold leading-tight">
                                {slide.title}
                            </h2>
                            <p className="mt-2 text-xs md:text-sm">
                                {slide.subtitle}
                            </p>
                            {'to' in slide.cta ? (
                                <Link to={slide.cta.to} className="mt-2 inline-block px-2 py-2 md:mt-4 md:px-3 md:py-2.5 bg-[#c6e911] text-slate-800 font-bold rounded-full hover:bg-[#adc40f] transition-colors text-xs md:text-sm">
                                    {slide.cta.text}
                                </Link>
                            ) : (
                                <button onClick={slide.cta.action} className="mt-2 px-2 py-2 md:mt-4 md:px-3 md:py-2.5 bg-[#c6e911] text-slate-800 font-bold rounded-full hover:bg-[#adc40f] transition-colors text-xs md:text-sm">
                                    {slide.cta.text}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Navigation Arrows */}
            <button 
                onClick={prevSlide}
                className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition-colors z-10"
                aria-label="Previous slide"
            >
                <IconChevronLeft className="h-6 w-6" />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-white/30 rounded-full hover:bg-white/50 text-white transition-colors z-10"
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
                        className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-[#c6e911] w-6' : 'bg-white/50 hover:bg-white'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroBanner;