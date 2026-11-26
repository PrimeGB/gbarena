begin;

create temporary table bf6_team_guard_test (
  category text, game text, ladder text, players text, game_mode text, preset text, best_of text,
  friendly_fire text, killstreaks text, perks text, radar text, spectating text, additional_rules jsonb,
  status text
);
create trigger bf6_team_guard before insert or update on bf6_team_guard_test
for each row execute function public.gb_guard_bf6_team_ladders();

do $$
begin
  if public.gb_ladder_platforms('battlefield', 'battlefield-6', 'pc') <> array['xbox', 'playstation', 'pc']
    or public.gb_ladder_platforms('battlefield', 'battlefield-6', 'xbox') <> array['xbox', 'playstation', 'pc']
    or public.gb_ladder_platforms('battlefield', 'battlefield-6', 'playstation') <> array['xbox', 'playstation', 'pc']
    or public.gb_ladder_platforms('battlefield', 'battlefield-6', 'nintendo') <> array['nintendo'] then
    raise exception 'BF6 compatible systems are incorrect';
  end if;
  insert into bf6_team_guard_test values ('battlefield', 'battlefield-6', 'conquest-8v8', '8v8', 'Conquest',
    'SnP T8 Conquest', 'Best of 3', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', null, 'open');
  insert into bf6_team_guard_test values ('battlefield', 'battlefield-6', 'conquest-32v32', '32v32', 'Conquest',
    'Custom based on GB Conquest (Provisional)', 'Best of 1', 'Off', 'On', 'Off', 'On', 'Off', null, 'open');
  update bf6_team_guard_test set status = 'accepted' where ladder = 'conquest-8v8';

  begin
    insert into bf6_team_guard_test values ('battlefield', 'battlefield-6', 'conquest-32v32', '8v8', 'Conquest',
      'GB Conquest (Provisional)', 'Best of 1', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', null, 'open');
    raise exception using errcode = '23514', message = 'Wrong roster size was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Invalid BF6 team ladder format or settings.' then raise; end if;
  end;
  begin
    insert into bf6_team_guard_test values ('battlefield', 'battlefield-6', 'conquest-8v8', '8v8', 'Conquest',
      'SnP T8 Conquest', 'Best of 3', 'Off', 'Follow rules', 'Follow rules', 'Follow rules', 'Follow rules', null, 'open');
    raise exception using errcode = '23514', message = 'An unlabelled custom override was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Invalid BF6 team ladder format or settings.' then raise; end if;
  end;
  begin
    update bf6_team_guard_test set preset = 'ESB Conquest Small' where ladder = 'conquest-8v8';
    raise exception using errcode = '23514', message = 'A posted preset was changed';
  exception when raise_exception then
    if sqlerrm <> 'BF6 team match settings cannot be changed after posting.' then raise; end if;
  end;
end;
$$;

rollback;
