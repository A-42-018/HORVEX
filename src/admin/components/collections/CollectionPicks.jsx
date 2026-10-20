import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button, IconButton, Input } from "../../../components/common";
import { formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { moveRow } from "../categories/categoryForm";

const t = strings.admin.collections.picks;
// The storefront loads a hand-picked list in one request, so keep it modest.
export const MAX_PICKS = 60;
const SHOWN = 8;

function Thumb({ product }) {
  return (
    <div className="aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-control border border-line bg-surface">
      {product.thumb ? (
        <img src={product.thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="sr-only">{t.noImage}</span>
      )}
    </div>
  );
}

const statusTag = (product) => product.status !== "active" && <span className="text-small text-warning"> · {t.draftTag(product.status)}</span>;

/** Ordered list of hand-picked watches + a search to add more. `initial` is read once; `onChange(list)` gets every edit. */
export default function CollectionPicks({ initial, onChange }) {
  const [picked, setPicked] = useState(initial);
  const [term, setTerm] = useState("");
  const [notice, setNotice] = useState("");
  const catalog = useAdminProducts();

  const update = (next) => {
    setPicked(next);
    onChange(next);
  };

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q || !catalog.data) return [];
    const taken = new Set(picked.map((p) => p.id));
    return catalog.data.items
      .filter((p) => !taken.has(p.id) && (p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)))
      .slice(0, 50);
  }, [term, catalog.data, picked]);

  const add = (product) => {
    if (picked.length >= MAX_PICKS) return setNotice(t.max(MAX_PICKS));
    setNotice("");
    update([...picked, { id: product.id, name: product.name, slug: product.slug, status: product.status, price: product.price, thumb: product.thumb }]);
  };

  const move = (id, delta) => {
    const next = moveRow(picked, id, delta);
    if (next === picked) return;
    const name = picked.find((p) => p.id === id).name;
    setNotice(t.moved(name, next.findIndex((p) => p.id === id) + 1, next.length));
    update(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-muted">{t.hint}</p>
      <p role="status" className="sr-only">
        {notice}
      </p>

      {picked.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-small text-muted">{t.empty}</p>
      ) : (
        <ol className="divide-y divide-line rounded-card border border-line">
          {picked.map((product, index) => (
            <li key={product.id} className="flex items-center gap-2 p-2">
              <div className="flex shrink-0 flex-col">
                <IconButton label={t.up(product.name)} variant="ghost" className="h-9 w-9" disabled={index === 0} onClick={() => move(product.id, -1)}>
                  <ArrowUp aria-hidden="true" size={16} strokeWidth={1.5} />
                </IconButton>
                <IconButton label={t.down(product.name)} variant="ghost" className="h-9 w-9" disabled={index === picked.length - 1} onClick={() => move(product.id, 1)}>
                  <ArrowDown aria-hidden="true" size={16} strokeWidth={1.5} />
                </IconButton>
              </div>
              <Thumb product={product} />
              <p className="min-w-0 flex-1 text-small text-fg">
                <span className="block truncate font-semibold">{product.name}</span>
                <span className="text-muted">{formatTaka(product.price)}</span>
                {statusTag(product)}
              </p>
              <IconButton label={t.removeItem(product.name)} variant="ghost" onClick={() => update(picked.filter((p) => p.id !== product.id))}>
                <X aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
            </li>
          ))}
        </ol>
      )}

      <Input label={t.search} hint={t.searchHint} type="search" value={term} onChange={(event) => setTerm(event.target.value)} autoComplete="off" />
      {catalog.isPending && <p className="text-small text-muted">{t.catalogLoading}</p>}
      {catalog.isError && (
        <p role="alert" className="text-small text-danger">
          {t.catalogError}
        </p>
      )}
      {term.trim() && catalog.data && (
        <div>
          <p role="status" className="mb-2 text-small text-muted">
            {matches.length ? t.results(matches.length) : t.noMatch}
          </p>
          <ul className="divide-y divide-line rounded-card border border-line">
            {matches.slice(0, SHOWN).map((product) => (
              <li key={product.id} className="flex items-center gap-3 p-2">
                <Thumb product={product} />
                <p className="min-w-0 flex-1 text-small text-fg">
                  <span className="block truncate font-semibold">{product.name}</span>
                  <span className="text-muted">{formatTaka(product.price)}</span>
                  {statusTag(product)}
                </p>
                <Button size="sm" variant="secondary" className="gap-1" aria-label={t.add(product.name)} onClick={() => add(product)}>
                  <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
                  {t.addLabel}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
