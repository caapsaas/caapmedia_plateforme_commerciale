import React, { useState, useMemo } from 'react';
import { Product, Contact, OrderItem } from '../../types';
import { useI18n } from '../../i18n';
import ECommerceHeader from './ECommerceHeader';
import ProductCard from './ProductCard';
import ShoppingCart, { CartItem } from './ShoppingCart';
import CheckoutModal from './CheckoutModal';
import { PRODUCT_HIERARCHY } from '../../constants';
import AuthModal from '../customer/AuthModal';
import PriceCalculatorModal from './PriceCalculatorModal';
import HeroBanner from './HeroBanner';
import QuoteRequestModal from './QuoteRequestModal';
import ECommerceFooter from './ECommerceFooter';
import CategoryShowcase from './CategoryShowcase';

interface ECommercePageProps {
    products: Product[];
    onPlaceOrder: (orderData: { customerInfo: { name: string; email: string; address: string; }; items: OrderItem[]; }, paymentMethod: string) => void;
    currentCustomer: Contact | null;
    onLogin: (email: string, pass: string) => 'SUCCESS' | 'NOT_VERIFIED' | 'FAILED';
    onSignup: (data: Omit<Contact, 'id' | 'subsidiaryId' | 'since' | 'isVerified' | 'salesRepId' | 'accountId'>) => void;
    onLogout: () => void;
    onVerifyAccount: (email: string) => void;
    onNavigateToAccount: () => void;
    onNavigateToDashboard: () => void;
    onNavigateToRealisations: () => void;
    onQuoteRequestSubmit: (data: { name: string; company: string; email: string; phone: string; description: string; }) => void;
}

const ECommercePage: React.FC<ECommercePageProps> = ({ products, onPlaceOrder, currentCustomer, onLogin, onSignup, onLogout, onVerifyAccount, onNavigateToAccount, onNavigateToDashboard, onNavigateToRealisations, onQuoteRequestSubmit }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    const ecommerceProductHierarchy = useMemo(() => 
        PRODUCT_HIERARCHY.filter(cat => cat.category !== 'Matières Premières'), 
    []);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (selectedSubcategory) {
                return product.category === selectedSubcategory;
            }
            if (selectedMainCategory) {
                return product.mainCategory === selectedMainCategory;
            }
            return true; // No category filter applied
        });
    }, [products, searchTerm, selectedMainCategory, selectedSubcategory]);
    
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    const handleAddToCart = (item: CartItem) => {
        setCart(currentCart => {
            const existingItemIndex = currentCart.findIndex(i => i.id === item.id);
            if (existingItemIndex > -1) {
                const updatedCart = [...currentCart];
                const existingItem = updatedCart[existingItemIndex];
                existingItem.quantity += item.quantity;
                existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
                return updatedCart;
            }
            return [...currentCart, item];
        });
    };
    
    const handleProductClick = (product: Product) => {
        if (product.configurableOptions) {
            setConfiguringProduct(product);
        } else {
            const cartItem: CartItem = {
                id: product.id,
                product,
                quantity: 1,
                options: {},
                unitPrice: product.sellingPrice,
                totalPrice: product.sellingPrice,
            };
            handleAddToCart(cartItem);
        }
    };

    const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
        setCart(currentCart => {
            if (newQuantity <= 0) {
                return currentCart.filter(item => item.id !== cartItemId);
            }
            return currentCart.map(item =>
                item.id === cartItemId ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity } : item
            );
        });
    };

    const handleInitiateCheckout = () => {
        setIsCartOpen(false);
        if (currentCustomer) {
            setIsCheckoutOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };
    
    const handleConfirmOrder = (customerInfo: { name: string; email: string; address: string; }, paymentMethod: string) => {
        const orderItems: OrderItem[] = cart.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.unitPrice,
            options: item.options,
            designFile: item.designFile,
        }));
        onPlaceOrder({ customerInfo, items: orderItems }, paymentMethod);
        setCart([]);
    };
    
    const handleAuthSuccess = () => {
        setIsAuthModalOpen(false);
        setIsCheckoutOpen(true);
    };

    const handleSelectMainCategory = (category: string) => {
        setSelectedMainCategory(category);
        setSelectedSubcategory('');
    };
    
    const handleSelectSubcategory = (mainCategory: string, subcategory: string) => {
        setSelectedMainCategory(mainCategory); 
        setSelectedSubcategory(subcategory);
    };

    const handleSelectAllCategories = () => {
        setSelectedMainCategory('');
        setSelectedSubcategory('');
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <ECommerceHeader 
                onNavigateToDashboard={onNavigateToDashboard}
                currentCustomer={currentCustomer}
                onLogin={() => setIsAuthModalOpen(true)}
                onLogout={onLogout}
                onNavigateToAccount={onNavigateToAccount}
                cartItemCount={cartItemCount}
                onCartClick={() => setIsCartOpen(true)}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onQuoteRequest={() => setIsQuoteModalOpen(true)}
                onSelectAllCategories={handleSelectAllCategories}
                productHierarchy={ecommerceProductHierarchy}
                onSelectMainCategory={handleSelectMainCategory}
                onSelectSubcategory={handleSelectSubcategory}
            />
            <main className="container mx-auto px-4 pt-8 pb-8 flex-grow">
                <HeroBanner onNavigateToRealisations={onNavigateToRealisations} onQuoteRequest={() => setIsQuoteModalOpen(true)} />

                <CategoryShowcase
                    productHierarchy={ecommerceProductHierarchy}
                    onSelectMainCategory={handleSelectMainCategory}
                    onSelectSubcategory={handleSelectSubcategory}
                />

                {/* Products Grid */}
                <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-12">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleProductClick} />
                    ))}
                </div>
            </main>
            <ECommerceFooter onNavigateToRealisations={onNavigateToRealisations} onSelectMainCategory={handleSelectMainCategory} />

            {isCartOpen && (
                <ShoppingCart 
                    cartItems={cart}
                    onClose={() => setIsCartOpen(false)}
                    onUpdateQuantity={handleUpdateQuantity}
                    onCheckout={handleInitiateCheckout}
                />
            )}
            
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onLogin={onLogin}
                    onSignup={onSignup}
                    onAuthSuccess={handleAuthSuccess}
                    onVerifyAccount={onVerifyAccount}
                />
            )}
            
            {isCheckoutOpen && (
                <CheckoutModal 
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    onConfirmOrder={handleConfirmOrder}
                    cartItems={cart}
                    customer={currentCustomer}
                />
            )}

            {configuringProduct && (
                <PriceCalculatorModal
                    isOpen={!!configuringProduct}
                    onClose={() => setConfiguringProduct(null)}
                    product={configuringProduct}
                    onAddToCart={handleAddToCart}
                />
            )}
            
            {isQuoteModalOpen && (
                <QuoteRequestModal 
                    isOpen={isQuoteModalOpen}
                    onClose={() => setIsQuoteModalOpen(false)}
                    onSave={onQuoteRequestSubmit}
                />
            )}
        </div>
    );
};

export default ECommercePage;