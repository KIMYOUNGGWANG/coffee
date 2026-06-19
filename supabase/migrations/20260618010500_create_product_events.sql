create table if not exists public.product_events (
  event_id uuid primary key,
  event_name text not null check (event_name in (
    'landing_view',
    'pricing_viewed',
    'pricing_cta_clicked',
    'dashboard_view',
    'first_card_cta_clicked',
    'paywall_opened',
    'checkout_started',
    'checkout_failed',
    'subscription_status_viewed',
    'billing_support_started',
    'support_request_submitted',
    'story_downloaded',
    'story_share_started',
    'public_share_link_copied',
    'public_card_view',
    'scan_started',
    'scan_result_returned',
    'scan_failed',
    'scan_field_edited',
    'draft_confirmed',
    'card_saved',
    'archive_viewed',
    'archive_searched',
    'second_bag_recorded',
    'third_bag_recorded'
  )),
  occurred_at timestamptz not null,
  path varchar(2048) not null check (
    char_length(path) > 0
    and left(path, 1) = '/'
    and position('?' in path) = 0
    and position('#' in path) = 0
  ),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id varchar(128),
  properties jsonb not null default '{}'::jsonb check (
    jsonb_typeof(properties) = 'object'
    and octet_length(properties::text) <= 8192
    and not jsonb_path_exists(
      properties,
      '$.* ? (@.type() == "object" || @.type() == "array")'
    )
  ),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists product_events_user_occurred_at_idx
  on public.product_events (user_id, occurred_at desc)
  where user_id is not null;

create index if not exists product_events_anonymous_occurred_at_idx
  on public.product_events (anonymous_id, occurred_at desc)
  where anonymous_id is not null;

create index if not exists product_events_name_occurred_at_idx
  on public.product_events (event_name, occurred_at desc);

alter table public.product_events enable row level security;
