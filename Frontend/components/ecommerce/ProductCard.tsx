import React, { useState } from 'react';
import { Product } from '../../types';
import { useI18n } from '../../i18n';
import IconHeart from '../icons/IconHeart';
import IconSearch from '../icons/IconSearch';
import ImageZoomModal from './ImageZoomModal';
import { getImageUrl } from '../../utils/imageUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css'; 

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    isLiked?: boolean;
    onLike?: (productId: string) => void;
    onUnlike?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isLiked, onLike, onUnlike }) => {
    const { t, formatCurrency } = useI18n();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

    const hasImages = product.productImages && product.productImages.length > 0;
    const activeImageUrl = hasImages && product.productImages? getImageUrl(product.productImages[activeImageIndex].imageUrl) : 'https://via.placeholder.com/400x300?text=Image+Indisponible';


    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl flex flex-col">
            <div className="relative">
                <div className="relative w-full aspect-[4/3] bg-gray-200">
                    <LazyLoadImage
                        alt={product.name}
                        src={activeImageUrl}
                        effect="blur"
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover"
                    />
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
                        </div>
                        {/* Bouton favori masqué temporairement */}
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

            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="font-bold text-base text-slate-800 truncate" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{product.category}</p>
                  
                </div>
                <div className="flex justify-between items-center mt-4">
                    
                    <button
                        onClick={() => onAddToCart(product)}
                        className="px-4 py-1.5 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 bg-[#c6e911] text-slate-800 hover:bg-[#adc40f]"
                    >
                        {t('ecommerce.addToCart')}
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