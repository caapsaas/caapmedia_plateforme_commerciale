import React, { useState, useMemo } from 'react';
import { Product, Contact } from '../../types';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/apiE-commerce/apiProducts';
import { createOrder } from '../../services/apiE-commerce/apiOrders';
import { createQuoteRequest } from '../../services/apiCrm/apiLeads';
import { loginContact, registerContact, ContactRegisterData } from '../../services/apiCrm/apicontacts';

// Le type de données reçu du formulaire d'inscription, correspondant à celui de AuthModal
type SignupFormData = Omit<ContactRegisterData, 'subsidiaryId' | 'since' | 'isVerified'>;

const ECommercePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer, currentSubsidiary } = state;
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
        mutationFn: createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setCart([]);
        }
    });

    const { mutate: signupMutation } = useMutation<Contact, Error, SignupFormData>({
        mutationFn: (signupData) => {
            if (!currentSubsidiary) {
                throw new Error("Subsidiary not found. Cannot register contact.");
            }
            const fullSignupData: ContactRegisterData = {
                ...signupData,
                subsidiaryId: currentSubsidiary.id,
                since: new Date().toISOString(),
                isVerified: false,
            };
            return registerContact(fullSignupData);
        },
        onSuccess: (newCustomer) => {
            console.log('Signup successful', newCustomer);
            dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: newCustomer });
        }
    });

    const { mutate: quoteRequestMutation } = useMutation<any, Error, FormData>({
        mutationFn: createQuoteRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
    });

    // --- Fin TanStack Query ---

    const products = useMemo(() =>
        allProducts.filter((p: Product) => p.mainCategory !== 'Matières Premières'),
        [allProducts]
    );

    const onLogin = async (email: string, password: string): Promise<'SUCCESS' | 'NOT_VERIFIED' | 'FAILED'> => {
        try {
            const response = await loginContact({ email, password });
            const customer = response.contact; // Extraire le client de la réponse
            dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: customer });
            return 'SUCCESS';
        } catch (error) {
            console.error("Login failed:", error);
            return 'FAILED';
        }
    };

    const onLogout = () => dispatch({ type: 'CUSTOMER_LOGOUT' });

    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
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
        const formData = new FormData();
        
        // 1. Préparer les données des articles pour la sérialisation JSON
        // Le backend s'attend à recevoir les fichiers dans le même ordre que les articles.
        const orderItemsForJson = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            options: item.options,
            // Le backend utilisera le nom du fichier pour l'associer
            designFileName: item.designFileObject?.name, 
        }));

        // 2. Ajouter les champs textuels au FormData
        formData.append('customerName', customerInfo.name); // Le backend utilise `customerName`
        formData.append('paymentMethod', paymentMethod);
        formData.append('paymentDueDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()); // Exemple: paiement dans 30 jours
        formData.append('source', 'web_order');
        formData.append('items', JSON.stringify(orderItemsForJson)); // Envoyer les articles en tant que chaîne JSON
        if (currentCustomer) {
            formData.append('customerId', currentCustomer.id);
        }

        // 3. Ajouter tous les fichiers de design sous la même clé 'designFiles'
        cart.forEach(item => {
            if (item.designFileObject) {
                formData.append('designFiles', item.designFileObject);
            }
        });

        placeOrderMutation(formData);
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
                    {filteredProducts.map((product: Product) => (
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
                    // subsidiaryId n'est plus nécessaire ici
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
                    onSave={(data) => {
                        const formData = new FormData();
                        Object.entries(data).forEach(([key, value]) => {
                            if (value) formData.append(key, value instanceof File ? value : String(value));
                        });
                        quoteRequestMutation(formData);
                    }}
                />
            )}
        </div>
    );
};

export default ECommercePage;