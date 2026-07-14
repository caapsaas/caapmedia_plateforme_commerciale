import React, { useState } from 'react';
import IconGmoLogo from '../icons/IconGmoLogo';
import IconShoppingCart from '../icons/IconShoppingCart';
import IconUserCircle from '../icons/IconUserCircle';
import IconSearch from '../icons/IconSearch';
import { useI18n } from '../../i18n';
import { Contact } from '../../types';
import IconHeart from '../icons/IconHeart';
import IconMenu from '../icons/IconMenu';
import { categoryToKeyMap } from '../../constants';
import { Link } from '@tanstack/react-router';

interface ECommerceHeaderProps {
    dashboardPath: string;
    currentCustomer: Contact | null;
    onLogin: () => void;
    onLogout: () => void;
    accountPath: string;
    cartItemCount: number;
    onCartClick: () => void;
    likedItemCount?: number;
    onWishlistClick?: () => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    onQuoteRequest: () => void;
    onSelectAllCategories: () => void;
    productHierarchy: { category: string; slug: string; subcategories: { name: string; slug: string }[] }[];
    onSelectMainCategory: (category: string) => void;
    onSelectSubcategory: (mainCategory: string, subcategory: string) => void;
}

const ECommerceHeader: React.FC<ECommerceHeaderProps> = (props) => {
    const { t } = useI18n();
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

    const handleCategoryClick = (mainCategory: string, subCategory?: string) => {
        if (subCategory) {
            props.onSelectSubcategory(mainCategory, subCategory);
        } else {
            props.onSelectMainCategory(mainCategory);
        }
        setIsCategoryMenuOpen(false);
    };

    const CategoryMenu = () => {
        const [isClosing, setIsClosing] = useState(false);

        const closeMenu = () => {
            setIsClosing(true);
            setTimeout(() => {
                setIsCategoryMenuOpen(false);
                setIsClosing(false);
            }, 300);
        };
        
        return (
            <div className="fixed inset-0 z-40">
                <div 
                    className={`fixed inset-0 bg-black bg-opacity-60 ${isClosing ? 'category-menu-overlay closing' : 'category-menu-overlay'}`}
                    onClick={closeMenu}
                ></div>
                
                <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-50 overflow-y-auto ${isClosing ? 'category-menu closing' : 'category-menu'}`}>
                    <div className="p-4 bg-[#231F20] text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold">Toutes nos catégories</h2>
                        <button onClick={closeMenu} className="p-1 rounded-full hover:bg-white/20">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <ul className="p-2">
                        {props.productHierarchy.map(mainCat => (
                            <li key={mainCat.slug}>
                                <button onClick={() => handleCategoryClick(mainCat.category)} className="w-full text-left font-bold p-2 hover:bg-slate-100 rounded">{mainCat.category}</button>
                                <ul className="pl-4 border-l-2 border-slate-200 ml-2">
                                    {mainCat.subcategories.map(subCat => (
                                        <li key={subCat.slug}>
                                            <button onClick={() => handleCategoryClick(mainCat.category, subCat.name)} className="w-full text-left text-sm p-2 hover:bg-slate-100 rounded">{t(categoryToKeyMap[subCat.name] || subCat.name)}</button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30">
            {/* Top Bar */}
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <button onClick={props.onSelectAllCategories} className="p-2 rounded-full hover:bg-slate-100" aria-label={t('ecommerce.backToHome')}>
                    <IconGmoLogo className="h-10 w-auto" />
                </button>
                <div className="flex-1 px-8 hidden md:block">
                    <div className="relative">
                        <IconSearch className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"/>
                        <input
                            type="search"
                            placeholder={t('ecommerce.searchPlaceholder')}
                            value={props.searchTerm}
                            onChange={e => props.onSearchTermChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button
                        onClick={props.onQuoteRequest}
                        className="py-2 px-4 rounded-full bg-[#E61D2B] text-white animate-blink shadow-lg hover:bg-red-700 transition-colors font-bold text-xs md:text-sm"
                    >
                        Demander un devis
                    </button>
                    <div className="relative">
                        {props.currentCustomer ? (
                            <>
                                <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="p-2.5 rounded-full hover:bg-slate-100 transition-colors" aria-haspopup="true" aria-expanded={isAccountMenuOpen}>
                                    <IconUserCircle className="h-9 w-9 text-slate-700" />
                                </button>
                                {isAccountMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20" role="menu">
                                        <Link to={props.accountPath} onClick={() => setIsAccountMenuOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                                            {t('ecommerce.myAccount')}
                                        </Link>
                                        <button onClick={() => { props.onLogout(); setIsAccountMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">{t('common.logout')}</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsGuestMenuOpen(!isGuestMenuOpen)} className="p-2.5 rounded-full hover:bg-slate-100 transition-colors" aria-haspopup="true" aria-expanded={isGuestMenuOpen}>
                                    <IconUserCircle className="h-9 w-9 text-slate-700" />
                                </button>
                                {isGuestMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20" role="menu">
                                        <button onClick={() => { props.onLogin(); setIsGuestMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">{t('ecommerce.customerLogin')}</button>
                                        <Link to={props.dashboardPath} onClick={() => setIsGuestMenuOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                                            {t('ecommerce.employeeLogin')}
                                        </Link>
                                        <div className="border-t my-1"></div>
                                        <button onClick={() => { props.onLogin(); setIsGuestMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">{t('ecommerce.createAccount')}</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {/* Favoris masqués temporairement */}
                    <button 
                        onClick={props.onCartClick}
                        className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label={`Shopping cart with ${props.cartItemCount} items`}
                    >
                        <IconShoppingCart className="h-9 w-9 text-slate-700" />
                        {props.cartItemCount > 0 && (
                            <span className="absolute top-0 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#E61D2B] text-white text-base font-bold">
                                {props.cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            
             {/* Secondary Nav Bar */}
            <div className="bg-[#c6e911] text-slate-800">
                <div className="container mx-auto px-4 flex items-center h-12">
                    <button onClick={() => setIsCategoryMenuOpen(true)} className="flex items-center gap-2 p-2 font-bold hover:bg-black/10 rounded-md">
                        <IconMenu className="h-6 w-6" stroke="#231F20" />
                        <span>Toutes nos catégories</span>
                    </button>
                    <nav className="hidden lg:flex items-center space-x-6 ml-6">
                        {props.productHierarchy.map(cat => (
                            <button key={cat.slug} onClick={() => handleCategoryClick(cat.category)} className="text-sm font-semibold hover:underline">
                                {cat.category}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="md:hidden container mx-auto px-4 pb-3 border-t md:border-t-0">
                <div className="relative">
                    <IconSearch className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"/>
                    <input
                        type="search"
                        placeholder={t('ecommerce.searchPlaceholder')}
                        value={props.searchTerm}
                        onChange={e => props.onSearchTermChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    />
                </div>
            </div>
             {isCategoryMenuOpen && <CategoryMenu />}
        </header>
    );
};

export default ECommerceHeader;