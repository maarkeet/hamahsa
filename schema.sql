-- Hamasa Supermarket: Supabase schema
create extension if not exists pgcrypto;

do $$ begin
  create type public.order_status as enum ('new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  image_url text,
  icon text default 'fa-tag',
  sort_order integer not null default 0,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  category_id text references public.categories(id) on delete set null,
  category text,
  image_url text,
  available boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  unit text default 'قطعة',
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default upper('HM-' || substr(gen_random_uuid()::text, 1, 8)),
  customer_name text not null,
  phone text not null,
  address text not null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text not null default 'cash',
  notes text,
  status public.order_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility table used by the existing settings form; production values are mirrored by the RPC below.
create table if not exists public.store_settings (
  id integer primary key default 1,
  name text not null default 'سوبر ماركت حماصة',
  whatsapp text,
  delivery_fee numeric(12,2) not null default 20,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin' check (role in ('admin', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_available_idx on public.products(available);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

create or replace function public.is_admin_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.admin_users
  where user_id = auth.uid() and is_active and role in ('admin', 'manager')
); $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_items jsonb,
  p_payment_method text default 'cash',
  p_notes text default ''
)
returns table (id uuid, order_code text, subtotal numeric, delivery_fee numeric, total numeric)
language plpgsql security definer set search_path = public
as $$
declare
  new_order public.orders;
  item jsonb;
  current_product public.products;
  item_quantity integer;
  item_total numeric;
  calculated_subtotal numeric := 0;
  calculated_delivery numeric := coalesce((select delivery_fee from public.store_settings where id = 1), 0);
begin
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_phone), '') is null or nullif(trim(p_address), '') is null then
    raise exception 'بيانات العميل غير مكتملة';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'السلة فارغة';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into current_product from public.products
    where id = (item->>'product_id')::uuid and available = true;
    if not found then raise exception 'المنتج غير متاح'; end if;
    item_quantity := greatest(1, (item->>'quantity')::integer);
    item_total := current_product.price * item_quantity;
    calculated_subtotal := calculated_subtotal + item_total;
  end loop;

  insert into public.orders (customer_name, phone, address, subtotal, delivery_fee, total, payment_method, notes)
  values (trim(p_customer_name), trim(p_phone), trim(p_address), calculated_subtotal, calculated_delivery,
          calculated_subtotal + calculated_delivery, coalesce(nullif(p_payment_method, ''), 'cash'), nullif(trim(p_notes), ''))
  returning * into new_order;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into current_product from public.products where id = (item->>'product_id')::uuid and available = true;
    item_quantity := greatest(1, (item->>'quantity')::integer);
    item_total := current_product.price * item_quantity;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total)
    values (new_order.id, current_product.id, current_product.name, item_quantity, current_product.price, item_total);
  end loop;

  return query select new_order.id, new_order.order_code, new_order.subtotal, new_order.delivery_fee, new_order.total;
end; $$;

create or replace function public.track_order(p_order_code text, p_phone text)
returns json language sql security definer set search_path = public
as $$
  select json_build_object(
    'id', o.id, 'order_code', o.order_code, 'customer_name', o.customer_name,
    'address', o.address,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total,
    'payment_method', o.payment_method, 'status', o.status,
    'created_at', o.created_at, 'updated_at', o.updated_at,
    'items', coalesce((select json_agg(oi order by oi.created_at) from public.order_items oi where oi.order_id = o.id), '[]'::json)
  ) from public.orders o where upper(o.order_code) = upper(trim(p_order_code)) and o.phone = trim(p_phone);
$$;

create or replace function public.update_order_status(p_order_id uuid, p_next_status public.order_status)
returns public.orders language plpgsql security definer set search_path = public
as $$
declare current_order public.orders; allowed boolean := false;
begin
  if not public.is_admin_user() then raise exception 'غير مصرح'; end if;
  select * into current_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  allowed := (current_order.status, p_next_status) in (('new','confirmed'),('new','cancelled'),('confirmed','preparing'),('confirmed','cancelled'),('preparing','ready'),('ready','out_for_delivery'),('out_for_delivery','delivered'));
  if not allowed then raise exception 'انتقال حالة الطلب غير مسموح'; end if;
  update public.orders set status = p_next_status where id = p_order_id returning * into current_order;
  return current_order;
end; $$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.store_settings enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (active = true or public.is_admin_user());
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (available = true or public.is_admin_user());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin_user());
drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin_user());
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings for select to anon, authenticated using (true);
drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read on public.store_settings for select to anon, authenticated using (true);
drop policy if exists store_settings_admin_write on public.store_settings;
create policy store_settings_admin_write on public.store_settings for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.categories, public.products, public.settings, public.store_settings to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.settings, public.store_settings to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant execute on function public.create_order(text,text,text,jsonb,text,text) to anon, authenticated;
grant execute on function public.track_order(text,text) to anon, authenticated;
grant execute on function public.update_order_status(uuid,public.order_status) to authenticated;
grant execute on function public.is_admin_user() to anon, authenticated;

insert into public.store_settings (id, name, delivery_fee) values (1, 'سوبر ماركت حماصة', 20) on conflict (id) do nothing;
insert into public.settings (key, value) values ('delivery_fee', '20') on conflict (key) do nothing;
