import { Link, useParams, useSearchParams } from "react-router";
import { ChevronLeft, Printer } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { useSiteSettings } from "../../hooks/useContent";
import { strings } from "../strings";
import { InvoiceSheet, PackingSheet } from "../components/orders/PrintSheet";
import { isOrderId, readDoc } from "../components/orders/orderPrint";
import { useAdminOrder } from "../hooks/useAdminOrders";

const d = strings.admin.orders.detail;
const t = d.print;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

// Printable invoice / packing slip. Lives outside AdminLayout (no sidebar), and
// always on the light tokens so the sheet is ink on white whichever admin theme is on.
function Frame({ children }) {
  return <div className="section-ivory min-h-dvh px-gutter py-6 print:min-h-0 print:bg-transparent print:p-0">{children}</div>;
}

function BackLink({ to, children }) {
  return (
    <Link to={to} className={`inline-flex min-h-11 w-fit items-center gap-1 rounded-control text-small text-muted hover:text-brand ${focusRing}`}>
      <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} />
      {children}
    </Link>
  );
}

function OrderPrint() {
  const { orderId } = useParams();
  const [params, setParams] = useSearchParams();
  const doc = readDoc(params.get("doc"));
  const validId = isOrderId(orderId);
  const order = useAdminOrder(validId ? orderId : null);
  const settings = useSiteSettings();

  if (validId && order.isPending) {
    return (
      <Frame>
        <div aria-busy="true" aria-label={strings.admin.checking} className="mx-auto flex max-w-[210mm] flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </Frame>
    );
  }

  if (validId && order.isError && !order.data) {
    return (
      <Frame>
        <div className="mx-auto flex max-w-[210mm] flex-col gap-4">
          <BackLink to="/admin/orders">{d.back}</BackLink>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-small text-danger">{d.error}</p>
            <Button variant="secondary" size="sm" onClick={() => order.refetch()}>
              {strings.admin.orders.retry}
            </Button>
          </div>
        </div>
      </Frame>
    );
  }

  if (!validId || !order.data) {
    return (
      <Frame>
        <div className="mx-auto flex max-w-[210mm] flex-col gap-4">
          <title>{`${d.notFound} | WRISTORY Admin`}</title>
          <BackLink to="/admin/orders">{d.back}</BackLink>
          <Card className="flex flex-col gap-2 px-6 py-12 text-center">
            <h1 className="text-title text-fg">{d.notFound}</h1>
            <p className="text-small text-muted">{d.notFoundBody}</p>
          </Card>
        </div>
      </Frame>
    );
  }

  const data = order.data;
  const Sheet = doc === "packing" ? PackingSheet : InvoiceSheet;
  const choose = (next) => setParams(next === "invoice" ? {} : { doc: next }, { replace: true });

  return (
    <Frame>
      {/* The page title becomes the file name when saving as PDF. */}
      <title>{t.docTitle[doc](data.order_number)}</title>
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-col gap-3 print:hidden">
        <BackLink to={`/admin/orders/${data.id}`}>{t.back}</BackLink>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t.toggle} className="flex gap-2">
            {["invoice", "packing"].map((kind) => (
              <Button
                key={kind}
                size="sm"
                variant={doc === kind ? "primary" : "secondary"}
                aria-pressed={doc === kind}
                onClick={() => choose(kind)}
              >
                {t[kind]}
              </Button>
            ))}
          </div>
          <Button size="sm" className="sm:ml-auto" disabled={settings.isPending} onClick={() => window.print()}>
            <Printer aria-hidden="true" size={18} strokeWidth={1.5} />
            {t.print}
          </Button>
        </div>
        <p className="text-small text-muted">{t.hint}</p>
      </div>
      <Sheet order={data} settings={settings.data} />
    </Frame>
  );
}

export default OrderPrint;
