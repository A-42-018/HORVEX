-- Block B review fix: cancelling or returning an order gives back what place_order took.
-- When an order moves into 'cancelled' or 'returned' from any other status, each
-- item's qty goes back to its variant's stock (or the product's, when there is
-- no variant), and the coupon's `used` count drops by one (never below 0).
-- Items whose product/variant was deleted since (FK now null) are skipped; a
-- variant line (variant_snapshot set by place_order) never falls back to the product.
-- Moving between cancelled and returned, or back out of them, changes nothing.

create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('cancelled', 'returned') or old.status in ('cancelled', 'returned') then
    return new;
  end if;

  -- Lock in id order, like place_order, to avoid deadlocks with it.
  perform 1 from public.products pr
  where pr.id in (
    select oi.product_id from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is null and oi.variant_snapshot is null
  )
  order by pr.id for update;
  perform 1 from public.product_variants pv
  where pv.id in (select oi.variant_id from public.order_items oi where oi.order_id = new.id)
  order by pv.id for update;

  update public.product_variants pv
  set stock = pv.stock + items.qty
  from (
    select oi.variant_id, sum(oi.qty)::int as qty
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is not null
    group by oi.variant_id
  ) items
  where pv.id = items.variant_id;

  update public.products pr
  set stock = pr.stock + items.qty
  from (
    select oi.product_id, sum(oi.qty)::int as qty
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is null and oi.variant_snapshot is null and oi.product_id is not null
    group by oi.product_id
  ) items
  where pr.id = items.product_id;

  if new.coupon_code is not null then
    update public.coupons set used = greatest(used - 1, 0) where code = new.coupon_code;
  end if;

  return new;
end;
$$;

revoke all on function public.restock_cancelled_order() from public, anon, authenticated;

create trigger orders_restock_on_cancel
  after update of status on public.orders
  for each row execute function public.restock_cancelled_order();
