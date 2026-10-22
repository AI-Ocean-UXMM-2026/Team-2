-- First create these two users in Supabase Authentication > Users > Add user.
-- Use Create new user with Auto Confirm User enabled (no email is sent).
-- This script assigns application roles; it does not create Auth accounts.
begin;

do $$
begin
  if (select count(*) from auth.users where email in (
    'operations.test@example.invalid', 'delivery.test@example.invalid'
  ) and email_confirmed_at is not null) <> 2 then
    raise exception 'Create and auto-confirm both test users in Authentication > Users first';
  end if;
end;
$$;

insert into public.staff_profiles (user_id, full_name, role, is_active)
select id,
  case email when 'operations.test@example.invalid' then 'Test Operations' else 'Test Delivery' end,
  case email when 'operations.test@example.invalid' then 'OPERATIONS' else 'DELIVERY_PERSON' end,
  true
from auth.users
where email in ('operations.test@example.invalid', 'delivery.test@example.invalid')
on conflict (user_id) do update
set full_name = excluded.full_name, role = excluded.role, is_active = true;

commit;

select u.email, s.role, s.is_active
from public.staff_profiles s join auth.users u on u.id = s.user_id
where u.email in ('operations.test@example.invalid', 'delivery.test@example.invalid');
