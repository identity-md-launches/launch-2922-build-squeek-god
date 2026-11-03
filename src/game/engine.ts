export type Effect = "sunrise" | "storm" | "eclipse" | "night" | "festival";
export type Source = "connecting" | "live" | "demo";
export interface Reading {
  source: "live" | "demo";
  active: boolean;
  rpm: number;
  speed: number;
  distance: number;
  observedAt: string;
  epoch: string;
}
export interface Chronicle {
  id: number;
  text: string;
  kind: "good" | "omen" | "info";
  at: number;
}
export interface Prayer {
  words: string;
  goal: number;
  progress: number;
  complete: boolean;
  source: Source;
}
export interface GameState {
  version: 1;
  entered: boolean;
  paused: boolean;
  tick: number;
  demoTick: number;
  seeds: number;
  wood: number;
  faith: number;
  homes: number;
  level: number;
  xp: number;
  crops: (number | null)[];
  waterAt: number;
  greetAt: number;
  feastAt: number;
  source: Source;
  reading: Reading | null;
  distance: number;
  nextMilestone: number;
  effect: Effect;
  effectUntil: number;
  shelteredUntil: number;
  day: number;
  prayer: Prayer | null;
  events: Chronicle[];
  eventId: number;
  notice: string;
  lastWorldEvent: string;
  festivalUntil: number;
  frostApplied: boolean;
}
export type Action =
  | { type: "ENTER" }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "PLANT"; plot?: number }
  | { type: "HARVEST"; plot?: number }
  | { type: "WATER" }
  | { type: "BUILD" }
  | { type: "GREET"; name: string }
  | { type: "FEAST" }
  | { type: "SHELTER" }
  | { type: "PRAY"; words: string; goal: number }
  | { type: "CLAIM_PRAYER" }
  | { type: "SOURCE"; source: Source; reason?: string }
  | { type: "READING"; reading: Reading }
  | { type: "NEXT_DEMO" }
  | { type: "WORLD_EVENT"; id: string; text: string };

