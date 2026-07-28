-- Single-user cross-device sync: one JSON document holding the whole portfolio.
-- Accessed only via the server API route (service-role key), so no RLS needed.
create table if not exists portfolio_doc (
  id text primary key default 'me',
  data jsonb not null,
  updated_at timestamptz not null default now()
);
