update public.tournaments
set prize = null
where title = 'Rapid Royal Trios Kill Race Tournament'
  and prize_credits = 25
  and prize_per_player
  and lower(trim(prize)) = '25 credits per winning player';
