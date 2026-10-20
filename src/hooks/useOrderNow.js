import { useNavigate } from "react-router";
import { buyNow } from "../lib/cartActions";

/** "Order now" handler shared by BuyActions and the sticky bar: bag exactly `qty`, then /checkout. */
export function useOrderNow(product, { selected, qty }) {
  const navigate = useNavigate();
  return () => {
    if (buyNow(product, { variant: selected, qty }).ok) navigate("/checkout");
  };
}
