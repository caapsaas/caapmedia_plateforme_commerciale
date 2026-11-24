import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFavoriteProducts,
  getProducts,
} from "../../services/apiE-commerce/apiProducts";
import { Product } from "../../types";
import { PRODUCT_HIERARCHY } from "../../constants";
import { useI18n } from '../../i18n';
import { useClientPagination } from '../../hooks/useClientPagination';
import Pagination from '../common/Pagination';
import ProductCard from "../ecommerce/ProductCard";

interface Props {
  searchTerm: string;
  selectedMainCategory: string;
  selectedSubcategory: string;
  showFavorites: boolean;
  likedProducts: Set<string>;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onResetFilters: () => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductsGrid({
  searchTerm,
  selectedMainCategory,
  selectedSubcategory,
  showFavorites,
  likedProducts,
  onLike,
  onUnlike,
  onResetFilters,
  onViewDetails,
}: Props) {
  const { t } = useI18n();
  const pageSize = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm.trim());

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const categories = selectedSubcategory
    ? [selectedSubcategory]
    : PRODUCT_HIERARCHY.find((group) => group.category === selectedMainCategory)
        ?.subcategories.map((category) => category.name) ?? [];
  const filterKey = JSON.stringify([selectedMainCategory, selectedSubcategory, showFavorites, debouncedSearchTerm]);
  const [catalogPage, setCatalogPage] = useState({ filterKey, page: 1 });
  const page = catalogPage.filterKey === filterKey ? catalogPage.page : 1;
  const changePage = (nextPage: number) => setCatalogPage({ filterKey, page: nextPage });
  const showCatalog = !showFavorites;

  const { isLoading, data: pageData } = useQuery({
    queryKey: ['products', page, categories, debouncedSearchTerm],
    queryFn: () => getProducts(page, categories, debouncedSearchTerm),
    enabled: showCatalog,
  });

  const { data: favoriteProducts = [] } = useQuery<Product[]>({
    queryKey: ["favorites", [...likedProducts]],
    queryFn: () => getFavoriteProducts([...likedProducts]),
    enabled: showFavorites && likedProducts.size > 0,
  });

  const { pageItems, meta, setPage } = useClientPagination<Product>(favoriteProducts);
  const visibleProducts = showCatalog ? (pageData ?? []).slice(0, pageSize) : pageItems;
  const hasMore = showCatalog && (pageData?.length ?? 0) > pageSize;
  const loading = showCatalog && isLoading;

  return (
    <div id="products-grid" className="mt-12 scroll-mt-36">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Skeleton premier chargement */}
        {loading &&
          Array.from({ length: pageSize }).map((_, i) => (
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
        {!loading &&
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isLiked={likedProducts.has(product.id)}
              onLike={onLike}
              onUnlike={onUnlike}
              onViewDetails={onViewDetails}
            />
          ))}

        {!loading && visibleProducts.length === 0 && (
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

      {!loading && showCatalog && (page > 1 || hasMore) && (
        <nav className="mt-8 flex items-center justify-center gap-4">
          <button type="button" className="rounded-md border px-4 py-2 disabled:opacity-40" disabled={page === 1} onClick={() => changePage(page - 1)}>
            {t('common.previous')}
          </button>
          <span aria-current="page">{page}</span>
          <button type="button" className="rounded-md border px-4 py-2 disabled:opacity-40" disabled={!hasMore} onClick={() => changePage(page + 1)}>
            {t('common.next')}
          </button>
        </nav>
      )}
      {!loading && !showCatalog && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