export function initialState(): GameState {
  return {
    version: 1,
    entered: false,
    paused: false,
    tick: 0,
    demoTick: 0,
    seeds: 30,
    wood: 45,
    faith: 12,
    homes: 3,
    level: 1,
    xp: 0,
    crops: [100, 100, 38, 20, null, null],
    waterAt: -15,
    greetAt: -30,
    feastAt: -40,
    source: "connecting",
    reading: null,
    distance: 0,
    nextMilestone: 500,
    effect: "sunrise",
    effectUntil: 0,
    shelteredUntil: 0,
    day: 1,
    prayer: null,
    events: [
      {
        id: 1,
        text: "Acorn Hollow awaits its keeper. Two crops are ready to harvest.",
        kind: "info",
        at: 0,
      },
    ],
    eventId: 1,
    notice: "",
    lastWorldEvent: "",
    festivalUntil: 0,
    frostApplied: false,
  };
}
function log(
  s: GameState,
  text: string,
  kind: Chronicle["kind"] = "info",
): GameState {
  const id = s.eventId + 1;
  return {
    ...s,
    eventId: id,
    events: [{ id, text, kind, at: s.tick }, ...s.events].slice(0, 30),
    notice: text,
  };
}
function gain(s: GameState, xp: number): GameState {
  const total = s.xp + xp;
  if (total < 100) return { ...s, xp: total };
  return log(
    { ...s, level: s.level + Math.floor(total / 100), xp: total % 100 },
    `Village level ${s.level + Math.floor(total / 100)}! The valley glows a little brighter.`,
    "good",
  );
}
function advanceDistance(s: GameState, delta: number): GameState {
  if (!Number.isFinite(delta) || delta <= 0) return s;
  let n = { ...s, distance: s.distance + delta };
  if (n.prayer && !n.prayer.complete && n.prayer.source === n.source) {
    const progress = Math.min(n.prayer.goal, n.prayer.progress + delta);
    n = {
      ...n,
      prayer: { ...n.prayer, progress, complete: progress >= n.prayer.goal },
    };
    if (n.prayer?.complete)
      n = log(
        n,
        "Your prayer was answered! Claim the blessing at the shrine.",
        "good",
      );
  }
  if (n.distance >= n.nextMilestone) {
    const count = Math.floor((n.distance - n.nextMilestone) / 500) + 1;
    n = gain(
      {
        ...n,
        nextMilestone: n.nextMilestone + count * 500,
        seeds: n.seeds + count * 15,
        wood: n.wood + count * 10,
        festivalUntil: n.tick + 20,
      },
      count * 30,
    );
    n = log(
      n,
      `${Math.floor(n.distance / 500) * 500} m travelled! Great Harvest: +${count * 15} seeds, +${count * 10} wood.`,
      "good",
    );
  }
  return n;
}
export function demoReading(tick: number): Reading {
  const phase = tick % 80;
  const active = phase < 46;
  const rpm = active
    ? phase >= 28
      ? 108 + Math.sin(tick) * 8
      : 56 + Math.sin(tick / 3) * 12
    : 0;
  return {
    source: "demo",
    active,
    rpm,
    speed: rpm * 0.0146,
    distance: 0,
    observedAt: new Date().toISOString(),
    epoch: "demo",
  };
}
function applyReading(s: GameState, r: Reading): GameState {
  let n: GameState = { ...s, reading: r };
  if (!s.entered)
    return {
      ...n,
      effect: r.active ? (r.rpm >= 90 ? "storm" : "sunrise") : "night",
    };
  if (s.paused) return n;
  const previous = s.reading;
  if (
    r.source === "live" &&
    previous?.source === "live" &&
    r.epoch === previous.epoch &&
    r.observedAt !== previous.observedAt
  ) {
    // The device distance is a noon-to-noon counter. A reset establishes a new baseline.
    if (r.distance >= previous.distance)
      n = advanceDistance(n, Math.min(r.distance - previous.distance, 20000));
  }
  if (previous?.active && !r.active && previous.source === r.source) {
    n = log(
      {
        ...n,
        effect: "eclipse",
        effectUntil: n.tick + 12,
        frostApplied: false,
      },
      "The wheel stopped. A rare eclipse freezes the valley! Shelter the crops.",
      "omen",
    );
  } else if (r.active && (!previous?.active || previous.source !== r.source)) {
    n = log(
      { ...n, effect: "sunrise", day: n.day + 1 },
      "Squeektoshi runs! The sun rises and the village awakens.",
      "good",
    );
  }
  return n;
}
export function reducer(state: GameState, action: Action): GameState {
  let s = { ...state };
  if (action.type === "ENTER")
    return log(
      { ...s, entered: true },
      "Welcome, keeper. Harvest the golden crops, then plant something hopeful.",
      "good",
    );
  if (action.type === "SOURCE") {
    if (s.source === action.source) return s;
    s = { ...s, source: action.source, reading: null, effectUntil: 0 };
    if (s.prayer && !s.prayer.complete)
      s = { ...s, prayer: { ...s.prayer, source: action.source, progress: 0 } };
    return log(
      s,
      action.reason ??
        (action.source === "live"
          ? "Connected to Squeektoshi’s real wheel."
          : action.source === "demo"
            ? "Demo mode: simulated activity, 12× distance. Your village stays local."
            : "Listening for the real hamster…"),
    );
  }
  if (action.type === "READING") return applyReading(s, action.reading);
  if (!s.entered) return s;
  if (action.type === "PAUSE")
    return {
      ...s,
      paused: !s.paused,
      notice: s.paused
        ? "The village is awake again."
        : "Village paused. Live telemetry still updates.",
    };
  if (s.paused) return { ...s, notice: "Resume the village to continue." };
  switch (action.type) {
    case "TICK": {
      s.tick++;
      if (s.source === "demo") {
        s.demoTick++;
        const r = demoReading(s.demoTick);
        s = applyReading(s, {
          ...r,
          distance:
            (s.reading?.source === "demo" ? s.reading.distance : 0) +
            r.speed * 12,
        });
        s = advanceDistance(s, r.speed * 12);
      }
      if (s.effect === "eclipse" && s.tick < s.effectUntil) {
        if (s.tick === s.effectUntil - 1 && !s.frostApplied) {
          if (s.shelteredUntil > s.tick)
            s = log(
              s,
              "Safe under the canopy. Your crops survived the eclipse.",
              "good",
            );
          else
            s = log(
              {
                ...s,
                crops: s.crops.map((c) =>
                  c === null ? null : Math.max(0, c - 15),
                ),
              },
              "Frost nibbled 15% of your crops. Water them to recover.",
              "omen",
            );
          s.frostApplied = true;
        }
      } else {
        const next =
          s.festivalUntil > s.tick
            ? "festival"
            : s.reading?.active
              ? s.reading.rpm >= 90
                ? "storm"
                : "sunrise"
              : "night";
        if (next === "storm" && s.effect !== "storm")
          s = log(
            s,
            "Squeek Storm! Fast paws bring electric rain. Crops grow twice as fast.",
            "omen",
          );
        s.effect = next;
      }
      const growth =
        s.effect === "storm"
          ? 3.6
          : s.effect === "festival"
            ? 4
            : s.effect === "sunrise"
              ? 1.8
              : 0;
      s.crops = s.crops.map((c) =>
        c === null ? null : Math.min(100, c + growth),
      );
      // Resting villagers still produce a little faith, keeping night fully playable.
      if (s.tick % 20 === 0) s.faith += 1;
      return s;
    }
    case "PLANT": {
      const i = action.plot ?? s.crops.findIndex((c) => c === null);
      if (i < 0 || i >= 6 || s.crops[i] !== null)
        return {
          ...s,
          notice: "All plots are planted. Harvest a ripe crop to make room.",
        };
      if (s.seeds < 2)
        return {
          ...s,
          notice:
            "Planting costs 2 seeds. Harvest a ripe crop or fulfil a prayer.",
        };
      s.crops = [...s.crops];
      s.crops[i] = 0;
      s.seeds -= 2;
      return log(
        s,
        "A moon-carrot is planted. Sunlight or watering will help it grow.",
        "good",
      );
    }
    case "HARVEST": {
      const plots =
        action.plot === undefined
          ? s.crops
              .map((c, i) => (c !== null && c >= 100 ? i : -1))
              .filter((i) => i >= 0)
          : [action.plot].filter(
              (i) => i >= 0 && i < 6 && (s.crops[i] ?? 0) >= 100,
            );
      if (!plots.length)
        return {
          ...s,
          notice:
            "Nothing ripe just yet. Water crops, or wait for Squeektoshi to run.",
        };
      s.crops = s.crops.map((c, i) => (plots.includes(i) ? null : c));
      s = gain(
        {
          ...s,
          seeds: s.seeds + plots.length * 8,
          wood: s.wood + plots.length * 3,
          faith: s.faith + plots.length * 2,
        },
        plots.length * 8,
      );
      return log(
        s,
        `Harvest collected! +${plots.length * 8} seeds, +${plots.length * 3} wood, +${plots.length * 2} faith.`,
        "good",
      );
    }
    case "WATER": {
      if (s.tick - s.waterAt < 12)
        return {
          ...s,
          notice: `Let the soil soak. Water again in ${12 - (s.tick - s.waterAt)} seconds.`,
        };
      if (!s.crops.some((c) => c !== null && c < 100))
        return {
          ...s,
          notice: "Plant a crop first. Ripe crops are ready to harvest.",
        };
      s.crops = s.crops.map((c) => (c === null ? null : Math.min(100, c + 18)));
      s.waterAt = s.tick;
      return log(
        s,
        "A little care goes a long way. All growing crops gain 18%.",
        "good",
      );
    }
    case "BUILD": {
      if (s.homes >= 6)
        return {
          ...s,
          notice: "Six cozy cottages! Acorn Hollow is fully built.",
        };
      if (s.wood < 30 || s.seeds < 15)
        return {
          ...s,
          notice:
            "A cottage needs 30 wood and 15 seeds. Harvest to gather supplies.",
        };
      return log(
        gain(
          { ...s, wood: s.wood - 30, seeds: s.seeds - 15, homes: s.homes + 1 },
          25,
        ),
        "A new cottage! Two hamsters move into Acorn Hollow.",
        "good",
      );
    }
    case "GREET": {
      if (s.tick - s.greetAt < 25)
        return {
          ...s,
          notice: `${action.name}: “May your cheeks always be full.” Say hello again soon.`,
        };
      s.greetAt = s.tick;
      return log(
        { ...s, faith: s.faith + 3 },
        `${action.name}: “A seed today, a feast tomorrow!” +3 faith.`,
        "good",
      );
    }
    case "FEAST": {
      if (s.tick - s.feastAt < 35)
        return {
          ...s,
          notice:
            "The villagers are still full. Prepare another feast in a little while.",
        };
      if (s.seeds < 5)
        return {
          ...s,
          notice: "A village feast costs 5 seeds. Collect a harvest first.",
        };
      return log(
        gain(
          { ...s, seeds: s.seeds - 5, faith: s.faith + 8, feastAt: s.tick },
          10,
        ),
        "Cheeks full. Hearts fuller. The village feast grants +8 faith.",
        "good",
      );
    }
    case "SHELTER": {
      if (s.shelteredUntil > s.tick)
        return {
          ...s,
          notice: "The village canopy is already protecting your crops.",
        };
      if (s.wood < 5)
        return {
          ...s,
          notice: "A canopy needs 5 wood. Harvest crops to collect wood.",
        };
      return log(
        { ...s, wood: s.wood - 5, shelteredUntil: s.tick + 30 },
        "Canopy raised for 30 seconds. Your crops are safe from frost.",
        "good",
      );
    }
    case "PRAY": {
      if (s.prayer)
        return {
          ...s,
          notice: "One prayer at a time. Let the wheel answer this one.",
        };
      if (s.faith < 5)
        return {
          ...s,
          notice:
            "A prayer needs 5 faith. Greet a villager or collect a harvest.",
        };
      const words = action.words.trim();
      if (
        !words ||
        words.length > 120 ||
        ![100, 250, 500].includes(action.goal)
      )
        return {
          ...s,
          notice:
            "Write a prayer of 1–120 characters and choose a distance goal.",
        };
      return log(
        {
          ...s,
          faith: s.faith - 5,
          prayer: {
            words,
            goal: action.goal,
            progress: 0,
            complete: false,
            source: s.source,
          },
        },
        `Prayer sent to the sky. ${action.goal} m of new wheel distance will bring a blessing.`,
        "good",
      );
    }
    case "CLAIM_PRAYER": {
      if (!s.prayer?.complete)
        return {
          ...s,
          notice:
            "The wheel has not answered yet. Your prayer is still in the sky.",
        };
      return log(
        gain(
          {
            ...s,
            prayer: null,
            seeds: s.seeds + 20,
            wood: s.wood + 10,
            faith: s.faith + 10,
          },
          25,
        ),
        "Blessing received! +20 seeds, +10 wood and +10 faith.",
        "good",
      );
    }
    case "NEXT_DEMO": {
      if (s.source !== "demo") return s;
      const phase = s.demoTick % 80;
      const offset = phase < 28 ? 28 : phase < 46 ? 46 : phase < 64 ? 64 : 80;
      s.demoTick = s.demoTick - phase + offset;
      s = applyReading(s, {
        ...demoReading(s.demoTick),
        distance: s.reading?.distance ?? 0,
      });
      return log(s, "Demo simulation advanced to the next omen.");
    }
    case "WORLD_EVENT": {
      if (s.lastWorldEvent === action.id) return s;
      return log(
        gain(
          {
            ...s,
            lastWorldEvent: action.id,
            festivalUntil: s.tick + 25,
            seeds: s.seeds + 15,
            faith: s.faith + 5,
          },
          20,
        ),
        `${action.text} A divine festival brings +15 seeds and +5 faith!`,
        "good",
      );
    }
    default:
      return s;
  }
}

