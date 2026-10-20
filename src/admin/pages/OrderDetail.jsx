import { Link, useParams } from "react-router";
import { ChevronLeft, FileText, Package } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { formatDateTime } from "../../lib/format";
import { strings } from "../../lib/strings";
import { useAuth } from "../auth/authContext";
import { CustomerCard, ItemsCard, TotalsCard } from "../components/orders/OrderBody";
import OrderActionsCard from "../components/orders/OrderActions";
import OrderHistory from "../components/orders/OrderHistory";
import OrderStatusPanel from "../components/orders/OrderStatusPanel";
import { isOrderId } from "../components/orders/orderPrint";
import { useAdminOrder, useChangeOrderStatus, useOrderHistory } from "../hooks/useAdminOrders";

const t = strings.admin.orders.detail;

function BackLink() {
  return (
    <Link
      to="/admin/orders"
      className="inline-flex min-h-11 w-fit items-center gap-1 rounded-control text-small text-muted hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
    >
      <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} />
      {t.back}
    </Link>
  );
}

function OrderDetail() {
  const { orderId } = useParams();
  const { session } = useAuth();
  const validId = isOrderId(orderId);
  const order = useAdminOrder(validId ? orderId : null);
  const history = useOrderHistory(validId ? orderId : null);
  const mutation = useChangeOrderStatus();

  if (validId && order.isPending) {
    return (
      <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (validId && order.isError && !order.data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => order.refetch()}>
            {strings.admin.orders.retry}
          </Button>
        </div>
      </div>
    );
  }

  if (!validId || !order.data) {
    return (
      <div className="flex flex-col gap-4">
        <title>{`${t.notFound} | WRISTORY Admin`}</title>
        <BackLink />
        <Card className="flex flex-col gap-2 px-6 py-12 text-center">
          <h1 className="text-h3 text-fg">{t.notFound}</h1>
          <p className="text-small text-muted">{t.notFoundBody}</p>
        </Card>
      </div>
    );
  }

  const data = order.data;
  return (
    <div className="flex flex-col gap-6">
      <title>{`${data.order_number} | WRISTORY Admin`}</title>
      <BackLink />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h3 tabular-nums text-fg">{data.order_number}</h1>
          <p className="text-small text-muted">{t.placed(formatDateTime(data.created_at))}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to={`/admin/orders/${data.id}/print`} variant="secondary" size="sm">
            <FileText aria-hidden="true" size={18} strokeWidth={1.5} />
            {t.printInvoice}
          </Button>
          <Button as={Link} to={`/admin/orders/${data.id}/print?doc=packing`} variant="secondary" size="sm">
            <Package aria-hidden="true" size={18} strokeWidth={1.5} />
            {t.printPacking}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <OrderStatusPanel order={data} history={history.data} mutation={mutation} />
          <CustomerCard order={data} />
          <OrderActionsCard order={data} />
          <ItemsCard order={data} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <TotalsCard order={data} />
          <OrderHistory
            history={history.data}
            isPending={history.isPending}
            isError={history.isError}
            userId={session?.user?.id}
          />
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
