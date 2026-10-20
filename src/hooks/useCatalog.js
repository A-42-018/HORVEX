import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../services/queryKeys";
import {
  SEARCH_MIN_CHARS,
  getProduct,
  getProductsByIds,
  listProductReviews,
  listProducts,
  listRelatedProducts,
  searchProducts,
  summarizeRatings,
} from "../services/products";
import {
  getCategory,
  getCollection,
  listCategories,
  listCollectionProducts,
  listCollections,
} from "../services/categories";

// Catalog reads. Products use the default 60s staleTime (stock and prices
// change); categories and collections change rarely.
const RARELY_CHANGES = 5 * 60_000;

/** { items, total } for a filter object (see listProducts). Keeps the old page while a new filter loads. */
export function useProducts(filters = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => listProducts(filters),
    placeholderData: keepPreviousData,
  });
}

/** Product for the PDP; `data` is null when it doesn't exist or isn't active. */
export function useProduct(slug) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  });
}

/** Products in the given id order (wishlist, recently viewed). Missing/inactive ids are dropped. */
export function useProductsByIds(ids) {
  return useQuery({
    queryKey: queryKeys.products.byIds(ids),
    queryFn: () => getProductsByIds(ids),
    enabled: ids.length > 0,
    placeholderData: ids.length ? keepPreviousData : [],
  });
}

/** { items, total }: other watches to suggest on a PDP (same category, then same gender). */
export function useRelatedProducts(product, limit = 4) {
  return useQuery({
    queryKey: queryKeys.products.related(product?.id, limit),
    queryFn: () => listRelatedProducts(product, limit),
    enabled: Boolean(product),
  });
}

/** Instant search results for a (debounced) term. Idle until the term has enough characters. */
export function useProductSearch(term, limit = 6) {
  const clean = term.trim();
  return useQuery({
    queryKey: queryKeys.products.search(clean, limit),
    queryFn: () => searchProducts(clean, limit),
    enabled: clean.length >= SEARCH_MIN_CHARS,
    placeholderData: keepPreviousData,
  });
}

/** Approved reviews plus { average, count }. */
export function useProductReviews(productId) {
  return useQuery({
    queryKey: queryKeys.products.reviews(productId),
    queryFn: () => listProductReviews(productId),
    enabled: Boolean(productId),
    select: (reviews) => ({ reviews, ...summarizeRatings(reviews) }),
  });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories.list(), queryFn: listCategories, staleTime: RARELY_CHANGES });
}

export function useCategory(slug) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
    staleTime: RARELY_CHANGES,
  });
}

export function useCollections() {
  return useQuery({ queryKey: queryKeys.collections.list(), queryFn: listCollections, staleTime: RARELY_CHANGES });
}

export function useCollection(slug) {
  return useQuery({
    queryKey: queryKeys.collections.detail(slug),
    queryFn: () => getCollection(slug),
    enabled: Boolean(slug),
    staleTime: RARELY_CHANGES,
  });
}

/** Products of a loaded collection row (manual order or rules). */
export function useCollectionProducts(collection, options = {}) {
  return useQuery({
    queryKey: queryKeys.collections.products(collection?.slug, options),
    queryFn: () => listCollectionProducts(collection, options),
    enabled: Boolean(collection),
    placeholderData: keepPreviousData,
  });
}
