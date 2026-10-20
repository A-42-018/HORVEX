import { Button, Modal } from "../../../components/common";
import { strings } from "../../strings";
import { useProductsInOrders, useRemoveProducts } from "../../hooks/useAdminProducts";

const t = strings.admin.products.remove;
const MAX_NAMES = 6;

function NameList({ heading, products }) {
  if (!products.length) return null;
  const shown = products.slice(0, MAX_NAMES);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-badge text-muted">{heading}</p>
      <ul className="flex flex-col gap-1 text-small text-fg">
        {shown.map((product) => (
          <li key={product.id} className="truncate">
            {product.name}
          </li>
        ))}
        {products.length > shown.length && <li className="text-muted">{t.more(products.length - shown.length)}</li>}
      </ul>
    </div>
  );
}

/**
 * Confirms removing products. Products in past orders are archived, the rest
 * deleted; the dialog checks orders first and says which happens to which.
 * `onDone({ deleted, archived })` runs after a successful removal.
 */
function ProductRemoveDialog({ products, open, onClose, onDone }) {
  const ids = products.map((product) => product.id);
  const inOrders = useProductsInOrders(ids, { enabled: open });
  const remove = useRemoveProducts();

  const ordered = new Set(inOrders.data ?? []);
  const toArchive = products.filter((product) => ordered.has(product.id));
  const toDelete = products.filter((product) => !ordered.has(product.id));
  const ready = inOrders.isSuccess;

  const close = () => {
    if (remove.isPending) return;
    remove.reset();
    onClose();
  };

  // A promise, not mutate's callbacks: the page under the dialog may unmount
  // first (the editor's product refetches as "not found").
  const confirm = () =>
    remove
      .mutateAsync(products)
      .then((result) => onDone?.(result))
      .catch(() => {}); // remove.isError shows the message

  return (
    <Modal
      open={open}
      onClose={close}
      title={t.title(products.length)}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={close} disabled={remove.isPending}>
            {t.cancel}
          </Button>
          <Button variant="danger" size="sm" onClick={confirm} loading={remove.isPending} disabled={!ready}>
            {remove.isPending ? t.working : t.confirm(toDelete.length, toArchive.length)}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" aria-live="polite">
        {inOrders.isPending && <p className="text-small text-muted">{t.checking}</p>}
        {inOrders.isError && (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-small text-danger">{t.checkFailed}</p>
            <Button variant="secondary" size="sm" onClick={() => inOrders.refetch()}>
              {strings.admin.products.retry}
            </Button>
          </div>
        )}
        {ready && (
          <>
            {toDelete.length > 0 && <p className="text-small text-fg">{t.deleteNote(toDelete.length)}</p>}
            {toArchive.length > 0 && <p className="text-small text-warning">{t.archiveNote(toArchive.length)}</p>}
            {products.length > 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NameList heading={t.deleteHeading} products={toDelete} />
                <NameList heading={t.archiveHeading} products={toArchive} />
              </div>
            )}
          </>
        )}
        {remove.isError && (
          <p role="alert" className="text-small text-danger">
            {t.failed}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default ProductRemoveDialog;
