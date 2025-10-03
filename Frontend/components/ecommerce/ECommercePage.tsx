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
import { useAppContext } from '../../context/AppContext';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/apiProducts';
import { loginCustomer, signupCustomer } from '../../services/apiAuth';
import { api } from '../../services/api';

const ECommercePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer } = state;
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    // --- TanStack Query ---
    const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts,
    });

    const { mutate: placeOrderMutation } = useMutation({
        mutationFn: (data: { orderData: { customerInfo: { name: string; email: string; address: string; }; items: OrderItem[]; }, paymentMethod: string }) => 
            api.post('/orders/ecommerce', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setCart([]);
        }
    });

    const { mutate: signupMutation } = useMutation<Contact, Error, Omit<Contact, 'id' | 'subsidiaryId' | 'since' | 'isVerified' | 'salesRepId' | 'accountId'>>({
        mutationFn: signupCustomer,        
        onSuccess: (newCustomer) => {
            // Gérer la réponse, par exemple, afficher un message de succès
            // ou connecter automatiquement l'utilisateur.
            console.log('Signup successful', newCustomer);
            dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: newCustomer });
        }
    });

    const { mutate: quoteRequestMutation } = useMutation({
        mutationFn: (data: { name: string; company: string; email: string; phone: string; description: string; }) =>
            api.post('/leads/quote-request', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
    });

    // --- Fin TanStack Query ---

    const products = useMemo(() =>
        allProducts.filter(p => p.mainCategory !== 'Matières Premières'),
        [allProducts]
    );

    const onLogin = async (email: string, password: string): Promise<'SUCCESS' | 'NOT_VERIFIED' | 'FAILED'> => {
        try {
            const customer = await loginCustomer({ email, password });
            dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: customer });
            return 'SUCCESS';
        } catch (error) {
            console.error("Login failed:", error);
            return 'FAILED';
        }
    };

    const onLogout = () => dispatch({ type: 'CUSTOMER_LOGOUT' });

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
        placeOrderMutation({ orderData: { customerInfo, items: orderItems }, paymentMethod });
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

    if (isLoadingProducts) {
        return <div>Chargement des produits...</div>;
    }

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
                    productHierarchy={PRODUCT_HIERARCHY.filter(cat => cat.category !== 'Matières Premières')}
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
            <ECommerceFooter realisationsPath="/realisations" onSelectMainCategory={handleSelectMainCategory} onBackToShop={handleSelectAllCategories} />

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
                    onLogin={onLogin} // La logique de login est maintenant asynchrone
                    onRegister={signupMutation}
                    onAuthSuccess={handleAuthSuccess}
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
                    onSave={quoteRequestMutation}
                />
            )}
        </div>
    );
};

export default ECommercePage;