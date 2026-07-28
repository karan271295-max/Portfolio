-- WealthOS core schema. Normalized, indexed, RLS on every table.
-- Every row is scoped to auth.uid(); users only ever see their own data.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type asset_class as enum
  ('equity','debt','cash','commodity','crypto','real_estate','alternative','retirement','receivable');

create type asset_kind as enum
  ('stock','mutual_fund','etf','gold','silver','sgb','fixed_deposit','bank_account',
   'savings','current_account','cash','epf','ppf','nps','bond','crypto','real_estate',
   'vehicle','private_equity','startup','business','insurance_cash_value','collectible',
   'foreign_investment','loan_given','other');

create type liability_kind as enum
  ('home_loan','car_loan','education_loan','credit_card','personal_loan','business_loan','other');

create type txn_type as enum
  ('buy','sell','salary','dividend','interest','rent','deposit','withdrawal',
   'expense','gift','inheritance','loan','property_purchase');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  base_currency text not null default 'INR',
  monthly_expense numeric not null default 100000,
  created_at timestamptz not null default now()
);

-- ---------- accounts (broker / bank / wallet) ----------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  institution text,
  kind text,
  created_at timestamptz not null default now()
);
create index accounts_user_idx on accounts (user_id);

-- ---------- holdings ----------
create table holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  account_id uuid references accounts on delete set null,
  goal_id uuid,
  name text not null,
  kind asset_kind not null,
  asset_class asset_class not null,
  currency text not null default 'INR',
  quantity numeric not null default 1,
  invested_amount numeric not null default 0,
  current_value numeric not null default 0,
  day_change numeric default 0,
  annual_income numeric default 0,
  sector text,
  country text default 'IN',
  market_cap text,
  amc text,
  broker text,
  tax_category text,
  maturity_date date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index holdings_user_idx on holdings (user_id);
create index holdings_class_idx on holdings (user_id, asset_class);

-- ---------- liabilities ----------
create table liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kind liability_kind not null,
  currency text not null default 'INR',
  outstanding numeric not null default 0,
  interest_rate numeric,
  emi numeric,
  due_date date,
  created_at timestamptz not null default now()
);
create index liabilities_user_idx on liabilities (user_id);

-- ---------- transactions (millions of rows: partition-ready, well indexed) ----------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  holding_id uuid references holdings on delete set null,
  date date not null,
  type txn_type not null,
  amount numeric not null,           -- signed: + inflow / - outflow to net worth
  label text,
  category text,
  broker text,
  source text,
  tags text[] default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on transactions (user_id, date desc);
create index transactions_holding_idx on transactions (holding_id);

-- ---------- goals ----------
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kind text not null default 'custom',
  target numeric not null,
  target_date date,
  created_at timestamptz not null default now()
);
create index goals_user_idx on goals (user_id);

-- ---------- daily net-worth snapshots (for the chart / history) ----------
create table net_worth_snapshots (
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  net_worth numeric not null,
  assets numeric not null,
  liabilities numeric not null,
  primary key (user_id, date)
);

-- ---------- audit log ----------
create table audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  entity text not null,
  entity_id uuid,
  action text not null,
  diff jsonb,
  at timestamptz not null default now()
);
create index audit_user_idx on audit_log (user_id, at desc);

-- ---------- RLS: owner-only on every table ----------
alter table profiles           enable row level security;
alter table accounts           enable row level security;
alter table holdings           enable row level security;
alter table liabilities        enable row level security;
alter table transactions       enable row level security;
alter table goals              enable row level security;
alter table net_worth_snapshots enable row level security;
alter table audit_log          enable row level security;

create policy own_profile on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Same owner policy for the user_id-scoped tables.
do $$
declare t text;
begin
  foreach t in array array['accounts','holdings','liabilities','transactions','goals','net_worth_snapshots','audit_log']
  loop
    execute format(
      'create policy own_rows on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
  end loop;
end $$;

-- ---------- new-user trigger: create a profile row ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();
