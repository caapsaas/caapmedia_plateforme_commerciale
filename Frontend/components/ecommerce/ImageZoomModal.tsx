import React, { useState, useEffect, useCallback } from 'react';
import { ProductImage } from '../../types/models';
import { getImageUrl } from '../../utils/imageUtils';
import IconChevronLeft from '../icons/IconChevronLeft';
import IconChevronRight from '../icons/IconChevronRight';

interface ImageZoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: ProductImage[];
    startIndex?: number;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ isOpen, onClose, images, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(startIndex);
        }
    }, [startIndex, isOpen]);

    const nextImage = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImage();
            else if (e.key === 'ArrowLeft') prevImage();
            else if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, nextImage, prevImage]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col" role="dialog" aria-modal="true" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors z-20" aria-label="Close">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex-grow flex items-center justify-center p-4 relative group" onClick={e => e.stopPropagation()}>
                <img 
                    src={getImageUrl(images[currentIndex].imageUrl)} 
                    alt={images[currentIndex].imageName || `Vue zoomée ${currentIndex + 1}`} 
                    className="max-h-full max-w-full object-contain transition-all duration-300"
                />
                {images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all opacity-50 group-hover:opacity-100" aria-label="Previous image">
                            <IconChevronLeft className="h-8 w-8" />
                        </button>
                        <button onClick={nextImage} className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all opacity-50 group-hover:opacity-100" aria-label="Next image">
                            <IconChevronRight className="h-8 w-8" />
                        </button>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex-shrink-0 h-28 w-full flex justify-center items-center gap-2 p-2" onClick={e => e.stopPropagation()}>
                    {images.map((image, index) => (
                        <button 
                            key={image.id || index} 
                            onClick={() => setCurrentIndex(index)}
                            className={`h-20 w-20 rounded-md overflow-hidden transition-all duration-200 focus:outline-none ring-2 ring-offset-2 ring-offset-black ${currentIndex === index ? 'ring-[#c6e911]' : 'ring-transparent opacity-60 hover:opacity-100'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <img src={getImageUrl(image.imageUrl)} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageZoomModal;
