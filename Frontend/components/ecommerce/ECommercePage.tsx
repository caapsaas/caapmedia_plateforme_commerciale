import React, { useState, useMemo } from "react";
import { Product, CustomerPaymentMethod } from "../../types";
import { useI18n } from "../../i18n";
import { useToast } from "../../context/ToastContext";
import ECommerceHeader from "./ECommerceHeader";
import ShoppingCart, { CartItem } from "./ShoppingCart";
import CheckoutModal from "./CheckoutModal";
import { PRODUCT_HIERARCHY } from "../../constants";
import IconGmoLogo from "../icons/IconGmoLogo";
import AuthModal from "../customer/AuthModal";
import PriceCalculatorModal from "./PriceCalculatorModal";
import HeroBanner from "./HeroBanner";
import QuoteRequestModal from "./QuoteRequestModal";
import ECommerceFooter from "./ECommerceFooter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../../services/apiE-commerce/apiOrders";
import { createQuoteRequest } from "../../services/apiCrm/apiLeads";
import { subscribeToNewsletter } from "../../services/apiE-commerce/apiNewsletter";
import ContactModal from "./ContactModal";
import {
  loginContact,
  registerContact,
  ContactRegisterData,
  logoutContact,
} from "../../services/apiCrm/apicontacts";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import ProductsGrid from "../products/productsGrids";
type SignupFormData = Omit<
  ContactRegisterData,
  "subsidiaryId" | "since" | "isVerified"
>;

