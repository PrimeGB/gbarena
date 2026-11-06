update storage.buckets set public = false where id = 'match-proofs';

drop policy if exists match_proofs_select on public.match_proofs;
create policy match_proofs_select on public.match_proofs for select to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = match_proofs.match_id
      and (
        m.posting_team_id in (select tm.team_id from public.team_members tm where tm.user_id = auth.uid())
        or m.accepting_team_id in (select tm.team_id from public.team_members tm where tm.user_id = auth.uid())
        or m.posting_team_id in (select t.id from public.teams t where t.owner_id = auth.uid())
        or m.accepting_team_id in (select t.id from public.teams t where t.owner_id = auth.uid())
        or public.has_staff_permission('match_review')
      )
  )
);

drop policy if exists match_proofs_insert on public.match_proofs;
create policy match_proofs_insert on public.match_proofs for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_proofs.match_id
      and match_proofs.team_id in (m.posting_team_id, m.accepting_team_id)
      and (
        exists (select 1 from public.teams t where t.id = match_proofs.team_id and t.owner_id = auth.uid())
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = match_proofs.team_id and tm.user_id = auth.uid()
        )
      )
  )
);

revoke all on public.match_proofs from anon, authenticated;
grant select, insert on public.match_proofs to authenticated;

drop policy if exists match_proofs_read on storage.objects;
create policy match_proofs_read on storage.objects for select to authenticated
using (
  bucket_id = 'match-proofs'
  and exists (
    select 1
    from public.match_proofs p
    join public.matches m on m.id = p.match_id
    where (
      p.proof_url = storage.objects.name
      or p.proof_url like '%/match-proofs/' || storage.objects.name
    )
      and (
        m.posting_team_id in (select tm.team_id from public.team_members tm where tm.user_id = auth.uid())
        or m.accepting_team_id in (select tm.team_id from public.team_members tm where tm.user_id = auth.uid())
        or m.posting_team_id in (select t.id from public.teams t where t.owner_id = auth.uid())
        or m.accepting_team_id in (select t.id from public.teams t where t.owner_id = auth.uid())
        or public.has_staff_permission('match_review')
      )
  )
);

drop policy if exists match_proofs_upload on storage.objects;
create policy match_proofs_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'match-proofs'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.matches m
    where m.id::text = (storage.foldername(name))[1]
      and (
        exists (select 1 from public.teams t where t.id = m.posting_team_id and t.owner_id = auth.uid())
        or exists (select 1 from public.teams t where t.id = m.accepting_team_id and t.owner_id = auth.uid())
        or exists (
          select 1 from public.team_members tm
          where tm.team_id in (m.posting_team_id, m.accepting_team_id)
            and tm.user_id = auth.uid()
        )
      )
  )
);

notify pgrst, 'reload schema';
