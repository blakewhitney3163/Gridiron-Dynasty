# Gridiron Dynasty — CSV Import Schema

## Historical Records CSV

Import all-time leaders or single-season records via **Records → IMPORT ALL-TIME** or **IMPORT SEASON**.

### Required Columns

| Column | Type | Description |
|--------|------|-------------|
| `category` | string | See valid values below |
| `rank` | integer | Rank within the category (1 = best) |
| `player_name` | string | Full player name |
| `team_display` | string | Team name or abbreviation to display |
| `position` | string | `QB`, `RB`, `WR`, `TE`, `OL`, `DL`, `LB`, `CB`, `S`, `K` |
| `season` | integer | Year (season records only; leave blank for all-time) |
| `games_played` | integer | Career or season games played |

### Stat Columns (include all; unused ones can be 0)

| Column | Description |
|--------|-------------|
| `pass_yards` | Passing yards |
| `pass_tds` | Passing touchdowns |
| `interceptions` | Interceptions thrown |
| `completions` | Completions |
| `pass_attempts` | Pass attempts |
| `rush_yards` | Rushing yards |
| `rush_tds` | Rushing touchdowns |
| `rush_attempts` | Rush attempts |
| `rec_yards` | Receiving yards |
| `rec_tds` | Receiving touchdowns |
| `receptions` | Receptions |
| `tackles` | Solo tackles |
| `assisted_tackles` | Assisted tackles |
| `sacks` | Sacks (decimal OK, e.g. `12.5`) |
| `def_interceptions` | Defensive interceptions |
| `pass_deflections` | Pass deflections |
| `forced_fumbles` | Forced fumbles |

### Valid `category` Values

| Value | Records Tab Label |
|-------|------------------|
| `passing` | Passing (yards) |
| `rushing` | Rushing (yards) |
| `receiving` | Receiving (yards) |
| `passTds` | Pass TDs |
| `tds` | Skill TDs |
| `tackles` | Tackles |
| `sacks` | Sacks |
| `defInts` | INTs / PDs |

### Example Row

```csv
category,rank,player_name,team_display,position,season,games_played,pass_yards,pass_tds,interceptions,completions,pass_attempts,rush_yards,rush_tds,rush_attempts,rec_yards,rec_tds,receptions,tackles,assisted_tackles,sacks,def_interceptions,pass_deflections,forced_fumbles
passing,1,Tom Brady,New England,QB,,335,89214,649,212,6377,11317,0,0,0,0,0,0,0,0,0,0,0,0