const ECommercePage: React.FC = () => {
  const navigate = useNavigate();
  const { loginCustomer, logoutCustomer, contact } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const localCart = window.localStorage.getItem("shoppingCart");
      return localCart ? JSON.parse(localCart) : [];
    } catch (error) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(
    null,
  );
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(() => {
    try {
      const savedLikes = window.localStorage.getItem("likedProducts");
      return savedLikes ? new Set(JSON.parse(savedLikes)) : new Set();
    } catch (error) {
      return new Set();
    }
  });
  const [showFavorites, setShowFavorites] = useState(false);

  // State for SEO content expansion
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);
  // State for Newsletter Form
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState("");

  const onNavigateToRealisations = () => {
    navigate({ to: "/realisations" });
  };

  // --- TanStack Query ---
  const { mutate: placeOrderMutation } = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Rafraîchir les produits pour mettre à jour le stock
      window.localStorage.removeItem("shoppingCart"); // Vider le panier local après la commande
      setCart([]);
      toast.success(
        "Commande confirmée!",
        "Votre commande a été enregistrée avec succès.",
      );
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);

      // Extraire les messages d'erreur spécifiques du backend
      let errorMessage =
        "Une erreur est survenue lors de la confirmation de votre commande.";
      let errorTitle = "Erreur de commande";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.message && Array.isArray(errorData.message)) {
          // Erreur de validation du backend
          errorMessage = errorData.message.join(", ");
          errorTitle = "Erreur de validation";

          // Messages d'erreur plus spécifiques
          if (errorMessage.includes("paymentMethod")) {
            errorTitle = "Méthode de paiement invalide";
            errorMessage =
              "Veuillez sélectionner une méthode de paiement valide.";
          } else if (errorMessage.includes("items")) {
            errorTitle = "Erreur dans les articles";
            errorMessage = "Veuillez vérifier les articles de votre panier.";
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      toast.error(errorTitle, errorMessage);
    },
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const { mutate: subscribeMutation, isPending: isSubscribing } = useMutation({
    mutationFn: subscribeToNewsletter,
    onSuccess: () => {
      setNewsletterSuccess(
        "Merci ! Vous êtes bien inscrit à notre newsletter.",
      );
      setNewsletterEmail("");
      setNewsletterConsent(false);
      queryClient.invalidateQueries({ queryKey: ["newsletter_subscribers"] }); // Optionnel: si vous avez une liste d'inscrits
    },
    onError: (err: any) => {
      // Affiche l'erreur venant du backend (ex: "Cet e-mail est déjà inscrit...")
      const errorMessage =
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription.";
      setNewsletterError(errorMessage);
    },
  });

  // --- Fin TanStack Query ---

  const onRegister = async (
    signupData: SignupFormData,
  ): Promise<"SUCCESS" | "FAILED"> => {
    try {
      await signupMutation(signupData);
      return "SUCCESS";
    } catch (error) {
      console.error("Registration failed:", error);
      return "FAILED";
    }
  };

  const onLogin = async (
    email: string,
    password: string,
  ): Promise<"SUCCESS" | "NOT_VERIFIED" | "FAILED"> => {
    try {
      const response = await loginContact({ email, password });
      loginCustomer({
        contact: response.contact,
        access_token: response.access_token,
      });
      return "SUCCESS";
    } catch (error) {
      console.error("Login failed:", error);
      return "FAILED";
    }
  };

  const onLogout = async () => {
    try {
      await logoutContact(); // Appelle l'API pour invalider le token côté serveur
      logoutCustomer(); // Nettoie l'état et le localStorage côté client
      navigate({ to: "/" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const handleAddToCart = (item: CartItem) => {
    setCart((currentCart) => {
      const existingItemIndex = currentCart.findIndex((i) => i.id === item.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...currentCart];
        const existingItem = updatedCart[existingItemIndex];
        existingItem.quantity += item.quantity;
        existingItem.totalPrice =
          existingItem.unitPrice * existingItem.quantity;
        return updatedCart;
      }
      return [...currentCart, item];
    });
  };

  const handleProductClick = (product: Product) => {
    // Vérifier le stock avant d'ajouter au panier
    if (product.stock <= 0) {
      toast.error("Produit indisponible", "Ce produit est en rupture de stock");
      return;
    }

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
    setCart((currentCart) => {
      if (newQuantity <= 0) {
        return currentCart.filter((item) => item.id !== cartItemId);
      }
      return currentCart.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: item.unitPrice * newQuantity,
            }
          : item,
      );
    });
  };
  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleInitiateCheckout = () => {
    setIsCartOpen(false);
    localStorage.setItem("isCheckoutFlow", "true");
    if (contact) {
      setIsCheckoutOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleConfirmOrder = (
    customerInfo: { name: string; email: string; address: string },
    paymentMethod: CustomerPaymentMethod,
  ) => {
    // Validation du paymentMethod - comparer avec les valeurs string
    const validPaymentMethods = [
      "CARD",
      "ORANGE_MONEY",
      "WAVE",
      "MOBILE_MONEY",
      "PAYCAAP",
      "PAY_ON_DELIVERY",
      "CUSTOMER_CREDIT",
    ];

    if (!validPaymentMethods.includes(paymentMethod)) {
      toast.error(
        "Méthode de paiement invalide",
        "Veuillez sélectionner une méthode de paiement valide.",
      );
      return;
    }

    const formData = new FormData();
    const orderItemsForJson = cart.map((item) => {
      // Transformer l'objet options en tableau [{optionType, optionValue}]
      const optionsArray = Object.entries(item.options || {}).filter(
        ([, value]) => value,
      ); // S'assurer que la valeur de l'option n'est pas vide

      return {
        productId: item.id,
        quantity: item.quantity,
        options: optionsArray.map(([optionType, optionValue]) => ({
          optionType,
          optionValue,
        })),
      };
    });

    // 2. Ajouter les champs textuels au FormData
    formData.append("customerName", customerInfo.name); // Le backend utilise `customerName`
    formData.append("paymentMethod", paymentMethod);
    formData.append(
      "paymentDueDate",
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ); // Exemple: paiement dans 30 jours
    formData.append("source", "web_order");
    formData.append("items", JSON.stringify(orderItemsForJson)); // Envoyer les articles en tant que chaîne JSON

    // 3. Ajouter tous les fichiers de design sous la même clé 'designFiles'
    cart.forEach((item) => {
      if (item.designFileObject) {
        formData.append("designFiles", item.designFileObject);
      }
    });

    // Log pour debugging
    console.log("Order data being sent:", {
      customerName: customerInfo.name,
      paymentMethod,
      source: "web_order",
      items: orderItemsForJson,
    });

    // Log FormData contents
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    placeOrderMutation(formData);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    const wasInCheckoutFlow = localStorage.getItem("isCheckoutFlow");

    if (wasInCheckoutFlow) {
      setIsCheckoutOpen(true);
      localStorage.removeItem("isCheckoutFlow");
    } else if (contact) {
      navigate({ to: "/account" });
    }
  };

  const handleSelectMainCategory = (category: string) => {
    setSelectedMainCategory(category);
    setSelectedSubcategory("");
  };

  const handleSelectSubcategory = (
    mainCategory: string,
    subcategory: string,
  ) => {
    setSelectedMainCategory(mainCategory);
    setSelectedSubcategory(subcategory);
  };

  const handleSelectAllCategories = () => {
    setSelectedMainCategory("");
    setSelectedSubcategory("");
  };

  const handleWishlistClick = () => {
    setShowFavorites(!showFavorites);
    if (!showFavorites) {
      toast.info("Mes favoris", "Affichage de vos produits favoris");
    }
  };

  const handleLikeProduct = (productId: string) => {
    setLikedProducts((prev) => {
      const newLikes = new Set(prev);
      newLikes.add(productId);
      try {
        window.localStorage.setItem(
          "likedProducts",
          JSON.stringify([...newLikes]),
        );
      } catch (error) {
        console.error("Error saving liked products:", error);
      }
      return newLikes;
    });
    toast.success(
      "Produit ajouté aux favoris!",
      "Le produit a été ajouté à votre liste de souhaits.",
    );
  };

  const handleUnlikeProduct = (productId: string) => {
    setLikedProducts((prev) => {
      const newLikes = new Set(prev);
      newLikes.delete(productId);
      try {
        window.localStorage.setItem(
          "likedProducts",
          JSON.stringify([...newLikes]),
        );
      } catch (error) {
        console.error("Error saving liked products:", error);
      }
      return newLikes;
    });
    toast.info(
      "Produit retiré des favoris",
      "Le produit a été retiré de votre liste de souhaits.",
    );
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    setNewsletterError("");
    setNewsletterSuccess("");
    e.preventDefault();

    if (
      !newsletterEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)
    ) {
      setNewsletterError("Veuillez fournir une adresse e-mail valide.");
      return;
    }
    if (!newsletterConsent) {
      setNewsletterError(
        "Veuillez accepter les conditions pour vous inscrire.",
      );
      return;
    }

    subscribeMutation({ email: newsletterEmail });
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <ECommerceHeader
        dashboardPath="/dashboard"
        currentCustomer={contact}
        onLogin={() => {
          localStorage.removeItem("isCheckoutFlow");
          setIsAuthModalOpen(true);
        }}
        onLogout={onLogout}
        accountPath="/account"
        cartItemCount={cartItemCount}
        likedItemCount={likedProducts.size}
        onWishlistClick={handleWishlistClick}
        onCartClick={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onQuoteRequest={() => setIsQuoteModalOpen(true)}
        onSelectAllCategories={handleSelectAllCategories}
        productHierarchy={PRODUCT_HIERARCHY.filter(
          (cat) => cat.category !== "Matières Premières",
        )}
        onSelectMainCategory={handleSelectMainCategory}
        onSelectSubcategory={handleSelectSubcategory}
      />
      <HeroBanner
        onNavigateToRealisations={onNavigateToRealisations}
        onQuoteRequest={() => setIsQuoteModalOpen(true)}
      />
      <main className="container mx-auto px-4 pt-8 pb-8 ">
        {/* <CategoryShowcase 
                    productHierarchy={PRODUCT_HIERARCHY.filter(cat => cat.category !== 'Matières Premières')}
                    onSelectMainCategory={handleSelectMainCategory}
                    onSelectSubcategory={handleSelectSubcategory}
                /> */}
        <ProductsGrid
          searchTerm={searchTerm}
          selectedMainCategory={selectedMainCategory}
          selectedSubcategory={selectedSubcategory}
          showFavorites={showFavorites}
          likedProducts={likedProducts}
          onAddToCart={handleProductClick}
          onLike={handleLikeProduct}
          onUnlike={handleUnlikeProduct}
          onResetFilters={handleSelectAllCategories}
        />
        {/* Section Info & Conseils */}
        <section className="mt-20 bg-white py-12 lg:py-16 rounded-3xl shadow-sm border border-slate-100">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Imprimerie en ligne rapide et devis immédiat avec CaapMedia
            </h2>
            <h3 className="text-xl font-bold text-[#c6e911] mb-6 uppercase tracking-wide">
              Vos impressions en ligne : conseils d'imprimeur
            </h3>
            <div className="w-24 h-1 bg-slate-200 mx-auto mb-8 rounded-full"></div>

            <p className="text-slate-600 leading-relaxed text-lg max-w-3xl mx-auto mb-8">
              Pour des infos techniques, des astuces ou des conseils sur vos
              choix d'impressions, vous pouvez maintenant consulter nos dossiers
              sur l'imprimerie en ligne. Vous trouverez les informations
              nécessaires pour imprimer vos flyers, affiches, dépliants,
              stickers, pochettes à rabats, menus de restaurants, cartes de
              visite...
            </p>

            {isSeoExpanded && (
              <div className="text-left max-w-4xl mx-auto mt-10 space-y-8 animate-fadeIn text-slate-700">
                <div>
                  <h4 className="text-2xl font-bold text-slate-800 mb-3">
                    Boostez Votre Communication avec CaapMedia : L’Imprimeur en
                    Ligne N°1 au Cameroun !
                  </h4>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-[#c6e911] mb-2">
                    🚀 Impression Grand Format Ultra-Réaliste & PLV Impactante
                  </h5>
                  <p className="leading-relaxed">
                    Kakemonos, roll-ups, akilux, bâches XXL… Préparez vos
                    fichiers comme un pro grâce à nos spécifications techniques
                    ultra-détaillées (gratuites !). Vos visuels seront parfaits
                    du premier coup !
                  </p>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-[#c6e911] mb-2">
                    💥 Devis Instantané + Prix Sans Surprise = Zéro Mauvaise
                    Surprise !
                  </h5>
                  <p className="leading-relaxed">
                    Flyers, gobelets personnalisés, cartes de visite… Le prix
                    affiché est le prix final, aucun frais caché.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-[#c6e911]">
                  <p className="font-semibold">
                    📦 Livraison Express 24h/48h à Douala & Yaoundé – et même
                    gratuite dès 150 000 FCFA en 72h !
                  </p>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-slate-800 mb-2">
                    👀 Inspirez-vous des Créations de Nos Clients
                  </h5>
                  <p className="mb-2">
                    Des milliers d’entreprises nous font déjà confiance :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">
                    <li>
                      ✨ Flyers ultra-colorés, affiches géantes, stickers
                      voiture magnétiques, menus restaurant élégants, sets de
                      table waterproof, dépliants premium, brochures haut de
                      gamme, enveloppes personnalisées…
                    </li>
                  </ul>
                  <p className="mt-2 italic text-sm">
                    → Découvrez leur galerie et tombez sous le charme !
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-bold text-slate-800">
                      🚗 Transformez Votre Voiture en Pub Mobile !
                    </h5>
                    <p className="text-sm mt-1">
                      Stickers voiture résistants aux intempéries : votre marque
                      vous suit partout, 24h/24 !
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">
                      🍽️ Les Restaurateurs Adorent Nos Menus & Sets de Table
                    </h5>
                    <p className="text-sm mt-1">
                      Design chic, impression alimentaire, finition mate ou
                      brillante… Vos clients en redemandent !
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-[#c6e911] mb-2">
                    💪 Une Équipe Jeune, Passionnée & Ultra-Réactive
                  </h5>
                  <p className="leading-relaxed">
                    Chez CaapMedia, on ne vous laisse jamais dans le flou. Un
                    vrai conseiller (et sympa !) vous accompagne du brief
                    jusqu’à la livraison.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h5 className="font-bold text-slate-800 mb-4">
                    Pourquoi Des Milliers de Clients Choisissent CaapMedia Tous
                    les Mois ?
                  </h5>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✅</span> Prix les Plus
                      Bas du Marché (vérifiez par vous-même, on assume !)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✅</span> Qualité
                      professionnelle (machines dernière génération)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✅</span> Livraison
                      éclair : commandé avant 12h30 → livré dès le lendemain !
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✅</span>{" "}
                      Personnalisation en Ligne Ultra-Simple – zéro Photoshop
                      requis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✅</span> Des centaines
                      de modèles gratuits par secteur (restauration, immobilier,
                      événementiel, santé…)
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-slate-800 mb-2">
                    Créez en 2 Minutes avec Notre Outil Magique 🎨
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-slate-600">
                    <li>Choisissez un modèle conçu par nos graphistes pros</li>
                    <li>
                      Ou partez d’une page blanche et laissez libre cours à
                      votre créativité
                    </li>
                    <li>Modifiez textes, couleurs, images en quelques clics</li>
                  </ol>
                  <p className="mt-2 font-semibold">
                    → Votre fichier prêt à imprimer en un rien de temps !
                  </p>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-slate-800 mb-2">
                    L’Histoire CaapMedia : Née en 2016 à Douala, Toujours Plus
                    Forte !
                  </h5>
                  <p className="leading-relaxed">
                    Un atelier moderne de plus de 25 personnes passionnées, des
                    machines de pointe, une logistique rodée… Tout est fait
                    maison pour vous offrir le meilleur rapport
                    qualité/prix/délai du Cameroun. Chaque année, on repousse
                    les limites :
                    <span className="font-semibold block mt-1">
                      🆕 Impression de stands parapluie, bâches micro-perforées,
                      vernis sélectif, formats hors-standard…
                    </span>
                    Parce que prix bas ne doit jamais rimer avec créativité
                    bridée !
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <h6 className="font-bold text-red-600">🔥 Mode EXPRESS</h6>
                    <p className="text-sm">
                      Prix discount + livraison J+1 (gratuite à Douala/Yaoundé
                      dès 150 000 FCFA)
                    </p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <h6 className="font-bold text-green-600">
                      💰 Mode SUPER ÉCO
                    </h6>
                    <p className="text-sm">
                      Prix encore plus bas pour une livraison en quelques jours
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-[#c6e911] mb-2">
                    On Est Là pour Vous… Vraiment !
                  </h5>
                  <p>
                    Appelez-nous → un vrai humain (pas de robot !) répond en
                    direct depuis nos bureaux.
                  </p>
                  <p>
                    Discutez avec nous sur Facebook, Instagram, Twitter ou
                    WhatsApp : réponse en quelques minutes garantie.
                  </p>
                </div>

                <div className="text-center bg-slate-800 text-white p-6 rounded-xl">
                  <h5 className="text-xl font-bold mb-2">
                    Prêt à faire décoller votre com’ à prix mini ?
                  </h5>
                  <p className="mb-4">
                    👉 Naviguez dès maintenant, obtenez votre devis en 3 clics
                    et laissez CaapMedia transformer vos idées en supports qui
                    claquent !
                  </p>
                  <p className="text-sm text-slate-400">
                    CaapMedia – L’impression pas chère qui fait la différence
                    depuis 2016.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-400 font-semibold">
                  <span>#ImpressionPasChère</span>
                  <span>#Douala</span>
                  <span>#Yaoundé</span>
                  <span>#CommunicationMaline</span>
                  <span>#ImprimerieCameroun</span>
                  <span>#MediaCameroun</span>
                  <span>#PrintCameroon</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSeoExpanded(!isSeoExpanded)}
              className="group inline-flex items-center gap-2 font-bold text-slate-800 hover:text-[#c6e911] transition-colors text-lg border-b-2 border-transparent hover:border-[#c6e911] pb-1 mt-8"
            >
              <span>{isSeoExpanded ? "Lire moins" : "Lire plus"}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-5 h-5 transition-transform duration-300 ${isSeoExpanded ? "-rotate-90" : "group-hover:translate-x-1"}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isSeoExpanded
                      ? "M5 15l7-7 7 7"
                      : "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  }
                />
              </svg>
            </button>
          </div>
        </section>

        {/* Newsletter & Features Section (Revised with 3 images) */}
        <section className="bg-slate-100 mt-16 rounded-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side: Text & Form */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 bg-slate-100 flex flex-col justify-center order-2 lg:order-1">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Bienvenue sur notre liste de diffusion.
              </h2>
              <p className="font-semibold text-slate-700 mb-6">
                Profitez de -15% sur votre commande en vous inscrivant à notre
                newsletter
              </p>

              <div className="space-y-4 max-w-lg">
                <input
                  type="email"
                  placeholder="Votre adresse e-mail"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white ${newsletterError ? "border-red-500 ring-red-500" : "border-slate-300 focus:ring-[#c6e911]"}`}
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterError) setNewsletterError("");
                    if (newsletterSuccess) setNewsletterSuccess("");
                  }}
                />
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="newsletter-consent"
                    className="mt-1 h-4 w-4 text-[#c6e911] focus:ring-[#c6e911] border-gray-300 rounded"
                    checked={newsletterConsent}
                    onChange={(e) => {
                      setNewsletterConsent(e.target.checked);
                      if (newsletterError) setNewsletterError("");
                      if (newsletterSuccess) setNewsletterSuccess("");
                    }}
                  />
                  <label
                    htmlFor="newsletter-consent"
                    className="text-xs text-slate-600"
                  >
                    Oui, je souhaite recevoir des offres spéciales par e-mail de
                    la part de CaapMedia, ainsi que des informations sur les
                    produits, les services et mes créations en cours.
                  </label>
                </div>
                <button
                  onClick={handleNewsletterSubmit}
                  disabled={isSubscribing}
                  className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-md transition-colors w-full sm:w-auto disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? "Envoi en cours..." : "Envoyer"}
                </button>
                {newsletterError && (
                  <p className="text-sm text-red-600 font-semibold">
                    {newsletterError}
                  </p>
                )}
                {newsletterSuccess && (
                  <p className="text-sm text-green-600 font-semibold">
                    {newsletterSuccess}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side: Image Grid */}
            <div className="w-full lg:w-1/2 grid grid-cols-3 h-64 lg:h-auto order-1 lg:order-2">
              {/* Image 1: Woman with T-Shirt Logo */}
              <div className="relative h-full overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=2787&auto=format&fit=crop"
                  alt="Cliente satisfaite T-shirt"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {/* Logo Overlay on Shirt */}
                <div className="absolute top-[65%] left-[50%] -translate-x-1/2 w-10 md:w-12 opacity-90 mix-blend-multiply pointer-events-none">
                  <IconGmoLogo className="w-full h-full drop-shadow-sm" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Image 2: Man with Cap Logo */}
              <div className="relative h-full overflow-hidden group border-l border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=2787&auto=format&fit=crop"
                  alt="Client satisfait Casquette"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {/* Logo Overlay on Phone/Case or simulated cap area if possible, hard to place on dynamic image without specific cap coordinates. 
                                        Ideally we'd find a cap image, but this portrait is strong. 
                                        Let's place a small branding near the bottom or on accessory. 
                                     */}
                <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-8 md:w-10 opacity-80 mix-blend-screen pointer-events-none">
                  {/* Simulating logo on forehead/cap area if image allows, or just branding watermark style */}
                  <IconGmoLogo className="w-full h-full drop-shadow-md" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Image 3: Happy Client */}
              <div className="relative h-full overflow-hidden group border-l border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2670&auto=format&fit=crop"
                  alt="Client professionnel"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Features text part */}
          <div className="bg-white">
            <div className="container mx-auto px-6 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-4">
                    CaapMedia, imprimerie en ligne au service des petites
                    entreprises depuis 2016.
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Le service d'impression en ligne de CaapMedia aide des
                    milliers de dirigeants de TPE-PME à promouvoir leurs
                    activités professionnelles avec des supports imprimés de
                    haute qualité, des outils de marketing numériques et un
                    service de conception graphique. Notre site web a été conçu
                    pour vous aider à trouver les produits personnalisés dont
                    vous avez besoin pour créer une image de marque qui vous
                    ressemble et atteindre vos objectifs : cartes de visite,
                    flyers, objets publicitaires, etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-4">
                    Personnalisation facile
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Grâce à nos outils intuitifs, le processus de création est
                    aussi simple et clair que possible, et nous cherchons
                    constamment à améliorer votre expérience.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-4">
                    Graphismes assortis
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Nos graphismes peuvent être utilisés sur une large gamme de
                    produits imprimés : vous pouvez ainsi créer une image de
                    marque professionnelle et homogène.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ECommerceFooter
        onNavigateToRealisations={onNavigateToRealisations}
        onSelectMainCategory={handleSelectMainCategory}
        onContactClick={handleContactClick}
      />

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
            const quoteData = {
              leadName: data.name,
              company: data.company,
              email: data.email,
              phone: data.phone,
              description: data.description,
            };
            quoteRequestMutation(quoteData);
          }}
        />
      )}
      {isContactModalOpen && (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ECommercePage;
