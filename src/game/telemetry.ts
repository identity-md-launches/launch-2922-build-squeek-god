import type { Reading } from "./engine";
export const API_BASE = "https://api.squeekchain.com";
export const STATUS_URL = `${API_BASE}/v1/status`;
export const EVENTS_URL = `${API_BASE}/v1/events?category=measurement&limit=20`;

export function parseStatus(data: unknown, now = Date.now()): Reading {
  if (typeof data !== "object" || data === null)
    throw new Error("The wheel feed has no reading.");
  const m = (data as Record<string, unknown>).measurement;
  if (typeof m !== "object" || m === null)
    throw new Error("The wheel feed has no reading.");
  const v = m as Record<string, unknown>;
  if (v.provenance !== "hardware")
    throw new Error("The feed is not a hardware reading.");
  if (
    v.freshness !== "online" ||
    !["ACTIVE", "IDLE"].includes(String(v.coreStatus))
  )
    throw new Error("The wheel reading is stale or the device is unavailable.");
  const at = Date.parse(String(v.observedAt));
  const maxAge =
    typeof v.staleAfterSeconds === "number"
      ? Math.min(v.staleAfterSeconds, 120)
      : 120;
  if (!Number.isFinite(at) || now - at > maxAge * 1000 || at - now > 30000)
    throw new Error("The wheel reading is stale.");
  const unsigned = (value: unknown) => {
    if (
      typeof value !== "number" &&
      (typeof value !== "string" || !/^\d+$/.test(value))
    )
      return NaN;
    const n = Number(value);
    return Number.isSafeInteger(n) && n >= 0 ? n : NaN;
  };
  const rpm = unsigned(v.rpmMilli),
    speed = unsigned(v.speedMmPerSecond),
    distance = unsigned(v.distanceMm);
  if (
    ![rpm, speed, distance].every(Number.isFinite) ||
    typeof v.counterEpoch !== "string" ||
    !v.counterEpoch
  )
    throw new Error("The wheel reading is incomplete.");
  return {
    source: "live",
    active: v.coreStatus === "ACTIVE",
    rpm: rpm / 1000,
    speed: speed / 1000,
    distance: distance / 1000,
    observedAt: String(v.observedAt),
    epoch: v.counterEpoch,
  };
}
export async function fetchReading(signal: AbortSignal): Promise<Reading> {
  const r = await fetch(STATUS_URL, {
    signal,
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!r.ok) throw new Error(`The wheel feed returned ${r.status}.`);
  return parseStatus(await r.json());
}
export interface WorldEvent {
  id: string;
  text: string;
  occurredAt: number;
}
export function parseWorldEvents(data: unknown): WorldEvent[] {
  if (typeof data !== "object" || data === null) return [];
  const d = data as Record<string, unknown>;
  if (d.status !== "available" || !Array.isArray(d.events)) return [];
  return d.events.flatMap((raw: unknown) => {
    if (typeof raw !== "object" || raw === null) return [];
    const e = raw as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      typeof e.type !== "string" ||
      !e.type.startsWith("measurement.")
    )
      return [];
    const p = (e.payload ?? {}) as Record<string, unknown>;
    const t = Date.parse(String(e.occurredAt));
    if (!Number.isFinite(t)) return [];
    let text = "Squeektoshi reached a real wheel milestone!";
    if (e.type.includes("distance_milestone")) {
      const distance = Number(p.thresholdDistanceMm) / 1000000;
      if (Number.isFinite(distance))
        text = `Squeektoshi reached a ${distance.toLocaleString()} km wheel milestone!`;
    } else if (e.type.includes("streak"))
      text = "Squeektoshi extended a real running streak!";
    else if (e.type.includes("speed"))
      text = "Squeektoshi set a real speed milestone!";
    return [{ id: e.id, text, occurredAt: t }];
  });
}
