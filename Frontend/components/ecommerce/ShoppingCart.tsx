import React, { useMemo } from 'react';
import { Product, ProductOptions } from '../../types';
import { SpecValues } from '../common/FormRenderer';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconDelete from '../icons/IconDelete';
import IconMinus from '../icons/IconMinus';
import IconPlus from '../icons/IconPlus';
import { getImageUrl } from '../../utils/imageUtils';

export type CartItem = {
    id: string;
    product: Product;
    quantity: number;
    options: Partial<ProductOptions>;
    unitPrice: number;
    totalPrice: number;
    designFile?: { name: string; url: string };
    designFileObject?: File;
    specValues?: SpecValues; // Spécifications techniques saisies (Chantier 5)
};


interface ShoppingCartProps {
    cartItems: CartItem[];
    onClose: () => void;
    onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
}

// Pas de commande en ligne (voir architecture du catalogue) — la validation
// du panier se fait toujours via WhatsApp, jamais par un checkout backend.
const ShoppingCart: React.FC<ShoppingCartProps> = ({ cartItems, onClose, onUpdateQuantity }) => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();

    const total = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        [cartItems]
    );

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const formatOptions = (options: Partial<ProductOptions>) => {
        return Object.values(options).filter(Boolean).join(', ');
    };

    const handleWhatsAppOrder = () => {
        const phoneNumber = "237671890184"; // Numéro WhatsApp à configurer
        const message = cartItems.map(item => 
            `${item.quantity}x ${item.product.name} - ${formatCurrency(item.totalPrice)}`
        ).join('\n');
        
        const fullMessage = `Bonjour, je souhaite commander les produits  suivants:\n\n${message}\n\nTotal: ${formatCurrency(total)}`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullMessage)}`;
        
        window.open(whatsappUrl, '_blank');
        toast.success('Commande envoyée!', 'Votre commande a été envoyée via WhatsApp avec succès.');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999]" onClick={onClose}>
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
                                        <img
                                            src={item.product.productImages && item.product.productImages.length > 0 ? getImageUrl(item.product.productImages[0].imageUrl) : 'https://via.placeholder.com/100'}
                                            alt={item.product.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800">{item.product.name}</p>
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
                                    <div className="flex flex-col items-end">
                                       
                                        <p className="text-xs text-slate-500">({formatCurrency(item.unitPrice)}/u)</p>
                                        <button 
                                            onClick={() => {
                                                const phoneNumber = "237671890184";
                                                const message = `Bonjour, je souhaite commander: ${item.quantity}x ${item.product.name} - ${formatCurrency(item.totalPrice)}`;
                                                
                                                // Nettoyer le numéro (enlever les espaces et caractères spéciaux)
                                                const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
                                                
                                                // Créer l'URL WhatsApp avec le bon format
                                                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                                                
                                                console.log('WhatsApp URL:', whatsappUrl); // Debug pour vérifier l'URL
                                                
                                                window.open(whatsappUrl, '_blank');
                                                toast.success('Commande envoyée!', 'Votre commande a été envoyée via WhatsApp avec succès.');
                                            }}
                                            className="mt-2 px-2 py-1 bg-[#25D366] text-white text-sm font-bold rounded hover:bg-[#128C7E] transition-all flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 9.885-5.335 9.89-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                            </svg>
                                            Commander
                                        </button>
                                        <button onClick={() => onUpdateQuantity(item.id, 0)} className="text-red-500 hover:text-red-700 mt-2 p-1 rounded-full hover:bg-red-100">
                                            <IconDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {cartItems.length > 0 && (
                    <div className="p-4 border-t bg-slate-50 flex-shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-slate-700">{t('invoice.subtotal')}</span>
                            <span className="text-xl font-bold text-slate-800">{formatCurrency(total)}</span>
                        </div>
                        <button
                            onClick={handleWhatsAppOrder}
                            className="w-full px-4 py-3 bg-[#25D366] text-white font-bold rounded-lg hover:bg-[#128C7E] transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 9.885-5.335 9.89-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            {t('ecommerce.orderViaWhatsApp')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShoppingCart;