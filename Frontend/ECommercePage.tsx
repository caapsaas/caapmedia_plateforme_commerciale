import React, { useState, useMemo } from 'react';
import { Product, Contact, OrderItem } from './types';
import { useAppContext } from './context/AppContext';
import { useI18n } from './i18n';
import ECommerceHeader from './components/ecommerce/ECommerceHeader';
import ProductCard from './components/ecommerce/ProductCard';
import ShoppingCart, { CartItem } from './components/ecommerce/ShoppingCart';
import CheckoutModal from './components/ecommerce/CheckoutModal';
import { PRODUCT_HIERARCHY } from './constants';
import AuthModal from './components/customer/AuthModal';
import PriceCalculatorModal from './components/ecommerce/PriceCalculatorModal';
import HeroBanner from './components/ecommerce/HeroBanner';
import QuoteRequestModal from './components/ecommerce/QuoteRequestModal';
import ECommerceFooter from './components/ecommerce/ECommerceFooter';
import CategoryShowcase from './components/ecommerce/CategoryShowcase';
import { Link } from '@tanstack/react-router';

const ECommercePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { products: allProducts, currentCustomer, contacts } = state;
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

    const products = useMemo(() =>
        allProducts.filter(p => p.mainCategory !== 'Matières Premières'),
        [allProducts]
    );

    const onPlaceOrder = (orderData: { customerInfo: { name: string; email: string; address: string; }; items: OrderItem[]; }, paymentMethod: string) => {
        dispatch({ type: 'PLACE_ECOMMERCE_ORDER', payload: { orderData, paymentMethod } });
    };

    const onLogin = (email: string, pass: string) => {
        const customer = contacts.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === pass);
        if (customer) {
            if (customer.isVerified) {
                dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: customer });
                return 'SUCCESS';
            }
            return 'NOT_VERIFIED';
        }
        return 'FAILED';
    };
    const onSignup = (data: Omit<Contact, 'id' | 'subsidiaryId' | 'since' | 'isVerified' | 'salesRepId' | 'accountId'>) => dispatch({ type: 'CUSTOMER_SIGNUP', payload: data });
    const onLogout = () => dispatch({ type: 'CUSTOMER_LOGOUT' });
    const onVerifyAccount = (email: string) => dispatch({ type: 'VERIFY_CUSTOMER', payload: email });
    const onQuoteRequestSubmit = (data: { name: string; company: string; email: string; phone: string; description: string; }) => dispatch({ type: 'SUBMIT_QUOTE_REQUEST', payload: data });

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
                dashboardPath="/dashboard"
                currentCustomer={currentCustomer}
                onLogin={() => setIsAuthModalOpen(true)}
                onLogout={onLogout}
                accountPath="/account"
                cartItemCount={cartItemCount}
                onCartClick={() => setIsCartOpen(true)}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onQuoteRequest={() => setIsQuoteModalOpen(true)}
                onSelectAllCategories={handleSelectAllCategories}
                productHierarchy={PRODUCT_HIERARCHY}
                onSelectMainCategory={handleSelectMainCategory}
                onSelectSubcategory={handleSelectSubcategory}
            />
            <main className="container mx-auto px-4 pt-8 pb-8 flex-grow">
                <HeroBanner realisationsPath="/realisations" onQuoteRequest={() => setIsQuoteModalOpen(true)} />

                <CategoryShowcase
                    productHierarchy={PRODUCT_HIERARCHY}
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
            <ECommerceFooter realisationsPath="/realisations" onSelectMainCategory={handleSelectMainCategory} />

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