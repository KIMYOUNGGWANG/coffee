alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check
  check (event_name in (
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
    'public_card_cta_clicked',
    'scan_started',
    'scan_result_returned',
    'scan_failed',
    'oauth_failed',
    'card_save_failed',
    'shelf_save_failed',
    'brewing_log_save_failed',
    'checkout_webhook_failed',
    'scan_field_edited',
    'draft_confirmed',
    'card_saved',
    'archive_viewed',
    'archive_searched',
    'second_bag_recorded',
    'third_bag_recorded',
    'share_card_clicked',
    'ai_scan_success',
    'rebuy_action_saved',
    'rebuy_calendar_export_clicked',
    'rebuy_calendar_returned'
  ));
