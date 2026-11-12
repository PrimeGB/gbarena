-- Keep staff decisions consistent with the formats accepted by match reporting.
do $migration$
declare
  definition text;
  original text := $old$required_wins := case
    when best_of_number = 7 then 4
    when best_of_number = 5 then 3
    else 2
  end;
  if best_of_number not in (3, 5, 7) then$old$;
  replacement text := $new$required_wins := case
    when best_of_number = 7 then 4
    when best_of_number = 5 then 3
    when best_of_number = 1 then 1
    else 2
  end;
  if best_of_number not in (1, 2, 3, 5, 7) then$new$;
begin
  select pg_get_functiondef('public.gb_staff_finalize_without_rank_movement(uuid,integer,integer,text)'::regprocedure)
    into definition;
  if position(original in definition) = 0 then
    raise exception 'Staff result validation has changed; review this migration before applying it.';
  end if;
  execute replace(definition, original, replacement);
end;
$migration$;

notify pgrst, 'reload schema';
