import { strings } from "../../lib/strings";

// "Only n left" in amber once stock is at/under the product's low_stock_at
// threshold; a plain in-stock line above it; danger-coloured when it's 0.
function StockLine({ stock, lowStockAt }) {
  if (stock < 1) {
    return <p className="text-small font-medium text-danger">{strings.product.stock.out}</p>;
  }
  if (stock <= lowStockAt) {
    return <p className="text-small font-medium text-warning">{strings.product.stock.low(stock)}</p>;
  }
  return <p className="text-small text-muted">{strings.product.stock.in}</p>;
}

export default StockLine;
