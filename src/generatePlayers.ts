import { db } from './database';

// ─── Name Pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'James', 'Marcus', 'Tyler', 'Jordan', 'Derek', 'Chris', 'Mike', 'Ryan',
  'Jake', 'Aaron', 'Kevin', 'Brandon', 'Justin', 'Travis', 'Logan', 'Darius',
  'Malik', 'Isaiah', 'Tyrone', 'Jamal', 'Andre', 'Dominic', 'Elijah', 'Xavier',
  'Terrell', 'Cameron', 'Devin', 'Jaylen', 'Trevon', 'Kendall', 'Carlos',
  'Anthony', 'Nathan', 'Kyle', 'Evan', 'Corey', 'Donte', 'Tanner', 'Cole',
  'Brock', 'Hunter', 'Drew', 'Blake', 'Grant', 'Chase', 'Bryce', 'Zach',
  'Will', 'Cody', 'Deon', 'Marquise', 'Jalen', 'Devon', 'Rashad', 'Desmond',
  'Quinton', 'Reginald', 'Sterling', 'Dwayne', 'Orlando', 'Tremayne',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
  'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright',
  'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson',
  'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell',
  'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris',
  'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Cooper',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[ri(0, arr.length - 1)];
}

function clamp(val: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, val));
}

function genName() {
  return { first_name: pick(FIRST_NAMES), last_name: pick(LAST_NAMES) };
}

// ─── Archetype ────────────────────────────────────────────────────────────────
// Weighted distribution across 7 personality archetypes.
// 'normal' is the most common — no chemistry/progression effect.

function genArchetype(): string {
  const r = Math.random();
  if (r < 0.05) return 'troublemaker'; //  5%
  if (r < 0.12) return 'selfish';      //  7%
  if (r < 0.22) return 'team_leader';  // 10%
  if (r < 0.30) return 'vocal_leader'; //  8%
  if (r < 0.45) return 'coachable';    // 15%
  if (r < 0.65) return 'hard_worker';  // 20%
  return 'normal';                      // 35%
}

// ─── Position Labels ──────────────────────────────────────────────────────────

const POSITION_LABEL_POOLS: Record<string, string[]> = {
  QB: ['QB'],
  RB: ['HB', 'HB', 'HB', 'FB'],
  WR: ['WR'],
  TE: ['TE'],
  OL: ['LT', 'LG', 'C', 'RG', 'RT', 'LT', 'LG', 'RG', 'RT'],
  DL: ['DE', 'DE', 'DT', 'DT', 'DE', 'DT', 'DE'],
  LB: ['MLB', 'OLB', 'OLB', 'MLB', 'OLB', 'OLB', 'MLB'],
  CB: ['CB'],
  S:  ['FS', 'SS', 'FS', 'SS', 'FS'],
  K:  ['K'],
  P:  ['P'],
};

// ─── Overall Rating by Roster Slot ───────────────────────────────────────────

function getOverall(index: number, total: number): number {
  const ratio = index / total;
  if (ratio < 0.20) return ri(80, 95);
  if (ratio < 0.50) return ri(72, 84);
  if (ratio < 0.75) return ri(64, 76);
  return ri(56, 68);
}

function getFaOverall(): number {
  return ri(55, 76);
}

// ─── Dev Trait ────────────────────────────────────────────────────────────────

function devTrait(ovr: number): string {
  const r = Math.random();
  if (ovr >= 90) return r < 0.05 ? 'X-Factor' : r < 0.25 ? 'Superstar' : r < 0.85 ? 'Star' : 'Normal';
  if (ovr >= 85) return r < 0.02 ? 'X-Factor' : r < 0.14 ? 'Superstar' : r < 0.74 ? 'Star' : 'Normal';
  if (ovr >= 80) return r < 0.005 ? 'X-Factor' : r < 0.055 ? 'Superstar' : r < 0.505 ? 'Star' : 'Normal';
  if (ovr >= 70) return r < 0.001 ? 'X-Factor' : r < 0.011 ? 'Superstar' : r < 0.211 ? 'Star' : 'Normal';
  return r < 0.04 ? 'Star' : 'Normal';
}

// ─── Age by Role ──────────────────────────────────────────────────────────────

function getAge(index: number, total: number): number {
  const ratio = index / total;
  if (ratio < 0.20) return ri(24, 33);
  if (ratio < 0.50) return ri(22, 30);
  return ri(21, 27);
}

