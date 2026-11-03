import assert from "node:assert/strict";
import {
  initialState,
  reducer,
  demoReading,
  loadGame,
  SAVE_KEY,
} from "../src/game/engine.ts";
import { parseStatus, parseWorldEvents } from "../src/game/telemetry.ts";
import type { GameState, Action, Reading } from "../src/game/engine.ts";
let count = 0;
function check(name: string, fn: () => void) {
  fn();
  count++;
  console.log(`PASS ${name}`);
}
const act = (s: GameState, a: Action) => reducer(s, a);
const entered = () => act(initialState(), { type: "ENTER" });
const live = (distance = 0, active = true, at = 0, epoch = "a"): Reading => ({
  source: "live",
  active,
  rpm: active ? 60 : 0,
  speed: active ? 1 : 0,
  distance,
  observedAt: new Date(100000 + at * 1000).toISOString(),
  epoch,
});
check("opening actions do not consume resources", () => {
  const s = initialState();
  assert.equal(act(s, { type: "PLANT" }).seeds, 30);
});
check("harvest is atomic and cannot be collected twice", () => {
  const s = act(entered(), { type: "HARVEST" });
  assert.equal(s.seeds, 46);
  assert.equal(s.wood, 51);
  assert.equal(s.faith, 16);
  assert.equal(act(s, { type: "HARVEST" }).seeds, 46);
});
check("plant uses one empty plot and exact seed cost", () => {
  let s = act(entered(), { type: "PLANT" });
  assert.equal(s.seeds, 28);
  assert.equal(s.crops[4], 0);
  s = act(s, { type: "PLANT", plot: 4 });
  assert.equal(s.seeds, 28);
});
check("water works at night and respects cooldown", () => {
  let s = { ...entered(), effect: "night" as const };
  s = act(s, { type: "WATER" });
  assert.equal(s.crops[2], 56);
  s = act(s, { type: "WATER" });
  assert.equal(s.crops[2], 56);
});
check("building pays resources, creates homes, caps at six", () => {
  let s = act(entered(), { type: "BUILD" });
  assert.equal(s.homes, 4);
  assert.equal(s.seeds, 15);
  assert.equal(s.wood, 15);
  assert.equal(act(s, { type: "BUILD" }).homes, 4);
  s = { ...s, wood: 1000, seeds: 1000 };
  for (let i = 0; i < 10; i++) s = act(s, { type: "BUILD" });
  assert.equal(s.homes, 6);
});
check("greeting and feast cooldowns prevent infinite farming", () => {
  let s = act(entered(), { type: "GREET", name: "Mochi" });
  assert.equal(s.faith, 15);
  s = act(s, { type: "GREET", name: "Pip" });
  assert.equal(s.faith, 15);
  s = act(s, { type: "FEAST" });
  assert.equal(s.faith, 23);
  s = act(s, { type: "FEAST" });
  assert.equal(s.faith, 23);
});
check("live prayer counts only new distance and claims once", () => {
  let s = act(entered(), { type: "SOURCE", source: "live" });
  s = act(s, { type: "READING", reading: live(1000) });
  s = act(s, { type: "PRAY", words: "Run for our carrots.", goal: 100 });
  assert.equal(s.faith, 7);
  s = act(s, { type: "READING", reading: live(1100, true, 15) });
  assert.equal(s.prayer?.complete, true);
  assert.equal(s.distance, 100);
  s = act(s, { type: "CLAIM_PRAYER" });
  assert.equal(s.seeds, 50);
  assert.equal(s.prayer, null);
  assert.equal(act(s, { type: "CLAIM_PRAYER" }).seeds, 50);
});
check(
  "daily counter resets and epoch changes do not fabricate distance",
  () => {
    let s = act(entered(), { type: "SOURCE", source: "live" });
    s = act(s, { type: "READING", reading: live(1000) });
    s = act(s, { type: "READING", reading: live(0, true, 15) });
    assert.equal(s.distance, 0);
    s = act(s, { type: "READING", reading: live(9000, true, 30, "b") });
    assert.equal(s.distance, 0);
    s = act(s, { type: "READING", reading: live(9010, true, 45, "b") });
    assert.equal(s.distance, 10);
  },
);
check("prayer progress resets when changing data source", () => {
  let s = act(entered(), { type: "SOURCE", source: "live" });
  s = act(s, { type: "PRAY", goal: 100, words: "Run." });
  s = { ...s, prayer: { ...s.prayer!, progress: 50 } };
  s = act(s, { type: "SOURCE", source: "demo" });
  assert.equal(s.prayer?.progress, 0);
  assert.equal(s.prayer?.source, "demo");
});
check("demo loop grows crops, answers prayer, brings storm and eclipse", () => {
  let s = act(entered(), { type: "SOURCE", source: "demo" });
  s = act(s, { type: "PRAY", words: "Please run.", goal: 100 });
  for (let i = 0; i < 28; i++) s = act(s, { type: "TICK" });
  assert(s.prayer?.complete);
  assert.equal(s.effect, "storm");
  for (let i = 0; i < 18; i++) s = act(s, { type: "TICK" });
  assert.equal(s.effect, "eclipse");
  assert(s.distance > 0);
});
check(
  "unprotected eclipse reduces crop growth, sheltered eclipse does not",
  () => {
    let s = act(entered(), { type: "SOURCE", source: "live" });
    s = act(s, { type: "READING", reading: live(0, true) });
    s = act(s, { type: "READING", reading: live(1, false, 15) });
    assert.equal(s.effect, "eclipse");
    let protectedS = act(s, { type: "SHELTER" });
    for (let i = 0; i < 12; i++) {
      s = act(s, { type: "TICK" });
      protectedS = act(protectedS, { type: "TICK" });
    }
    assert.equal(s.crops[2], 23);
    assert.equal(protectedS.crops[2], 38);
    assert.equal(s.effect, "night");
  },
);
check("500m travel grants a Great Harvest once", () => {
  let s = act(entered(), { type: "SOURCE", source: "live" });
  s = act(s, { type: "READING", reading: live() });
  s = act(s, { type: "READING", reading: live(501, true, 15) });
  assert.equal(s.seeds, 45);
  assert.equal(s.wood, 55);
  assert.equal(s.nextMilestone, 1000);
  s = act(s, { type: "READING", reading: live(501, true, 15) });
  assert.equal(s.seeds, 45);
});
check("pause freezes village and demo clock", () => {
  let s = act(entered(), { type: "SOURCE", source: "demo" });
  s = act(s, { type: "PAUSE" });
  const next = act(s, { type: "TICK" });
  assert.equal(next.tick, 0);
  assert.equal(next.demoTick, 0);
  assert.equal(act(next, { type: "PLANT" }).seeds, 30);
});
check("new real milestone triggers festival, duplicate does not reward", () => {
  let s = act(entered(), {
    type: "WORLD_EVENT",
    id: "test-event",
    text: "Real milestone.",
  });
  assert.equal(s.seeds, 45);
  assert(s.festivalUntil > 0);
  assert.equal(
    act(s, { type: "WORLD_EVENT", id: "test-event", text: "Real milestone." })
      .seeds,
    45,
  );
});
const now = Date.now();
const payload = {
  measurement: {
    provenance: "hardware",
    freshness: "online",
    coreStatus: "ACTIVE",
    observedAt: new Date(now).toISOString(),
    staleAfterSeconds: 120,
    counterEpoch: "epoch",
    rpmMilli: 60000,
    speedMmPerSecond: 850,
    distanceMm: 1234567,
  },
};
check("API units convert milli-RPM and millimetres correctly", () => {
  const r = parseStatus(payload, now);
  assert.equal(r.rpm, 60);
  assert.equal(r.speed, 0.85);
  assert.equal(r.distance, 1234.567);
});
check(
  "stale, simulated, malformed and faulted telemetry cannot be labelled live",
  () => {
    for (const mod of [
      { freshness: "stale" },
      { provenance: "simulated" },
      { observedAt: new Date(now - 121000).toISOString() },
      { rpmMilli: null },
      { coreStatus: "COUNTER_FAULT" },
      { distanceMm: -1 },
    ])
      assert.throws(() =>
        parseStatus({ measurement: { ...payload.measurement, ...mod } }, now),
      );
    assert.throws(() => parseStatus(null));
  },
);
check(
  "milestone parser accepts real feed shape and ignores unrelated events",
  () => {
    const events = parseWorldEvents({
      status: "available",
      events: [
        {
          id: "one",
          type: "measurement.distance_milestone",
          occurredAt: new Date(now).toISOString(),
          payload: { thresholdDistanceMm: "5000000" },
        },
        {
          id: "two",
          type: "protocol.block",
          occurredAt: new Date(now).toISOString(),
        },
      ],
    });
    assert.equal(events.length, 1);
    assert.match(events[0].text, /5 km/);
  },
);
check("demo readings distinguish active and idle phases", () => {
  assert(demoReading(0).active);
  assert(demoReading(29).rpm >= 90);
  assert(!demoReading(47).active);
});
check("corrupt browser save recovers to a usable village", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => "{broken" },
  });
  assert.equal(loadGame().seeds, 30);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => JSON.stringify({ version: 1, seeds: -2 }) },
  });
  assert.equal(loadGame().seeds, 30);
  void SAVE_KEY;
});
check("storm growth is exactly twice ordinary sunlight", () => {
  const start = {
    ...entered(),
    source: "live" as const,
    crops: [0, null, null, null, null, null],
  };
  const sun = act({ ...start, reading: live() }, { type: "TICK" });
  const storm = act(
    { ...start, reading: { ...live(), rpm: 100 } },
    { type: "TICK" },
  );
  assert.equal(storm.crops[0], sun.crops[0]! * 2);
});
check(
  "untrusted saved transient state cannot override the restored village",
  () => {
    const data = {
      ...initialState(),
      seeds: 71,
      effect: "not-a-world-effect",
      reading: { active: true },
      entered: true,
      source: "live",
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { getItem: () => JSON.stringify(data) },
    });
    const s = loadGame();
    assert.equal(s.seeds, 71);
    assert.equal(s.effect, "sunrise");
    assert.equal(s.source, "connecting");
    assert.equal(s.reading, null);
    assert.equal(s.entered, false);
  },
);
check(
  "array, boolean and object values cannot masquerade as telemetry numbers",
  () => {
    for (const bad of [[], {}, false, [1]])
      assert.throws(() =>
        parseStatus(
          { measurement: { ...payload.measurement, rpmMilli: bad } },
          now,
        ),
      );
  },
);
console.log(`${count} engine and adapter checks passed.`);
