alter table public.coffee_shelf_items
  add column if not exists purchase_date date,
  add column if not exists rebuy_sequence integer not null default 1;

alter table public.coffee_shelf_items
  drop constraint if exists coffee_shelf_items_rebuy_sequence_check;

alter table public.coffee_shelf_items
  add constraint coffee_shelf_items_rebuy_sequence_check
  check (rebuy_sequence >= 1);

comment on column public.coffee_shelf_items.purchase_date is
  'Owner-private purchase date. Source-linked rebuy bags are stamped in Asia/Seoul time.';

comment on column public.coffee_shelf_items.rebuy_sequence is
  'One-based purchase sequence inherited from an owner-verified rebuy source bag.';