// ─── Position-Specific Attributes ────────────────────────────────────────────

interface Attrs {
  speed: number; strength: number; awareness: number;
  throw_accuracy: number; throw_power: number;
  catching: number; route_running: number;
  tackle_rating: number; coverage: number; pass_rush: number;
  kickpower: number; kickaccuracy: number;
  runblocking: number; passblocking: number;
  // Expanded Madden-style attrs (v27)
  acceleration: number; agility: number;
  throw_under_pressure: number; play_action: number;
  elusiveness: number; trucking: number; break_tackle: number;
  spectacular_catch: number; catch_in_traffic: number; release_rating: number;
  hit_power: number; pursuit: number;
  block_shedding: number; power_moves: number; finesse_moves: number;
  play_recognition: number; man_coverage: number;
}

function genAttrs(position: string, ovr: number): Attrs {
  const b = (lo: number, hi: number) => clamp(ri(ovr + lo, ovr + hi), 40, 99);
  const flat = (lo: number, hi: number) => ri(lo, hi);

  const base: Attrs = {
    speed: b(-15, 5), strength: b(-15, 5), awareness: b(-10, 8),
    throw_accuracy: 40, throw_power: 40, catching: 40, route_running: 40,
    tackle_rating: 40, coverage: 40, pass_rush: 40,
    kickpower: 40, kickaccuracy: 40, runblocking: 40, passblocking: 40,
    acceleration: b(-12, 5), agility: b(-15, 5),
    throw_under_pressure: 40, play_action: 40,
    elusiveness: 40, trucking: 40, break_tackle: 40,
    spectacular_catch: 40, catch_in_traffic: 40, release_rating: 40,
    hit_power: 40, pursuit: 40,
    block_shedding: 40, power_moves: 40, finesse_moves: 40,
    play_recognition: b(-10, 8), man_coverage: 40,
  };

  switch (position) {
    case 'QB': return { ...base,
      speed:                b(-22, -5),
      acceleration:         b(-18, -3),
      agility:              b(-22, -5),
      strength:             b(-18, -3),
      awareness:            b(-4, 10),
      throw_accuracy:       b(-5, 8),
      throw_power:          b(-8, 8),
      throw_under_pressure: b(-8, 8),
      play_action:          b(-8, 8),
      play_recognition:     b(-4, 10),
    };
    case 'RB': return { ...base,
      speed:        b(-5, 12),
      acceleration: b(-3, 13),
      agility:      b(-3, 13),
      strength:     b(-8, 8),
      catching:     b(-14, 3),
      awareness:    b(-10, 5),
      elusiveness:  b(-5, 10),
      trucking:     b(-8, 8),
      break_tackle: b(-5, 10),
      pursuit:      b(-12, 3),
    };
    case 'WR': return { ...base,
      speed:             b(-3, 13),
      acceleration:      b(-2, 15),
      agility:           b(-3, 13),
      strength:          b(-22, -6),
      catching:          b(-4, 10),
      route_running:     b(-8, 8),
      awareness:         b(-10, 5),
      spectacular_catch: b(-5, 10),
      catch_in_traffic:  b(-8, 5),
      release_rating:    b(-5, 10),
      break_tackle:      b(-14, 2),
    };
    case 'TE': return { ...base,
      speed:             b(-12, 3),
      acceleration:      b(-8, 5),
      agility:           b(-10, 3),
      strength:          b(-8, 8),
      catching:          b(-8, 8),
      route_running:     b(-14, 2),
      awareness:         b(-8, 5),
      spectacular_catch: b(-8, 5),
      catch_in_traffic:  b(-5, 8),
      release_rating:    b(-12, 2),
      break_tackle:      b(-8, 5),
    };
    case 'OL': return { ...base,
      speed:        b(-26, -10),
      acceleration: flat(40, 60),
      agility:      flat(40, 60),
      strength:     b(-3, 13),
      awareness:    b(-8, 5),
      runblocking:  b(-5, 10),
      passblocking: b(-5, 10),
    };
    case 'DL': return { ...base,
      speed:            b(-12, 3),
      acceleration:     b(-10, 5),
      agility:          b(-12, 3),
      strength:         b(-3, 13),
      awareness:        b(-10, 5),
      tackle_rating:    b(-8, 8),
      pass_rush:        b(-5, 10),
      block_shedding:   b(-5, 10),
      power_moves:      b(-5, 10),
      finesse_moves:    b(-8, 8),
      pursuit:          b(-8, 8),
      hit_power:        b(-5, 10),
      play_recognition: b(-8, 5),
    };
    case 'LB': return { ...base,
      speed:            b(-8, 5),
      acceleration:     b(-8, 5),
      agility:          b(-8, 5),
      strength:         b(-8, 8),
      awareness:        b(-5, 8),
      tackle_rating:    b(-5, 10),
      coverage:         b(-16, 0),
      man_coverage:     b(-14, 0),
      pass_rush:        b(-12, 3),
      block_shedding:   b(-14, 2),
      hit_power:        b(-5, 10),
      pursuit:          b(-5, 10),
      play_recognition: b(-5, 8),
    };
    case 'CB': return { ...base,
      speed:            b(-3, 13),
      acceleration:     b(-2, 13),
      agility:          b(-3, 13),
      strength:         b(-22, -5),
      awareness:        b(-8, 5),
      tackle_rating:    b(-16, 0),
      coverage:         b(-5, 10),
      man_coverage:     b(-3, 13),
      pursuit:          b(-5, 8),
      hit_power:        b(-14, 0),
      play_recognition: b(-5, 8),
      release_rating:   flat(40, 65),
    };
    case 'S': return { ...base,
      speed:            b(-5, 8),
      acceleration:     b(-5, 8),
      agility:          b(-5, 8),
      strength:         b(-12, 3),
      awareness:        b(-5, 8),
      tackle_rating:    b(-8, 8),
      coverage:         b(-8, 8),
      man_coverage:     b(-8, 5),
      hit_power:        b(-5, 10),
      pursuit:          b(-5, 10),
      play_recognition: b(-3, 10),
    };
    case 'K': return { ...base,
      speed:        flat(48, 72),
      strength:     flat(48, 72),
      awareness:    b(-8, 5),
      kickpower:    b(-5, 10),
      kickaccuracy: b(-5, 10),
    };
    case 'P': return { ...base,
      speed:        flat(48, 68),
      strength:     flat(48, 68),
      awareness:    b(-8, 5),
      kickpower:    b(-3, 12),   // leg strength drives punt distance
      kickaccuracy: b(-5, 8),    // directional accuracy
    };
    default: return base;
  }
}

