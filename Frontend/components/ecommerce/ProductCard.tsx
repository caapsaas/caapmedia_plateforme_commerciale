import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useI18n } from '../../i18n';
import IconHeart from '../icons/IconHeart';
import IconSearch from '../icons/IconSearch';
import ImageZoomModal from './ImageZoomModal';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const { t, formatCurrency } = useI18n();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    
    const discount = useMemo(() => {
        const hasPromo = Math.random() > 0.4; // 60% de chance d'avoir une promotion
        if (!hasPromo) {
            return null;
        }
        // Entier aléatoire entre 2 et 5 (inclus)
        return Math.floor(Math.random() * (5 - 2 + 1)) + 2;
    }, []);

    const hasImages = product.productImages && product.productImages.length > 0;
    const activeImageUrl = hasImages && product.productImages? getImageUrl(product.productImages[activeImageIndex].imageUrl) : 'https://via.placeholder.com/400x300?text=Image+Indisponible';

    const buttonLabel = product.configurableOptions ? t('calculator.configure') : t('ecommerce.addToCart');

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl flex flex-col">
            <div className="relative">
                <div className="relative w-full aspect-[4/3] bg-gray-200">
                    <img src={activeImageUrl} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Overlay for icons */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsZoomModalOpen(true); }} 
                                className="p-2.5 bg-white/80 rounded-full hover:bg-white text-[#c6e911] shadow-lg backdrop-blur-sm transition-all transform hover:scale-110"
                                aria-label="Zoom image"
                            >
                                <IconSearch className="h-5 w-5"/>
                            </button>
                             {discount && (
                                <span className="bg-[#c6e911] text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">PROMO : -{discount}%</span>
                             )}
                        </div>
                        <div className="self-start">
                             <button 
                                onClick={(e) => { e.stopPropagation(); alert('Ajouté aux favoris!'); }}
                                className="p-2.5 bg-white/80 rounded-full hover:bg-white text-[#c6e911] shadow-lg backdrop-blur-sm transition-all transform hover:scale-110"
                                aria-label="Add to wishlist"
                            >
                                <IconHeart className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {hasImages && product.productImages && product.productImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-1 p-2 bg-slate-50">
                        {product.productImages.slice(0, 5).map((image, index) => (
                             <button 
                                key={index} 
                                onClick={() => setActiveImageIndex(index)} 
                                className={`aspect-square rounded-md overflow-hidden focus:outline-none ring-2 ring-offset-1 ${activeImageIndex === index ? 'ring-[#c6e911]' : 'ring-transparent'}`}
                                aria-label={`View image ${index + 1}`}
                            >
                                <img src={getImageUrl(image.imageUrl)} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="font-bold text-base text-slate-800 truncate" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{product.category}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-extrabold text-[#231F20]">{formatCurrency(product.sellingPrice)}</span>
                    <button 
                        onClick={() => onAddToCart(product)}
                        className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg text-sm hover:bg-[#adc40f] transition-colors"
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>

            {hasImages && product.productImages && (
                 <ImageZoomModal 
                    isOpen={isZoomModalOpen}
                    onClose={() => setIsZoomModalOpen(false)}
                    images={product.productImages}
                    startIndex={activeImageIndex}
                />
            )}
        </div>
    );
};

export default ProductCard;