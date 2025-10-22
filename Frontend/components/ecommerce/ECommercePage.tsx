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
import { loginContact, registerContact, ContactRegisterData, logoutContact } from '../../services/apiCrm/apiContacts';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../context/AuthContext';
// Le type de données reçu du formulaire d'inscription, correspondant à celui de AuthModal
type SignupFormData = Omit<ContactRegisterData, 'subsidiaryId' | 'since' | 'isVerified'>;

const ECommercePage: React.FC = () => {
    const navigate = useNavigate();
    const { loginCustomer, logoutCustomer, contact } = useAuth();
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
    const [isCheckoutFlow, setIsCheckoutFlow] = useState(false); // <-- AJOUTER CET ÉTAT
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    // --- TanStack Query ---
    const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
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

    const { mutateAsync: signupMutation } = useMutation({
        mutationFn: (signupData: SignupFormData) => {
            const fullSignupData: ContactRegisterData = {
                ...signupData,
                since: new Date().toISOString(),
                isVerified: false,
            };
            return registerContact(fullSignupData);
        },
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

    const onRegister = async (signupData: SignupFormData): Promise<'SUCCESS' | 'FAILED'> => {
        try {
            await signupMutation(signupData);
            return 'SUCCESS';
        } catch (error) {
            console.error("Registration failed:", error);
            return 'FAILED';
        }
    };

    const onLogin = async (email: string, password: string): Promise<'SUCCESS' | 'NOT_VERIFIED' | 'FAILED'> => {
        try {
            const response = await loginContact({ email, password });
            loginCustomer({contact: response.contact, access_token: response.access_token});
            return 'SUCCESS';
        } catch (error) {
            console.error("Login failed:", error);
            return 'FAILED';
        }
    };

    const onLogout = async () => {
        try {
            await logoutContact(); // Appelle l'API pour invalider le token côté serveur
            logoutCustomer(); // Nettoie l'état et le localStorage côté client
            navigate({ to: '/' });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (selectedSubcategory) {
                return product.category === selectedSubcategory;
            }
            if (selectedMainCategory) {
                return product.mainCategory === selectedMainCategory;
            }
            return true;
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
        setIsCheckoutFlow(true);
        if (contact) {
            setIsCheckoutOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };
    
    const handleConfirmOrder = (customerInfo: { name: string; email: string; address: string; }, paymentMethod: string) => {
        const formData = new FormData();
        
        // 1. Préparer les données des articles pour la sérialisation JSON
        // Le backend s'attend à recevoir les fichiers dans le même ordre que les articles.
        const orderItemsForJson = cart.map(item => {
            // Transformer l'objet options en tableau [{optionType, optionValue}]
            const optionsArray = Object.entries(item.options || {})
                .filter(([, value]) => value) // S'assurer que la valeur de l'option n'est pas vide
                .map(([key, value]) => ({
                    optionType: key.toUpperCase() + 'S', // ex: 'size' -> 'SIZES'
                    optionValue: value as string,
                }));

            return {
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                options: optionsArray,
                designFileName: item.designFileObject?.name,
            };
        });

        // 2. Ajouter les champs textuels au FormData
        formData.append('customerName', customerInfo.name); // Le backend utilise `customerName`
        formData.append('paymentMethod', paymentMethod);
        formData.append('paymentDueDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()); // Exemple: paiement dans 30 jours
        formData.append('source', 'WEB_ORDER');
        formData.append('items', JSON.stringify(orderItemsForJson)); // Envoyer les articles en tant que chaîne JSON

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
        if(isCheckoutFlow){
            setIsCheckoutOpen(true);
            setIsCheckoutFlow(false);
        } else {
            navigate({ to: '/account' });
        }
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
                currentCustomer={contact}
                onLogin={() => {
                    setIsCheckoutFlow(false); // L'utilisateur se connecte depuis l'en-tête, pas pour payer
                    setIsAuthModalOpen(true);
                }}
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

                {isLoadingProducts && (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
                    </div>
                )}

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
                    onLogin={onLogin}
                    onRegister={onRegister}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}
            
            {isCheckoutOpen && (
                <CheckoutModal 
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    onConfirmOrder={handleConfirmOrder}
                    cartItems={cart}
                    customer={contact}
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