export const SAVE_KEY = "squeek-god-v1";
export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    const p = JSON.parse(raw) as Partial<GameState>;
    const validNumbers = [
      "seeds",
      "wood",
      "faith",
      "homes",
      "level",
      "xp",
      "tick",
      "demoTick",
      "distance",
      "nextMilestone",
      "day",
      "waterAt",
      "greetAt",
      "feastAt",
      "eventId",
      "effectUntil",
      "shelteredUntil",
      "festivalUntil",
    ] as const;
    if (
      p.version !== 1 ||
      !validNumbers.every(
        (k) =>
          typeof p[k] === "number" &&
          Number.isFinite(p[k]) &&
          Math.abs(p[k]!) < 1e10,
      ) ||
      !Array.isArray(p.crops) ||
      p.crops.length !== 6 ||
      !p.crops.every(
        (c) => c === null || (typeof c === "number" && c >= 0 && c <= 100),
      )
    )
      return initialState();
    if (
      p.homes! < 3 ||
      p.homes! > 6 ||
      p.level! < 1 ||
      p.seeds! < 0 ||
      p.wood! < 0 ||
      p.faith! < 0
    )
      return initialState();
    const s = initialState();
    const durable = [
      "seeds",
      "wood",
      "faith",
      "homes",
      "level",
      "xp",
      "tick",
      "demoTick",
      "distance",
      "nextMilestone",
      "day",
      "waterAt",
      "greetAt",
      "feastAt",
    ] as const;
    for (const key of durable) s[key] = p[key]!;
    s.crops = [...p.crops];
    s.events = [
      {
        id: 1,
        text: "Acorn Hollow remembers. Your village progress is restored.",
        kind: "info",
        at: s.tick,
      },
    ];
    // Only validated village fields are restored. Live baselines and prayers are session-bound.
    return s;
  } catch {
    return initialState();
  }
}
