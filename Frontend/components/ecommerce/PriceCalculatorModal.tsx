import React, { useState, useEffect } from 'react';
import { Product, ProductOptions } from '../../types';
import { useI18n } from '../../i18n';
import { calculatePrice } from '../../utils/priceCalculator';
import { CartItem } from './ShoppingCart';
import IconUpload from '../icons/IconUpload';
import IconFile from '../icons/IconFile';
import IconDelete from '../icons/IconDelete';
import { getImageUrl } from '../../utils/imageUtils';

interface PriceCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (item: CartItem) => void;
}

const PriceCalculatorModal: React.FC<PriceCalculatorModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
    const { t, formatCurrency } = useI18n();
    
    const [options, setOptions] = useState<Partial<ProductOptions>>({});
    const [quantity, setQuantity] = useState(100);
    const [price, setPrice] = useState({ unitPrice: 0, totalPrice: 0 });
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (product?.configurableOptions) {
            const defaults: Partial<ProductOptions> = {};
            const config = product.configurableOptions;
            if (config.FORMATS?.[0]) defaults.format = config.FORMATS[0].optionName;
            if (config.GRAMMAGES?.[0]) defaults.grammage = config.GRAMMAGES[0].optionName;
            if (config.PRINTSIDES?.[0]) defaults.printSide = config.PRINTSIDES[0].optionName;
            if (config.LAMINATIONS?.[0]) defaults.lamination = config.LAMINATIONS[0].optionName;
            if (config.SIZES?.[0]) defaults.size = config.SIZES[0].optionName;
            if (config.COLORS?.[0]) defaults.color = config.COLORS[0].optionName;
            if (config.MATERIALS?.[0]) defaults.material = config.MATERIALS[0].optionName;
            if (config.DIMENSIONS?.[0]) defaults.dimension = config.DIMENSIONS[0].optionName;
            if (config.BINDINGS?.[0]) defaults.binding = config.BINDINGS[0].optionName;
            if (config.FOLDINGS?.[0]) defaults.folding = config.FOLDINGS[0].optionName;
            if (config.CORNERS?.[0]) defaults.corner = config.CORNERS[0].optionName;
            if (config.EYELETS?.[0]) defaults.eyelet = config.EYELETS[0].optionName;
            if (config.PAGES?.[0]) defaults.page = config.PAGES[0].optionName;
            if (config.HANDLES?.[0]) defaults.handle = config.HANDLES[0].optionName;
            if (config.STUB?.[0]) defaults.stub = config.STUB[0].optionName;
            if (config.NUMBERING?.[0]) defaults.numbering = config.NUMBERING[0].optionName;
            
            setOptions(defaults);
            setQuantity(100);
            setDesignFile(null);
            setActiveImageIndex(0);
        }
    }, [product]);

    useEffect(() => {
        if (product) {
            const newPrice = calculatePrice(product, options, quantity);
            setPrice(newPrice);
        }
    }, [product, options, quantity]);
    
    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setOptions(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = () => {
        if (!product) return;
        const optionString = Object.entries(options)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
            
        const cartItemId = `${product.id}-${optionString}-${designFile?.name || ''}`;

        onAddToCart({
            id: cartItemId,
            product,
            options,
            quantity,
            unitPrice: price.unitPrice,
            totalPrice: price.totalPrice,
            designFile: designFile ? { name: designFile.name, url: URL.createObjectURL(designFile) } : undefined,
            designFileObject: designFile || undefined
        });
        onClose();
    };

    if (!isOpen || !product) return null;
    
    const config = product.configurableOptions;
    const hasImages = product.productImages && product.productImages.length > 0;
    const activeImageUrl = hasImages && product.productImages ? getImageUrl(product.productImages[activeImageIndex].imageUrl) : 'https://via.placeholder.com/400x300?text=Image+Indisponible';

    const renderSelect = (name: keyof ProductOptions, labelKey: string, items: {optionName: string}[]) => (
        <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700">{t(labelKey)}</label>
            <select
                id={name}
                name={name}
                value={(options as any)[name] || ''}
                onChange={handleOptionChange}
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
            >
                {items.map(item => <option key={item.optionName} value={item.optionName}>{item.optionName}</option>)}
            </select>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{product.productName}</h3>
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
                                <img src={activeImageUrl} alt={product.productName} className="w-full h-full object-cover" />
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
                                            <img src={getImageUrl(image.imageUrl)} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Options Column */}
                        <div className="space-y-8">
                             <div>
                                <h4 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">{t('calculator.title')}</h4>
                                <div className="space-y-4">
                                    {config?.FORMATS && renderSelect('format', 'calculator.format', config.FORMATS)}
                                    {config?.GRAMMAGES && renderSelect('grammage', 'calculator.grammage', config.GRAMMAGES)}
                                    {config?.PRINTSIDES && renderSelect('printSide', 'calculator.printSide', config.PRINTSIDES)}
                                    {config?.LAMINATIONS && renderSelect('lamination', 'calculator.lamination', config.LAMINATIONS)}
                                    {config?.SIZES && renderSelect('size', 'calculator.size', config.SIZES)}
                                    {config?.COLORS && renderSelect('color', 'calculator.color', config.COLORS)}
                                    {config?.MATERIALS && renderSelect('material', 'calculator.material', config.MATERIALS)}
                                    {config?.DIMENSIONS && renderSelect('dimension', 'calculator.dimension', config.DIMENSIONS)}
                                    {config?.BINDINGS && renderSelect('binding', 'calculator.binding', config.BINDINGS)}
                                    {config?.FOLDINGS && renderSelect('folding', 'calculator.folding', config.FOLDINGS)}
                                    {config?.CORNERS && renderSelect('corner', 'calculator.corners', config.CORNERS)}
                                    {config?.EYELETS && renderSelect('eyelet', 'calculator.eyelets', config.EYELETS)}
                                    {config?.PAGES && renderSelect('page', 'calculator.pages', config.PAGES)}
                                    {config?.HANDLES && renderSelect('handle', 'calculator.handles', config.HANDLES)}
                                    {config?.STUB && renderSelect('stub', 'calculator.stub', config.STUB)}
                                    {config?.NUMBERING && renderSelect('numbering', 'calculator.numbering', config.NUMBERING)}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">{t('calculator.quantity')}</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    min="1"
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                />
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
                    <div className="text-left">
                         <p className="text-sm font-medium text-slate-500">{t('calculator.totalPrice')}</p>
                         <p className="text-3xl font-bold text-slate-800">{formatCurrency(price.totalPrice)}</p>
                         <p className="text-sm text-slate-600">~{formatCurrency(price.unitPrice)} / {t('calculator.unitPrice')}</p>
                    </div>
                    <button onClick={handleSubmit} className="px-8 py-4 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] transition-colors text-base">
                        {t('calculator.addToCart')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceCalculatorModal;
