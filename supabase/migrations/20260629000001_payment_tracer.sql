-- =====================================================================
-- F-1 Payment tracer: hosted card checkout, webhook-confirmed orders
-- =====================================================================
-- Introduces the data foundation for the PaymentProvider tracer (ADR 0010,
-- ADR 0015). An order row is created only when the provider's webhook
-- confirms payment for card; Cash on Delivery still creates its order
-- immediately. See CONTEXT.md glossary: "Checkout session", "PaymentProvider".

-- ---------------------------------------------------------------------
-- 1. TWO-AXIS ORDER STATE
-- ---------------------------------------------------------------------
-- payment_status is distinct from the existing fulfillment `status`
-- (order_status enum): one column cannot express both a paid-but-unshipped
-- order and a shipped-but-uncollected COD order. Existing rows are all COD,
-- so the column defaults to 'cod'.
do $$ begin
  create type payment_status as enum ('unpaid', 'paid', 'failed', 'cod');
exception
  when duplicate_object then null;
end $$;

alter table orders
  add column if not exists payment_status payment_status not null default 'cod';

-- ---------------------------------------------------------------------
-- 2. CHECKOUT SESSIONS
-- ---------------------------------------------------------------------
-- A Checkout session is a server-priced snapshot of the cart created before
-- the customer is redirected to the provider-hosted payment page. The order
-- is built from this snapshot when the webhook confirms payment. Kept after
-- expiry (status = 'expired') as a seed for future abandoned-checkout email.
create table if not exists checkout_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  provider            text not null default 'stripe'
                        check (provider in ('stripe', 'viva')),
  -- provider's hosted session id; set right after the provider session is
  -- created. Unique so a duplicate webhook can never spawn a second order.
  provider_session_id text unique,
  status              text not null default 'pending'
                        check (status in ('pending', 'completed', 'expired')),
  -- server-priced snapshot (ADR 0001): line items + money, charged in EUR.
  line_items          jsonb not null,        -- [{product_id, slug, quantity, unit_price, line_total}]
  subtotal            numeric not null,
  shipping_cost       numeric not null,
  total               numeric not null,
  amount_total        integer not null,      -- EUR minor units (cents) handed to the provider
  currency            text not null default 'eur',
  -- contact/shipping snapshot needed to build the order at webhook time,
  -- when the browser is gone. {email, phone, fullName, address, city, postal, region, notes}
  contact             jsonb not null,
  -- set when the confirmed-payment webhook creates the order.
  order_id            uuid references orders(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_checkout_sessions_provider_session
  on checkout_sessions(provider_session_id);
create index if not exists idx_checkout_sessions_status_created
  on checkout_sessions(status, created_at desc);

-- Guest card checkouts have no auth session: all access is via the
-- service-role admin client (RLS bypassed), mirroring the guest COD path.
alter table checkout_sessions enable row level security;
create policy "checkout_sessions_service_role_all"
  on checkout_sessions for all using (auth.role() = 'service_role');
