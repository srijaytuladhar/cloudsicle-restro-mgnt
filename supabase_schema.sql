-- Restaurant Table-Ordering System - Supabase Schema Definition

-- 1. Tables in the restaurant
create table if not exists cl_restro_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int not null,
  qr_code_url text,
  created_at timestamptz default now()
);

-- 2. Menu categories
create table if not exists cl_restro_menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- 3. Menu items
create table if not exists cl_restro_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null, -- NPR
  category_id uuid references cl_restro_menu_categories(id) on delete set null,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- 4. Table bookings (a session at a table)
create table if not exists cl_restro_bookings (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references cl_restro_tables(id) on delete cascade,
  status text default 'ACTIVE', -- ACTIVE, CLOSED
  created_at timestamptz default now()
);

-- 5. Orders (one order can have multiple items)
create table if not exists cl_restro_orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references cl_restro_bookings(id) on delete cascade,
  table_id uuid references cl_restro_tables(id) on delete cascade,
  status text default 'ORDER_PLACED',
  -- allowed values: ORDER_PLACED, PREPARING_IN_KITCHEN, READY, SERVING, SERVED, PAYMENT_DONE
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Items within an order
create table if not exists cl_restro_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references cl_restro_orders(id) on delete cascade,
  menu_item_id uuid references cl_restro_menu_items(id) on delete set null,
  quantity int not null default 1,
  price_at_order numeric(10,2) not null, -- snapshot of price
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table cl_restro_tables enable row level security;
alter table cl_restro_menu_categories enable row level security;
alter table cl_restro_menu_items enable row level security;
alter table cl_restro_bookings enable row level security;
alter table cl_restro_orders enable row level security;
alter table cl_restro_order_items enable row level security;

-- Permissive public policies
drop policy if exists "public access" on cl_restro_tables;
create policy "public access" on cl_restro_tables for all using (true) with check (true);

drop policy if exists "public access" on cl_restro_menu_categories;
create policy "public access" on cl_restro_menu_categories for all using (true) with check (true);

drop policy if exists "public access" on cl_restro_menu_items;
create policy "public access" on cl_restro_menu_items for all using (true) with check (true);

drop policy if exists "public access" on cl_restro_bookings;
create policy "public access" on cl_restro_bookings for all using (true) with check (true);

drop policy if exists "public access" on cl_restro_orders;
create policy "public access" on cl_restro_orders for all using (true) with check (true);

drop policy if exists "public access" on cl_restro_order_items;
create policy "public access" on cl_restro_order_items for all using (true) with check (true);
