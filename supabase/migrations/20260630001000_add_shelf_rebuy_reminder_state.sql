alter table public.coffee_shelf_items
  add column if not exists rebuy_priority text not null default 'normal',
  add column if not exists rebuy_reminder_date date,
  add column if not exists rebuy_action text not null default 'none',
  add column if not exists rebuy_action_at timestamptz;

alter table public.coffee_shelf_items
  drop constraint if exists coffee_shelf_items_rebuy_priority_check,
  add constraint coffee_shelf_items_rebuy_priority_check
    check (rebuy_priority in ('normal', 'pinned', 'paused'));

alter table public.coffee_shelf_items
  drop constraint if exists coffee_shelf_items_rebuy_action_check,
  add constraint coffee_shelf_items_rebuy_action_check
    check (rebuy_action in ('none', 'drank', 'will_rebuy', 'rebought'));

create index if not exists idx_coffee_shelf_items_user_rebuy_priority
  on public.coffee_shelf_items (user_id, rebuy_priority);

create index if not exists idx_coffee_shelf_items_user_rebuy_reminder_date
  on public.coffee_shelf_items (user_id, rebuy_reminder_date);
