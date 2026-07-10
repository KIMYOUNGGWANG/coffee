alter table public.coffee_shelf_items
  add column if not exists rebuy_return_token uuid;

update public.coffee_shelf_items
  set rebuy_return_token = gen_random_uuid()
  where rebuy_return_token is null;

alter table public.coffee_shelf_items
  alter column rebuy_return_token set default gen_random_uuid(),
  alter column rebuy_return_token set not null;

create unique index if not exists idx_coffee_shelf_items_rebuy_return_token
  on public.coffee_shelf_items (rebuy_return_token);
