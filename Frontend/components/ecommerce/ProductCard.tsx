import React, { useState } from 'react';
import { Product } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
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
    const toast = useToast();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

    const hasImages = product.productImages && product.productImages.length > 0;
    const activeImageUrl = hasImages && product.productImages? getImageUrl(product.productImages[activeImageIndex].imageUrl) : 'https://via.placeholder.com/400x300?text=Image+Indisponible';

    const buttonLabel = t('ecommerce.addToCart');

    const isOutOfStock = product.stock <= 0;

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl flex flex-col">
            <div className="relative">
                <div className="relative w-full aspect-[4/3] bg-gray-200">
                    <LazyLoadImage
                        alt={product.productName}
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
                    <h3 className="font-bold text-base text-slate-800 truncate" title={product.productName}>{product.productName}</h3>
                    <p className="text-sm text-slate-500 mt-1">{product.category}</p>
                  
                </div>
                <div className="flex justify-between items-center mt-4">
                    
                    <button
                        onClick={() => {
                            if (isOutOfStock) {
                                toast.error('Produit indisponible', 'Ce produit est en rupture de stock');
                                return;
                            }

                            // Ouvrir WhatsApp avec message du produit
                            const phoneNumber = "237671890184";
                            const message = `Bonjour,\n\nJe suis intéressé par votre produit : ${product.productName}\n\nJe voudrais en savoir plus et passer commande.\n\nMerci!`;
                            const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[\s\-\(\)]/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                        className={`px-4 py-1.5 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
                            isOutOfStock
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#c6e911] text-slate-800 hover:bg-[#b8d60a]'
                        }`}
                        disabled={isOutOfStock}
                    >
                        {isOutOfStock ? 'Indisponible' : (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 9.885-5.335 9.89-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                Commander
                            </>
                        )}
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