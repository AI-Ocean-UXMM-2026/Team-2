-- First sign in to the app with Google using each email below.
-- This script assigns application roles; it does not create Auth accounts.
begin;

do $$
begin
  if (select count(*) from auth.users where email in (
    'testoperationone01@gmail.com', 'testdriverone01@gmail.com'
  ) and email_confirmed_at is not null) <> 2 then
    raise exception 'Sign in with both Google accounts first so both confirmed Auth users exist';
  end if;
end;
$$;

insert into public.staff_profiles (user_id, full_name, role, is_active)
select id,
  case email when 'testoperationone01@gmail.com' then 'Test Operations' else 'Test Delivery' end,
  case email when 'testoperationone01@gmail.com' then 'ADMIN' else 'DELIVERY_PERSON' end,
  true
from auth.users
where email in ('testoperationone01@gmail.com', 'testdriverone01@gmail.com')
on conflict (user_id) do update
set full_name = excluded.full_name, role = excluded.role, is_active = true;

commit;

select u.email, s.role, s.is_active
from public.staff_profiles s join auth.users u on u.id = s.user_id
where u.email in ('testoperationone01@gmail.com', 'testdriverone01@gmail.com');
