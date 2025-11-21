
import React from 'react';
import { useI18n } from '../../i18n';
import IconGmoLogo from '../icons/IconGmoLogo';
import { PRODUCT_HIERARCHY } from '../../constants';
import IconMapPin from '../icons/IconMapPin';
import IconPhone from '../icons/IconPhone';
import IconMail from '../icons/IconMail';
import IconFacebook from '../icons/IconFacebook';
import IconInstagram from '../icons/IconInstagram';
import IconLinkedIn from '../icons/IconLinkedIn';

interface ECommerceFooterProps {
    onNavigateToRealisations?: () => void;
    onSelectMainCategory?: (category: string) => void;
    onBackToShop?: () => void;
    onContactClick?: () => void; // Ajout de la prop pour gérer le clic sur Contact
}


const ECommerceFooter: React.FC<ECommerceFooterProps> = ({ onNavigateToRealisations, onSelectMainCategory, onBackToShop, onContactClick }) => {
    const { t } = useI18n();

    const handleServiceClick = (category: string) => {
        if (onSelectMainCategory) {
            onSelectMainCategory(category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (onBackToShop) {
            // This is a simplified navigation back to the shop.
            // A more advanced version could pass the category to filter.
            onBackToShop();
        } else {
             window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleRealisationsClick = () => {
        if(onNavigateToRealisations) {
            onNavigateToRealisations();
        }
    };

    return (
        <footer id="contact-section" className="bg-[#231F20] text-slate-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Column 1: Logo & Description */}
                    <div className="space-y-4">
                        <IconGmoLogo className="h-16 w-auto" />
                        <p className="text-sm">{t('footer.description')}</p>
                    </div>

                    {/* Column 2: Services */}
                    <div>
                        <h3 className="font-bold text-white uppercase mb-4">{t('footer.services')}</h3>
                        <ul className="space-y-2 text-sm">
                            {PRODUCT_HIERARCHY.filter(c => c.category !== 'Matières Premières').map(cat => (
                                <li key={cat.slug}>
                                    <button onClick={() => handleServiceClick(cat.category)} className="hover:text-[#c6e911] transition-colors text-left">{cat.category}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Column 3: Useful Links */}
                    <div>
                        <h3 className="font-bold text-white uppercase mb-4">{t('footer.usefulLinks')}</h3>
                         <ul className="space-y-2 text-sm">
                            <li><button onClick={handleRealisationsClick} disabled={!onNavigateToRealisations} className="hover:text-[#c6e911] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('footer.about')}</button></li>
                            <li><button onClick={handleRealisationsClick} disabled={!onNavigateToRealisations} className="hover:text-[#c6e911] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('footer.realisations')}</button></li>
                            <li>
                                <button onClick={onContactClick} className="hover:text-[#c6e911] transition-colors text-left">
                                    {t('footer.contact')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <button onClick={onContactClick} className="font-bold text-white uppercase mb-4 hover:text-[#c6e911] transition-colors text-left">
                            {t('footer.contactUs')}
                        </button>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <IconMapPin className="h-5 w-5 mt-0.5 text-[#c6e911] flex-shrink-0" />
                                <a 
                                    href="https://www.google.com/maps/search/?api=1&query=4.046204,9.706662" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-[#c6e911] transition-colors"
                                >
                                    {t('footer.address')}
                                </a>
                            </li>
                             <li className="flex items-center gap-3">
                                <IconPhone className="h-5 w-5 text-[#c6e911] flex-shrink-0" />
                                <a href={`tel:${t('footer.phone')}`} className="hover:text-[#c6e911]">{t('footer.phone')}</a>
                            </li>
                             <li className="flex items-center gap-3">
                                <IconMail className="h-5 w-5 text-[#c6e911] flex-shrink-0" />
                                <a href={`mailto:${t('footer.email')}`} className="hover:text-[#c6e911]">{t('footer.email')}</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-slate-700">
                <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm">
                    <p className="mb-4 sm:mb-0">{t('footer.copyright')}</p>
                    <div className="flex items-center space-x-4">
                        <a href="https://www.facebook.com/caapmedia" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 hover:text-[#c6e911] transition-colors">
                            <IconFacebook className="h-6 w-6" />
                        </a>
                        <a href="https://www.instagram.com/caap.media2024" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-[#c6e911] transition-colors">
                            <IconInstagram className="h-6 w-6" />
                        </a>
                        <a href="https://www.linkedin.com/company/caapmedia" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 hover:text-[#c6e911] transition-colors">
                            <IconLinkedIn className="h-6 w-6" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ECommerceFooter;