// ─── Roster Configuration ─────────────────────────────────────────────────────
// 53 players per team

const ROSTER_SLOTS: { position: string; count: number }[] = [
  { position: 'QB', count: 3  },
  { position: 'RB', count: 5  },
  { position: 'WR', count: 6  },
  { position: 'TE', count: 3  },
  { position: 'OL', count: 9  },
  { position: 'DL', count: 7  },
  { position: 'LB', count: 7  },
  { position: 'CB', count: 7  },
  { position: 'S',  count: 5  },
  { position: 'K',  count: 1  },
  { position: 'P',  count: 1  },
];

const FA_SLOTS: { position: string; count: number }[] = [
  { position: 'QB', count: 8  },
  { position: 'RB', count: 18 },
  { position: 'WR', count: 22 },
  { position: 'TE', count: 12 },
  { position: 'OL', count: 28 },
  { position: 'DL', count: 22 },
  { position: 'LB', count: 22 },
  { position: 'CB', count: 22 },
  { position: 'S',  count: 16 },
  { position: 'K',  count: 6  },
  { position: 'P',  count: 4  },
];

// ─── Main Export ──────────────────────────────────────────────────────────────

export function generatePlayers(): void {
    const insert = db.prepare(`
    INSERT INTO players (
      first_name, last_name, position, position_label, age, overall_rating,
      speed, strength, awareness, dev_trait,
      throw_accuracy, throw_power, catching, route_running,
      tackle_rating, coverage, pass_rush,
      kickpower, kickaccuracy, runblocking, passblocking,
      acceleration, agility,
      throw_under_pressure, play_action,
      elusiveness, trucking, break_tackle,
      spectacular_catch, catch_in_traffic, release_rating,
      hit_power, pursuit,
      block_shedding, power_moves, finesse_moves,
      play_recognition, man_coverage,
      archetype, team_id, is_free_agent, roster_status
    ) VALUES (
      @first_name, @last_name, @position, @position_label, @age, @overall_rating,
      @speed, @strength, @awareness, @dev_trait,
      @throw_accuracy, @throw_power, @catching, @route_running,
      @tackle_rating, @coverage, @pass_rush,
      @kickpower, @kickaccuracy, @runblocking, @passblocking,
      @acceleration, @agility,
      @throw_under_pressure, @play_action,
      @elusiveness, @trucking, @break_tackle,
      @spectacular_catch, @catch_in_traffic, @release_rating,
      @hit_power, @pursuit,
      @block_shedding, @power_moves, @finesse_moves,
      @play_recognition, @man_coverage,
      @archetype, @team_id, @is_free_agent, @roster_status
    )
  `);

  const teams = db.prepare('SELECT id FROM teams').all() as { id: number }[];
  let total = 0;

  db.transaction(() => {
    // Rostered players
    for (const team of teams) {
      for (const slot of ROSTER_SLOTS) {
        const labels = POSITION_LABEL_POOLS[slot.position] ?? [slot.position];
        for (let i = 0; i < slot.count; i++) {
          const ovr = getOverall(i, slot.count);
          const attrs = genAttrs(slot.position, ovr);
          insert.run({
            ...genName(),
            position: slot.position,
            position_label: labels[i % labels.length],
            age: getAge(i, slot.count),
            overall_rating: ovr,
            ...attrs,
            dev_trait: devTrait(ovr),
            archetype: genArchetype(),
            team_id: team.id,
            is_free_agent: 0,
            roster_status: 'active',
          });
          total++;
        }
      }
    }

    // Free agent pool
    for (const slot of FA_SLOTS) {
      const labels = POSITION_LABEL_POOLS[slot.position] ?? [slot.position];
      for (let i = 0; i < slot.count; i++) {
        const ovr = getFaOverall();
        const attrs = genAttrs(slot.position, ovr);
        insert.run({
          ...genName(),
          position: slot.position,
          position_label: labels[i % labels.length],
          age: ri(22, 34),
          overall_rating: ovr,
          ...attrs,
          dev_trait: devTrait(ovr),
          archetype: genArchetype(),
          team_id: null,
          is_free_agent: 1,
          roster_status: 'free_agent',
        });
        total++;
      }
    }
  })();

  console.log(`${total} players generated (${teams.length * 53} rostered, ${FA_SLOTS.reduce((s, g) => s + g.count, 0)} free agents)`);
}

