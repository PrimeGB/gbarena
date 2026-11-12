-- Update display labels and permission errors without changing the stored role key.
do $$
declare
  routine regprocedure;
  definition text;
  updated_definition text;
begin
  foreach routine in array array[
    'public.gb_guard_forum_moderation()'::regprocedure,
    'public.gb_guard_staff_tournament()'::regprocedure,
    'public.gb_staff_award_tournament_prize_with_role_checks(uuid,uuid,integer,integer)'::regprocedure,
    'public.get_staff_directory()'::regprocedure,
    'public.staff_adjust_credits(text,integer,text)'::regprocedure,
    'public.staff_assign_member(text,text,text,text[])'::regprocedure,
    'public.staff_award_competition_champion(text,uuid)'::regprocedure,
    'public.staff_award_team(uuid,text,text,text)'::regprocedure,
    'public.staff_award_tournament_prize(uuid,uuid,integer,integer)'::regprocedure,
    'public.staff_award_user(text,text,text,text)'::regprocedure,
    'public.staff_clear_purchase_block(text)'::regprocedure,
    'public.staff_issue_sanction(text,text,text,integer)'::regprocedure,
    'public.staff_record_match_decision_review(bigint,text)'::regprocedure,
    'public.staff_remove_member(text)'::regprocedure,
    'public.staff_review_site_change(bigint,boolean,text)'::regprocedure,
    'public.staff_revoke_award(bigint,text)'::regprocedure,
    'public.staff_set_credit_access(text,boolean,text)'::regprocedure,
    'public.staff_set_rank(text,text,text,text,text)'::regprocedure,
    'public.staff_update_directory(text,text,text,text)'::regprocedure
  ]
  loop
    definition := pg_get_functiondef(routine);
    if position('Owner' in definition) = 0 or exists (
      select 1 from unnest(string_to_array(definition, E'\n')) line
      where position('Owner' in line) > 0
        and line not like '%raise exception%'
        and line not like '%''Founder / Owner''%'
    ) then
      raise exception 'Unexpected Founder wording in %; review this migration', routine;
    end if;
    updated_definition := replace(replace(replace(
      definition, 'Founder / Owner', 'Founder'), 'an Owner', 'a Founder'), 'Owner', 'Founder');
    updated_definition := replace(replace(updated_definition,
      'the owner can', 'a Founder can'), 'non-owner account', 'non-Founder account');
    execute updated_definition;
  end loop;

  foreach routine in array array[
    'public.gb_staff_adjust_credits_unchecked(text,integer,text)'::regprocedure,
    'public.gb_staff_clear_purchase_block_unchecked(text)'::regprocedure,
    'public.gb_staff_pay_prize_unchecked(uuid,uuid,integer,integer)'::regprocedure,
    'public.gb_submit_owner_feedback(text,text,text)'::regprocedure
  ]
  loop
    definition := pg_get_functiondef(routine);
    updated_definition := replace(replace(definition,
      'owner-level staff', 'Founder-level staff'), 'owner inbox', 'Founder inbox');
    if updated_definition = definition then
      raise exception 'Unexpected Founder wording in %; review this migration', routine;
    end if;
    execute updated_definition;
  end loop;
end;
$$;
