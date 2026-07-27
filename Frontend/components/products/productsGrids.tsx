import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFavoriteProducts,
  getProducts,
  getProduitsSearch,
} from "../../services/apiE-commerce/apiProducts";
import { Product } from "../../types";
import { PRODUCT_HIERARCHY } from "../../constants";
import ProductCard from "../ecommerce/ProductCard";

interface Props {
  searchTerm: string;
  selectedMainCategory: string;
  selectedSubcategory: string;
  showFavorites: boolean;
  likedProducts: Set<string>;
  onAddToCart: (product: Product) => void;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onResetFilters: () => void;
}

export default function ProductsGrid({
  searchTerm,
  selectedMainCategory,
  selectedSubcategory,
  showFavorites,
  likedProducts,
  onAddToCart,
  onLike,
  onUnlike,
  onResetFilters,
}: Props) {
  const [page, setPage] = useState(1);
  const [allLoaded, setAllLoaded] = useState<Product[]>([]);

  // Le catalogue n'a plus qu'un seul niveau de catégorie côté backend (Chantier 1) —
  // ce mapping sert uniquement à filtrer côté client quand une catégorie principale
  // (sans sous-catégorie précise) est sélectionnée dans le sélecteur du site vitrine.
  const subCategoryToMainCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    PRODUCT_HIERARCHY.forEach((mainCat) => {
      mainCat.subcategories.forEach((subCat) => {
        map[subCat.name] = mainCat.category;
      });
    });
    return map;
  }, []);

  // Réinitialise la pagination et les produits chargés quand la catégorie change
  useEffect(() => {
    setPage(1);
    setAllLoaded([]);
  }, [selectedMainCategory, selectedSubcategory]);

  const {
    isLoading,
    isFetching,
    data: pageData,
  } = useQuery<Product[]>({
    queryKey: ["products", page, selectedMainCategory, selectedSubcategory],
    queryFn: () => getProducts(page, selectedSubcategory || undefined),
  });

  const { data: searchData, isLoading: searchLoading } = useQuery<Product[]>({
    queryKey: ["productsSearch", searchTerm, selectedMainCategory, selectedSubcategory],
    queryFn: () => getProduitsSearch(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const { data: favoriteProducts = [] } = useQuery<Product[]>({
    queryKey: ["favorites", [...likedProducts]],
    queryFn: () => getFavoriteProducts([...likedProducts]),
    enabled: showFavorites && likedProducts.size > 0,
  });

  // Accumule les produits page par page
  useEffect(() => {
    if (!pageData) return;
    if (page === 1) {
      setAllLoaded(pageData.slice(0, 8));
    } else {
      setAllLoaded((prev) => [...prev, ...pageData.slice(0, 8)]);
    }
  }, [pageData, page]);

  const hasMore = (pageData?.length ?? 0) === 9;

  const isLoadingFirst = isLoading && page === 1;
  const isLoadingMore = isFetching && page > 1;

  let filtered: Product[] = [];

  if (showFavorites) {
    filtered = favoriteProducts ?? [];
  } else if (searchTerm.length > 0) {
    // Filtre les résultats de recherche par catégorie si une catégorie est sélectionnée
    filtered = (searchData ?? []).filter((p) => {
      if (selectedSubcategory) return p.category === selectedSubcategory;
      if (selectedMainCategory) return subCategoryToMainCategoryMap[p.category] === selectedMainCategory;
      return true;
    });
  } else if (selectedMainCategory && !selectedSubcategory) {
    // Le backend ne connaît que la catégorie fine (Chantier 1) — filtre client
    // pour une sélection au niveau de la catégorie principale uniquement.
    filtered = allLoaded.filter((p) => subCategoryToMainCategoryMap[p.category] === selectedMainCategory);
  } else {
    // Le backend a déjà filtré par catégorie (fine), on affiche tel quel
    filtered = allLoaded;
  }

  const handleLoadMore = () => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  };

  return (
    <div className="mt-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Skeleton premier chargement */}
        {(isLoadingFirst || searchLoading) &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] w-full bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2" />
                <div className="h-8 bg-slate-200 animate-pulse rounded w-full mt-4" />
              </div>
            </div>
          ))}

        {/* Produits */}
        {!isLoadingFirst &&
          !searchLoading &&
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isLiked={likedProducts.has(product.id)}
              onLike={onLike}
              onUnlike={onUnlike}
            />
          ))}

        {/* Skeleton "load more" */}
        {isLoadingMore &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`more-${i}`}
              className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] w-full bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2" />
                <div className="h-8 bg-slate-200 animate-pulse rounded w-full mt-4" />
              </div>
            </div>
          ))}

        {/* Empty state */}
        {!isLoadingFirst && !searchLoading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {showFavorites
                ? "Aucun favori pour l'instant"
                : selectedMainCategory || selectedSubcategory
                  ? "Aucun produit dans cette catégorie"
                  : "Aucun produit trouvé"}
            </h3>
            <p className="text-slate-500 max-w-sm">
              {showFavorites
                ? "Ajoutez des produits à vos favoris en cliquant sur le ♡"
                : selectedMainCategory || selectedSubcategory
                  ? "Essayez une autre catégorie ou consultez tous nos produits."
                  : "Essayez de modifier vos filtres ou votre recherche."}
            </p>
            {(selectedMainCategory || selectedSubcategory) && !showFavorites && (
              <button
                onClick={onResetFilters}
                className="mt-4 px-6 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-full hover:bg-[#adc40f] transition-colors"
              >
                Voir tous les produits
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoadingFirst && !searchLoading && filtered.length > 0 && (
        <div className="mt-14 flex flex-col items-center gap-4">
          {hasMore && !showFavorites && !searchTerm ? (
            <button
              onClick={handleLoadMore}
              disabled={isFetching}
              className="group relative bg-[#c6e911] inline-flex items-center gap-3 px-10 py-2 text-gray-800 font-semibold rounded-full hover:bg-[#c6e000] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {isFetching && !searchTerm ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Chargement...
                </>
              ) : (
                <>
                  Voir plus de produits
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