const MIN_FA_PER_POSITION: Record<string, number> = {
  QB: 10, RB: 22, WR: 28, TE: 14, OL: 28, DL: 24, LB: 24, CB: 24, S: 18, K: 6,
};

export function replenishFAPool(): void {
  const insert = db.prepare(`
    INSERT INTO players (
      first_name, last_name, position, position_label, age, overall_rating,
      speed, strength, awareness, dev_trait,
      throw_accuracy, throw_power, catching, route_running,
      tackle_rating, coverage, pass_rush,
      kickpower, kickaccuracy, runblocking, passblocking,
      archetype, team_id, is_free_agent, roster_status
    ) VALUES (
      @first_name, @last_name, @position, @position_label, @age, @overall_rating,
      @speed, @strength, @awareness, @dev_trait,
      @throw_accuracy, @throw_power, @catching, @route_running,
      @tackle_rating, @coverage, @pass_rush,
      @kickpower, @kickaccuracy, @runblocking, @passblocking,
      @archetype, NULL, 1, 'free_agent'
    )
  `);

  db.transaction(() => {
    for (const [position, min] of Object.entries(MIN_FA_PER_POSITION)) {
      const current = (db.prepare(
        "SELECT COUNT(*) as cnt FROM players WHERE is_free_agent = 1 AND position = ?"
      ).get(position) as any).cnt as number;
      const toGenerate = Math.max(0, min - current);
      const labels = POSITION_LABEL_POOLS[position] ?? [position];
      for (let i = 0; i < toGenerate; i++) {
        const ovr = getFaOverall();
        const attrs = genAttrs(position, ovr);
        insert.run({
          ...genName(),
          position,
          position_label: labels[i % labels.length],
          age: ri(21, 31),
          overall_rating: ovr,
          ...attrs,
          dev_trait: devTrait(ovr),
          archetype: genArchetype(),
        });
      }
    }
  })();
}
