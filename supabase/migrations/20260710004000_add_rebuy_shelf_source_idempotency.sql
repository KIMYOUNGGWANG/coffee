alter table public.coffee_shelf_items
  add column if not exists rebuy_source_shelf_item_id uuid
  references public.coffee_shelf_items(id) on delete set null;

alter table public.coffee_shelf_items
  drop constraint if exists coffee_shelf_items_user_rebuy_source_unique;

alter table public.coffee_shelf_items
  add constraint coffee_shelf_items_user_rebuy_source_unique
  unique (user_id, rebuy_source_shelf_item_id);
