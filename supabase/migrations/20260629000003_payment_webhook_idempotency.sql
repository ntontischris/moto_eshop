-- =====================================================================
-- F-1.2 (#141): webhook idempotency & loss-safety
-- =====================================================================
-- Makes the confirmed-payment webhook duplicate-proof and loss-proof
-- (ADR 0015). Two layers of duplicate safety, both enforced by the DB so a
-- racing or re-delivered `checkout.session.completed` physically cannot
-- create a second order:
--   1. each provider event id is recorded once (processed_payment_events);
--   2. one order per Checkout session (orders.checkout_session_id UNIQUE).
-- The order, its items, the session-finalize, and the event record are all
-- written in ONE transaction (the RPC below), and the route returns success
-- to the provider only after that commits — so a transient mid-processing
-- failure is retried by the provider, never a lost payment.

-- ---------------------------------------------------------------------
-- 1. PROCESSED EVENT LEDGER (layer 1: event-id dedup)
-- ---------------------------------------------------------------------
create table if not exists processed_payment_events (
  event_id     text primary key,            -- provider event id (Stripe evt_...)
  processed_at timestamptz not null default now()
);

alter table processed_payment_events enable row level security;
create policy "processed_payment_events_service_role_all"
  on processed_payment_events for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 2. ONE ORDER PER CHECKOUT SESSION (layer 2: DB-enforced uniqueness)
-- ---------------------------------------------------------------------
-- The link that proves "exactly one order per session": a second insert for
-- the same session violates this UNIQUE constraint and rolls the txn back.
alter table orders
  add column if not exists checkout_session_id uuid
    references checkout_sessions(id) on delete set null;

create unique index if not exists uq_orders_checkout_session
  on orders(checkout_session_id)
  where checkout_session_id is not null;

-- ---------------------------------------------------------------------
-- 3. COLLISION-FREE ORDER NUMBERS
-- ---------------------------------------------------------------------
-- The TS path derived order_number from Date.now(), which collides under
-- concurrent webhooks (two orders, same millisecond) → a unique_violation
-- the dedup catch would misread as "already processed", dropping a real
-- payment. A sequence makes each number unique by construction.
create sequence if not exists order_number_seq;

-- ---------------------------------------------------------------------
-- 4. ATOMIC CREATE-ORDER-FROM-PAYMENT (the single transaction)
-- ---------------------------------------------------------------------
create or replace function create_order_from_payment(
  p_event_id  text,
  p_session_id uuid,
  p_address   jsonb,
  p_subtotal  numeric,
  p_shipping  numeric,
  p_total     numeric,
  p_line_items jsonb
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id     uuid;
  v_order_number text;
begin
  -- Layer 1: record the event. A duplicate id (re-delivery / racing copy of
  -- the same event) trips the PK and is caught below as already-processed.
  insert into processed_payment_events (event_id) values (p_event_id);

  v_order_number := 'MM-' || to_char(nextval('order_number_seq'), 'FM000000');

  -- Layer 2: the checkout_session_id UNIQUE index makes a second order for
  -- the same session (two *different* events racing) impossible.
  insert into orders (
    order_number, billing_address, shipping_address,
    subtotal, shipping_cost, total, discount,
    payment_status, user_id, checkout_session_id
  ) values (
    v_order_number, p_address, p_address,
    p_subtotal, p_shipping, p_total, 0,
    'paid', null, p_session_id
  )
  returning id into v_order_id;

  insert into order_items (order_id, product_id, quantity, unit_price, total)
  select
    v_order_id,
    (li ->> 'productId')::uuid,
    (li ->> 'quantity')::int,
    (li ->> 'unitPrice')::numeric,
    (li ->> 'lineTotal')::numeric
  from jsonb_array_elements(p_line_items) as li;

  update checkout_sessions
    set status = 'completed', order_id = v_order_id, updated_at = now()
    where id = p_session_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
exception
  -- Either the event id was already recorded (layer 1) or another event
  -- already created this session's order (layer 2). Both mean: someone else
  -- won the race; the whole transaction rolls back and we report a no-op.
  when unique_violation then
    return jsonb_build_object('already_processed', true);
end;
$$;

-- Callable only by the service-role webhook path; keep it off the public API.
revoke execute on function
  create_order_from_payment(text, uuid, jsonb, numeric, numeric, numeric, jsonb)
  from public, anon, authenticated;
grant execute on function
  create_order_from_payment(text, uuid, jsonb, numeric, numeric, numeric, jsonb)
  to service_role;
