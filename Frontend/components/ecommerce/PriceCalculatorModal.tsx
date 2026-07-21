import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types';
import { useI18n } from '../../i18n';
import { CartItem } from './ShoppingCart';
import IconUpload from '../icons/IconUpload';
import IconFile from '../icons/IconFile';
import IconDelete from '../icons/IconDelete';
import { getImageUrl } from '../../utils/imageUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { getFormDefinition } from '../../services/apiE-commerce/apiProductSpecs';
import SpecValuesModal from '../common/SpecValuesModal';
import { SpecValues } from '../common/FormRenderer';
import { FormDefinition } from '../../types/models';

interface PriceCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (item: CartItem) => void;
    // Caisse (POS) saisit un prix négocié obligatoire ; le site vitrine ne fait
    // que collecter les spécifications choisies pour une demande de devis WhatsApp,
    // le prix restant à négocier plus tard — pas de saisie de prix dans ce cas.
    requirePrice?: boolean;
}

// Sélection des spécifications + (selon le contexte) saisie du prix négocié pour
// une ligne. Le prix n'est jamais dérivé du catalogue — voir Chantier 4 (prix manuel).
const PriceCalculatorModal: React.FC<PriceCalculatorModalProps> = ({ isOpen, onClose, product, onAddToCart, requirePrice = true }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();

    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    // Spécifications techniques (Chantier 5) : le schéma n'est chargé qu'au
    // moment de l'ajout au panier, pas à l'ouverture — évite un fetch inutile
    // pour un produit qu'on ne fait finalement que consulter.
    const [specSchema, setSpecSchema] = useState<FormDefinition | null>(null);

    useEffect(() => {
        if (product) {
            setQuantity(1);
            setUnitPrice(0);
            setDesignFile(null);
            setActiveImageIndex(0);
            setSpecSchema(null);
        }
    }, [product]);

    const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setUnitPrice(isNaN(value) ? 0 : Math.max(0, value));
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(e.target.value, 10);
        setQuantity(isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDesignFile(e.target.files[0]);
        }
    };
    
    const handleRemoveFile = () => {
        setDesignFile(null);
        const fileInput = document.getElementById('design-file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const finalizeAddToCart = (specValues?: SpecValues) => {
        if (!product) return;
        const cartItemId = `${product.id}-${designFile?.name || ''}-${specValues ? Date.now() : ''}`;

        onAddToCart({
            id: cartItemId,
            product,
            options: {},
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            designFile: designFile ? { name: designFile.name, url: URL.createObjectURL(designFile) } : undefined,
            designFileObject: designFile || undefined,
            specValues,
        });
        onClose();
    };

    const handleSubmit = async () => {
        if (!product || (requirePrice && unitPrice <= 0)) return;

        const schema = await queryClient.fetchQuery({
            queryKey: ['form-definition', product.id],
            queryFn: () => getFormDefinition(product.id),
        });
        const hasSpecs = schema.groups.some(g => g.specifications.length > 0) || schema.ungroupedSpecifications.length > 0;

        if (hasSpecs) {
            setSpecSchema(schema);
        } else {
            finalizeAddToCart();
        }
    };

    const handleConfirmSpecValues = (values: SpecValues) => {
        setSpecSchema(null);
        finalizeAddToCart(values);
    };

    if (!isOpen || !product) return null;

    const hasImages = product.productImages && product.productImages.length > 0;
    const activeImageUrl = hasImages && product.productImages ? getImageUrl(product.productImages[activeImageIndex].imageUrl) : 'https://via.placeholder.com/400x300?text=Image+Indisponible';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{product.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Column */}
                        <div>
                            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-2">
                                <LazyLoadImage
                                    alt={product.name}
                                    src={activeImageUrl}
                                    effect="blur"
                                    wrapperClassName="w-full h-full"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {hasImages && product.productImages && product.productImages.length > 1 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {product.productImages.slice(0, 5).map((image, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => setActiveImageIndex(index)} 
                                            className={`aspect-square rounded-md overflow-hidden focus:outline-none ring-2 ring-offset-1 ${activeImageIndex === index ? 'ring-[#c6e911]' : 'ring-transparent'}`}
                                            aria-label={`View image ${index + 1}`}
                                        >
                                            <LazyLoadImage
                                                alt={`Thumbnail ${index + 1}`}
                                                src={getImageUrl(image.imageUrl)}
                                                effect="blur"
                                                wrapperClassName="w-full h-full"
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Options Column */}
                        <div className="space-y-8">
                            <div className={requirePrice ? "grid grid-cols-2 gap-4" : ""}>
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">{t('calculator.quantity')}</label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        min="1"
                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                    />
                                </div>
                                {requirePrice && (
                                    <div>
                                        <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-700">{t('calculator.unitPrice')}</label>
                                        <input
                                            type="number"
                                            id="unitPrice"
                                            name="unitPrice"
                                            value={unitPrice || ''}
                                            onChange={handleUnitPriceChange}
                                            min="0"
                                            step="0.01"
                                            className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('calculator.uploadFile')}</label>
                                {!designFile ? (
                                    <label htmlFor="design-file-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-[#c6e911]">
                                        <div className="space-y-1 text-center">
                                            <IconUpload className="mx-auto h-12 w-12 text-slate-400" />
                                            <p className="text-sm text-slate-600">{t('calculator.dragAndDrop')}</p>
                                            <p className="text-xs text-slate-500">PDF, PNG, JPG jusqu'à 10MB</p>
                                        </div>
                                        <input id="design-file-upload" name="design-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg"/>
                                    </label>
                                ) : (
                                    <div className="mt-1 flex items-center justify-between p-3 border border-green-300 bg-green-50 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <IconFile className="h-6 w-6 text-green-600"/>
                                            <div>
                                                <p className="text-sm font-semibold text-green-800">{t('calculator.fileUploaded')}</p>
                                                <p className="text-sm text-green-700">{designFile.name}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={handleRemoveFile} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full">
                                            <IconDelete className="h-5 w-5"/>
                                            <span className="sr-only">{t('calculator.removeFile')}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex-shrink-0 flex justify-between items-center">
                    {requirePrice ? (
                        <div className="text-left">
                             <p className="text-sm font-medium text-slate-500">{t('calculator.totalPrice')}</p>
                             <p className="text-3xl font-bold text-slate-800">{formatCurrency(unitPrice * quantity)}</p>
                             <p className="text-sm text-slate-600">{formatCurrency(unitPrice)} / {t('calculator.unitPrice')}</p>
                        </div>
                    ) : <div />}
                    <button onClick={handleSubmit} disabled={requirePrice && unitPrice <= 0} className="px-8 py-4 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-base">
                        {t('calculator.addToCart')}
                    </button>
                </div>
            </div>

            {specSchema && (
                <SpecValuesModal
                    isOpen={!!specSchema}
                    onClose={() => setSpecSchema(null)}
                    onConfirm={handleConfirmSpecValues}
                    productName={product.name}
                    schema={specSchema}
                />
            )}
        </div>
    );
};

export default PriceCalculatorModal;
