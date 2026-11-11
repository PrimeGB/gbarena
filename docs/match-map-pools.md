# Match map assignments

New accepted matches randomly draw maps without replacement until their configured pool is exhausted; longer series reshuffle the pool. The selected maps and host rotation are saved with the match and do not change if rankings or pools change later. Matches accepted before this feature are not changed.

The first host is the team with the higher position on its own system's ladder at acceptance. A ranked team takes priority over an unranked team. If positions are equal or both teams are unranked, the posting team hosts first. Hosts alternate for the remaining games.

The initial pools cover these documented historical Call of Duty competitive rotations. They are snapshots, not a claim that the current in-game playlist still uses the same rotation:

| Game | Supported modes | Reference |
| --- | --- | --- |
| Modern Warfare (2019) | Search and Destroy, Hardpoint, Domination | [2020 championship](https://liquipedia.net/callofduty/Call_of_Duty_League/Season_1/Playoffs) |
| Black Ops Cold War | Search and Destroy, Hardpoint, Control | [2021 championship](https://liquipedia.net/callofduty/Call_of_Duty_League/Season_2/Playoffs) |
| Vanguard | Search and Destroy, Hardpoint, Control | [2022 season pool](https://liquipedia.net/callofduty/Template:CDL_2022_Map_Pool) |
| Modern Warfare II (2022) | Search and Destroy, Hardpoint, Control | [2023 championship](https://liquipedia.net/callofduty/Call_of_Duty_League/Season_4/Playoffs) |
| Modern Warfare III (2023) | Search and Destroy, Hardpoint, Control | [2024 Stage 4](https://liquipedia.net/callofduty/Call_of_Duty_League/Season_5/Stage_4/Major) |
| Black Ops 6 | Search and Destroy, Hardpoint, Control | [2025 championship](https://liquipedia.net/callofduty/Call_of_Duty_League/Season_6/Playoffs) |
| Modern Warfare 2 (2009) | Search and Destroy | [MW2 tournament rules](https://hpgtournaments.weebly.com/rules-for-mw2.html) |
| Black Ops (2010) | Search and Destroy, Domination | [2011 MLG championship](https://cod-esports.fandom.com/wiki/MLG_National_Championship_2011) |

Other games and modes remain unassigned until a suitable mode-specific pool is verified. Some games use changing in-game rotations, a fixed arena, player-created maps, or no selectable map, so a generic pool must not be used. Update `public.match_map_pools` through a reviewed migration when adding or revising a pool; existing matches retain their original assignments.
