-- Run against an isolated database after the Founder wording migration.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.staff_set_rank(text,text,text,text,text)'::regprocedure) into definition;
  if definition not like '%a Founder%' or definition like '%Owner%'
    or definition not like '%''owner'' = ''owner''%'
    or definition not like '%''Founder''%' then
    raise exception 'Founder wording or the stored owner role changed incorrectly';
  end if;
  if has_function_privilege('anon', 'public.staff_set_rank(text,text,text,text,text)', 'execute')
    or not has_function_privilege('authenticated', 'public.staff_set_rank(text,text,text,text,text)', 'execute')
    or not (select prosecdef from pg_proc where oid = 'public.staff_set_rank(text,text,text,text,text)'::regprocedure) then
    raise exception 'Function permissions or security mode changed';
  end if;
  if public.staff_set_rank('', '', '', '', '') <> 'Founder' then
    raise exception 'Updated function does not preserve its original behavior';
  end if;
  select pg_get_functiondef('public.gb_submit_owner_feedback(text,text,text)'::regprocedure) into definition;
  if definition not like '%Founder inbox%' or definition not like '%return ''owner''%' then
    raise exception 'Feedback wording or stored role handling changed incorrectly';
  end if;
end;
$$;
