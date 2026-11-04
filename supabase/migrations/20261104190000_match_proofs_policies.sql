drop policy if exists match_proofs_select on public.match_proofs;
create policy match_proofs_select on public.match_proofs for select using (true);

drop policy if exists match_proofs_insert on public.match_proofs;
create policy match_proofs_insert on public.match_proofs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = match_proofs.team_id and tm.user_id = auth.uid()
    )
  );

grant select on public.match_proofs to anon, authenticated;
grant insert on public.match_proofs to authenticated;

notify pgrst, 'reload schema';
