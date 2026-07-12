alter table public.profiles
  add column if not exists personal_taste_line text;

alter table public.profiles
  drop constraint if exists profiles_personal_taste_line_length_check;

alter table public.profiles
  add constraint profiles_personal_taste_line_length_check
  check (personal_taste_line is null or char_length(btrim(personal_taste_line)) between 1 and 160);

create or replace function public.update_personal_taste_line(new_personal_taste_line text)
returns table (
  credits integer,
  has_pdf_access boolean,
  is_premium boolean,
  scans_used integer,
  monthly_scan_limit integer,
  personal_taste_line text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.profiles as profile
  set personal_taste_line = new_personal_taste_line
  where profile.id = auth.uid()
  returning
    profile.credits,
    profile.has_pdf_access,
    profile.is_premium,
    profile.scans_used,
    profile.monthly_scan_limit,
    profile.personal_taste_line;
end;
$$;

revoke all on function public.update_personal_taste_line(text) from public;
grant execute on function public.update_personal_taste_line(text) to authenticated;

alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check
  check (event_name in (
    'landing_view', 'pricing_viewed', 'pricing_cta_clicked', 'dashboard_view',
    'first_card_cta_clicked', 'paywall_opened', 'checkout_started', 'checkout_failed',
    'subscription_status_viewed', 'billing_support_started', 'support_request_submitted',
    'story_downloaded', 'story_share_started', 'public_share_link_copied', 'public_card_view',
    'public_card_cta_clicked', 'scan_started', 'scan_result_returned', 'scan_failed',
    'oauth_failed', 'card_save_failed', 'shelf_save_failed', 'brewing_log_save_failed',
    'checkout_webhook_failed', 'scan_field_edited', 'draft_confirmed', 'card_saved',
    'archive_viewed', 'archive_searched', 'second_bag_recorded', 'third_bag_recorded',
    'share_card_clicked', 'ai_scan_success', 'rebuy_action_saved',
    'rebuy_calendar_export_clicked', 'rebuy_calendar_returned', 'rebuy_purchase_clue_opened',
    'rebuy_shelf_memory_started', 'next_purchase_memory_opened',
    'taste_preference_saved', 'taste_preference_copied'
  ));
