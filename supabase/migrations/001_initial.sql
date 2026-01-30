-- Recipes: one row per recipe, owned by user
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source text not null,
  source_url text,
  image_url text,
  servings int2,
  prep_time_minutes int2,
  cook_time_minutes int2,
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  categories jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);

-- Week menus: one row per (user, year, week)
create table if not exists public.week_menus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int2 not null,
  week int2 not null,
  slots jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, year, week)
);

create index if not exists week_menus_user_id_idx on public.week_menus(user_id);

-- RLS: users see only their own data
alter table public.recipes enable row level security;
alter table public.week_menus enable row level security;

create policy "Users can do everything on own recipes"
  on public.recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can do everything on own week_menus"
  on public.week_menus for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_updated_at on public.recipes;
create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

drop trigger if exists week_menus_updated_at on public.week_menus;
create trigger week_menus_updated_at
  before update on public.week_menus
  for each row execute function public.set_updated_at();
