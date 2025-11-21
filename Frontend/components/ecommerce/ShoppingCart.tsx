import React, { useMemo } from 'react';
import { Product, ProductOptions } from '../../types';
import { useI18n } from '../../i18n';
import IconDelete from '../icons/IconDelete';
import IconMinus from '../icons/IconMinus';
import IconPlus from '../icons/IconPlus';
import { getImageUrl } from '../../utils/imageUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export type CartItem = {
    id: string;
    product: Product;
    quantity: number;
    options: Partial<ProductOptions>;
    unitPrice: number;
    totalPrice: number;
    designFile?: { name: string; url: string };
    designFileObject?: File;
};


interface ShoppingCartProps {
    cartItems: CartItem[];
    onClose: () => void;
    onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
    onCheckout: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ cartItems, onClose, onUpdateQuantity, onCheckout }) => {
    const { t, formatCurrency } = useI18n();

    const total = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        [cartItems]
    );

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const formatOptions = (options: Partial<ProductOptions>) => {
        return Object.values(options).filter(Boolean).join(', ');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
            <div 
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">{t('ecommerce.shoppingCart')} ({itemCount} {itemCount > 1 ? t('ecommerce.items') : t('ecommerce.item')})</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" /></svg>
                    </button>
                </div>

                {cartItems.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-slate-500">{t('ecommerce.emptyCart')}</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4">
                        <ul className="space-y-4">
                            {cartItems.map(item => (
                                <li key={item.id} className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden">
                                        <LazyLoadImage
                                            src={item.product.productImages && item.product.productImages.length > 0 ? getImageUrl(item.product.productImages[0].imageUrl) : 'https://via.placeholder.com/100'} 
                                            alt={item.product.productName} 
                                            effect="blur"
                                            wrapperClassName="w-full h-full"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800">{item.product.productName}</p>
                                        <p className="text-xs text-slate-500">{formatOptions(item.options)}</p>
                                        {item.designFile && (
                                            <p className="text-xs text-green-600 font-medium mt-1 truncate">
                                                Fichier: {item.designFile.name}
                                            </p>
                                        )}
                                        <div className="flex items-center mt-2">
                                            <button
                                                type="button"
                                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 border border-slate-300 rounded-l-md hover:bg-slate-100 disabled:opacity-50"
                                                aria-label="Diminuer la quantité"
                                            >
                                                <IconMinus className="h-4 w-4 text-slate-600" />
                                            </button>
                                            <input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={e => {
                                                    const value = parseInt(e.target.value, 10);
                                                    onUpdateQuantity(item.id, isNaN(value) ? 1 : value)
                                                }}
                                                className="w-12 p-1 text-center border-t border-b border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                                                min="1"
                                            />
                                             <button
                                                type="button"
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 border border-slate-300 rounded-r-md hover:bg-slate-100 disabled:opacity-50"
                                                aria-label="Augmenter la quantité"
                                            >
                                                <IconPlus className="h-4 w-4 text-slate-600" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                                        <p className="text-xs text-slate-500">({formatCurrency(item.unitPrice)}/u)</p>
                                        <button onClick={() => onUpdateQuantity(item.id, 0)} className="text-red-500 hover:text-red-700 mt-2 p-1 rounded-full hover:bg-red-100">
                                            <IconDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div className="p-4 border-t bg-slate-50">
                    <div className="flex justify-between font-bold text-lg mb-4">
                        <span>{t('ecommerce.total')}</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <button 
                        onClick={onCheckout}
                        disabled={cartItems.length === 0}
                        className="w-full py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-400 transition-all"
                    >
                        {t('ecommerce.checkout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShoppingCart;