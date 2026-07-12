drop policy if exists "Users can update their own profile" on public.profiles;

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
