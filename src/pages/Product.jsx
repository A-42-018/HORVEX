import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Container, Price, Skeleton } from "../components/common";
import { BuyActions, ProductGallery, ProductTabs, QuantityStepper, RecentlyViewed, RelatedProducts, StickyBuyBar, StockLine, TrustRow, VariantPicker } from "../components/product";
import { useProduct, useProductReviews } from "../hooks/useCatalog";
import { useSiteSettings } from "../hooks/useContent";
import { MAX_QTY_PER_LINE } from "../store/cart";
import { useRecentlyViewed } from "../store/recentlyViewed";
import { strings } from "../lib/strings";
import { EVENTS, track } from "../lib/analytics";
import { breadcrumbLd, productLd } from "../lib/seo";
import { JsonLd, SITE_URL, Seo } from "../components/seo";
import NotFound from "./NotFound";

// PDP shell. Gallery is B14a/B14b; buy box fills in across B15a (variants/stock,
// here), B15b (buy actions) and B15c (sticky bar); tabs (B16a, below the grid), related + recent (B16c)
// slot in below. `selected` lives here (not inside BuyBox) so the gallery can
// jump to the variant's image alongside the price/stock line updating.
function BuyBox({ product, selected, onSelect, qty, onQtyChange, orderRef }) {
  const { name, price, compare_at_price: compareAt, low_stock_at: lowStockAt, variants = [] } = product;
  const stock = selected ? selected.stock : product.stock;
  const maxQty = Math.max(0, Math.min(MAX_QTY_PER_LINE, stock));
  const displayPrice = selected?.price_override ?? price;

  return (
    <div className="mt-8 flex flex-col gap-5 lg:mt-0">
      <h1 className="text-h2">{name}</h1>
      <Price amount={displayPrice} compareAt={variants.length ? undefined : compareAt} size="lg" />

      <VariantPicker variants={variants} selected={selected} onSelect={onSelect} name={name} />

      <div className="flex flex-col gap-2">
        <p className="text-small font-medium text-fg">{strings.product.quantity}</p>
        <QuantityStepper qty={qty} onChange={onQtyChange} maxQty={Math.max(1, maxQty)} disabled={maxQty < 1} />
      </div>

      <StockLine stock={stock} lowStockAt={lowStockAt} />

      <BuyActions product={product} selected={selected} qty={qty} inStock={maxQty > 0} orderRef={orderRef} />
      <TrustRow />
    </div>
  );
}

// Home › Shop › Category › Product, for BreadcrumbList.
const productCrumbs = (product) => [
  { name: strings.listing.shop, path: "/shop" },
  ...(product.category ? [{ name: product.category.name, path: `/category/${product.category.slug}` }] : []),
  { name: product.name, path: `/product/${product.slug}` },
];

function ProductDetail({ product }) {
  const { variants = [] } = product;
  const [selected, setSelected] = useState(() => variants.find((v) => v.stock > 0) ?? variants[0] ?? null);
  const [qty, setQty] = useState(1);
  const orderRef = useRef(null);
  const inStock = (selected ? selected.stock : product.stock) > 0;
  const addRecent = useRecentlyViewed((s) => s.add);
  const { data: settings } = useSiteSettings();
  // Same cached query as the Reviews tab; feeds AggregateRating.
  const { data: rating } = useProductReviews(product.id);

  // Remember this watch for the "Recently viewed" strip (survives refresh via persist).
  useEffect(() => addRecent(product.id), [addRecent, product.id]);

  // view_item once per product (the ref also survives StrictMode's effect replay).
  const { id, name, price, category } = product;
  const viewed = useRef(null);
  useEffect(() => {
    if (viewed.current === id) return;
    viewed.current = id;
    track(EVENTS.viewItem, { item_id: id, item_name: name, item_category: category?.name, price });
  }, [id, name, price, category?.name]);

  const selectVariant = (variant) => {
    setSelected(variant);
    setQty((q) => Math.min(q, Math.max(1, Math.min(MAX_QTY_PER_LINE, variant.stock))));
  };

  return (
    <>
      <Seo
        title={product.seo_title || product.name}
        description={product.seo_desc || product.short_desc || product.description}
        image={product.images[0]?.url}
        path={`/product/${product.slug}`}
        product={{ price: product.price }}
      />
      <JsonLd data={productLd(product, { siteUrl: SITE_URL, settings, rating })} />
      <JsonLd data={breadcrumbLd(productCrumbs(product), SITE_URL)} />
      <Container className="py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <ProductGallery
            key={product.id}
            images={product.images}
            name={product.name}
            activeImageId={selected?.image_id ?? null}
          />
          <BuyBox product={product} selected={selected} onSelect={selectVariant} qty={qty} onQtyChange={setQty} orderRef={orderRef} />
        </div>
        <ProductTabs key={product.id} product={product} />
        <RelatedProducts key={`related-${product.id}`} product={product} />
        <RecentlyViewed currentId={product.id} />
      </Container>
      <StickyBuyBar product={product} selected={selected} qty={qty} inStock={inStock} orderRef={orderRef} />
    </>
  );
}

function Product() {
  const { slug } = useParams();
  const { data: product, isPending, isError, refetch } = useProduct(slug);

  if (isPending) {
    return (
      <Container className="py-8 lg:py-12">
        <Skeleton className="aspect-[4/5] w-full max-w-xl rounded-card" />
      </Container>
    );
  }
  if (isError) {
    return (
      <Container className="py-section-sm text-center">
        <p className="text-body text-muted">{strings.data.loadError}</p>
        <button type="button" onClick={() => refetch()} className="mt-4 text-nav font-semibold underline underline-offset-4">
          {strings.data.retry}
        </button>
      </Container>
    );
  }
  if (!product) return <NotFound />;

  // Keyed so the picked variant and qty reset when moving to another cached PDP.
  return <ProductDetail key={product.id} product={product} />;
}

export default Product;
