-- Descriptions remain required, with a 4000-character maximum.
-- Preserve the current portal function and its access controls, changing only
-- the customer submission length check rather than copying an older body.
do $migration$
declare
  definition text := pg_get_functiondef('exception_private.portal_command(text,jsonb)'::regprocedure);
  previous_check text := 'txt:=trim(input->>''description''); if txt is null or length(txt)<10 or length(txt)>4000 then raise exception ''Describe the issue using 10 to 4000 characters''; end if;';
  replacement_check text := 'txt:=trim(input->>''description''); if txt is null or length(txt)=0 or length(txt)>4000 then raise exception ''Describe the issue using up to 4000 characters''; end if;';
begin
  if position(previous_check in definition) = 0 then
    raise exception 'Expected customer report length validation was not found';
  end if;
  execute replace(definition, previous_check, replacement_check);
end;
$migration$;

alter table public.driver_reports
  drop constraint driver_reports_details_check,
  add constraint driver_reports_details_check
    check (length(btrim(details)) > 0 and length(details) <= 4000);
