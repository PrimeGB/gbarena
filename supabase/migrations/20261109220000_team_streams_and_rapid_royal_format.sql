create table public.team_streams (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null check (
    length(url) <= 2048
    and url ~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(/.*)?$'
    and url !~ '[[:space:][:cntrl:]]'
    and position(chr(92) in url) = 0
  ),
  is_live boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.team_streams enable row level security;
revoke all on public.team_streams from public, anon, authenticated;

create function public.gb_team_streams(p_team_id uuid)
returns table(user_id uuid, username text, url text, is_live boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select stream.user_id, coalesce(profile.username, 'Player'), stream.url, stream.is_live
  from public.team_streams stream
  join public.teams team on team.id = stream.team_id
  left join public.profiles profile on profile.id = stream.user_id
  where stream.team_id = p_team_id
    and (stream.is_live or stream.user_id = auth.uid())
    and (
      team.owner_id = stream.user_id
      or exists (
        select 1 from public.team_members member
        where member.team_id = stream.team_id and member.user_id = stream.user_id
      )
    )
  order by stream.is_live desc, profile.username, stream.user_id;
$$;

create function public.gb_set_team_stream(p_team_id uuid, p_url text, p_is_live boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to manage your stream.';
  end if;
  if not exists (
    select 1 from public.teams team
    where team.id = p_team_id and (
      team.owner_id = auth.uid() or exists (
        select 1 from public.team_members member
        where member.team_id = team.id and member.user_id = auth.uid()
      )
    )
  ) then
    raise exception 'Only team members can manage their stream.';
  end if;
  if p_url is null or length(p_url) > 2048
     or p_url !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(/.*)?$'
     or p_url ~ '[[:space:][:cntrl:]]' or position(chr(92) in p_url) > 0
     or p_is_live is null then
    raise exception 'Enter a valid HTTPS stream link and live status.';
  end if;
  insert into public.team_streams (team_id, user_id, url, is_live, updated_at)
  values (p_team_id, auth.uid(), p_url, p_is_live, now())
  on conflict (team_id, user_id) do update
  set url = excluded.url, is_live = excluded.is_live, updated_at = now();
end;
$$;

revoke all on function public.gb_team_streams(uuid) from public;
grant execute on function public.gb_team_streams(uuid) to anon, authenticated;
revoke all on function public.gb_set_team_stream(uuid, text, boolean) from public, anon;
grant execute on function public.gb_set_team_stream(uuid, text, boolean) to authenticated;

update public.tournaments
set format = 'Single Elimination - Kill Race',
    team_size = '2v2 or 3v3',
    rules = $rules$TOURNAMENT DATE: TBD - the date and time will be announced here and in Discord.

FORMAT
- Matches can be 2v2 or 3v3. Both teams must use the same number of players. Captains agree on the size before each match; ask staff to decide if they cannot agree.
- Single elimination bracket. Every match is a Best of 1 kill race (finals may be Best of 3).
- Teams must check in 30 minutes before start or they forfeit their spot. Subs must be approved by staff before check-in.

2v2: TAKE TURNS AND SPECTATE
- The teams play their runs one at a time, not simultaneously. Captains agree which team goes first.
- Two players from the playing team enter Rapid Royal with one player from the opposing team. The opposing player eliminates themselves in-game immediately and spectates the playing team. They must not interfere or earn kills.
- When the run ends, record the playing team's total kills. Then reverse roles: the other team plays its run while one player from the first team joins, eliminates themselves and spectates.
- Only the two competing players' kills count. The team with the higher total wins.

3v3: STREAMING REQUIRED
- Each team plays in its own Rapid Royal lobby at the same time. Do not try to join, snipe or interfere with the opposing team's lobby.
- At least one player on EACH team must stream the entire run, from loading in until the final kill count is shown. Share the stream with the opposing team and staff; team members can mark their stream live in the Team Streams box on their team page.
- Streams must be public or shared with staff and show the full game screen, including kills, scoreboard and timer. Keep the stream available until staff confirm the result and retain a recording until the tournament ends.
- If a stream drops, restart it immediately and tell staff. Do not stop playing. Missing stream or footage may result in an automatic loss if the result is disputed.

STARTING A MATCH
- For 3v3, both teams load in and start together when staff or the captains say go. Wait until both teams are fully loaded and ready.
- For 2v2, agree on the order and make sure the opposing spectator is in the lobby before each run starts.
- If a team is not ready 10 minutes after the scheduled time, that team forfeits.

DISCONNECTS AND LAG
- If a player lags out or disconnects, they may rejoin, but the run continues. There are no pauses or restarts.
- Kills made while a player is disconnected do not count for them. The team plays on with whoever is in.
- Repeated lag or disconnects are not a reason to replay unless staff rule that it was a server-wide problem.

SCORING
- Count the competing players' kills until the team is eliminated or the match ends. The team with the most total kills wins. If tied, play a one-life sudden-death round.
- Both captains submit the final kill totals with screenshots. If totals do not match, open a Support ticket within 15 minutes. Staff will review the available evidence.

FAIR PLAY
- Players must use their own account and have their gamer tag verified on their profile.
- No cheating, glitching, exploiting, aim assist hardware, stat boosting or team-killing for kills.
- No teaming up with, or arranging results with, the other team.
- Respect everyone. Harassment, hate speech or toxic behavior means removal from the tournament and a possible ban.
- Staff decisions are final.$rules$
where title = 'Rapid Royal Trios Kill Race Tournament' and game = 'Battlefield 6';

with site_updates as (
  select id from public.forum_posts
  where author = 'Prime' and category = 'News & Updates' and pinned and not hidden
    and subject ilike '%Site Updates%'
  order by created_at desc limit 1
)
update public.forum_posts as post
set message = concat_ws(E'\n\n', nullif(trim(post.message), ''),
  'Team pages now have a Team Streams box where members can share their live streams. The Battlefield 6 Rapid Royal tournament now supports 2v2 and 3v3 matches, with rules for spectators and streaming.')
from site_updates
where post.id = site_updates.id
  and coalesce(post.message, '') not like '%Team pages now have a Team Streams box%';
