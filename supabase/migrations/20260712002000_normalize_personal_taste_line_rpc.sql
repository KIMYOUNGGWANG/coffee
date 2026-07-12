update public.profiles
set personal_taste_line = btrim(personal_taste_line)
where personal_taste_line is not null
  and personal_taste_line <> btrim(personal_taste_line);

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
declare
  normalized_taste_line text;
begin
  if new_personal_taste_line is null then
    normalized_taste_line := null;
  else
    normalized_taste_line := btrim(new_personal_taste_line);
    if char_length(normalized_taste_line) not between 1 and 160 then
      raise exception 'Personal taste line must contain 1 to 160 characters.' using errcode = '23514';
    end if;
  end if;

  return query
  update public.profiles as profile
  set personal_taste_line = normalized_taste_line
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
