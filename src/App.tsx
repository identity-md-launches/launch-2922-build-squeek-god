import { useEffect, useReducer, useRef, useState } from "react";
import type { FormEvent } from "react";
import { loadGame, reducer, SAVE_KEY } from "./game/engine";
import { EVENTS_URL, fetchReading, parseWorldEvents } from "./game/telemetry";
import World, { EFFECTS } from "./components/World";
import Dialog from "./components/Dialog";
import { Hamster, Icon } from "./components/Icons";
import type { IconName } from "./components/Icons";

type VillageTab = "farm" | "cottages" | "villagers";
const names = [
  "Mochi",
  "Pip",
  "Nibbles",
  "Clover",
  "Bean",
  "Maple",
  "Peanut",
  "Toast",
  "Biscuit",
  "Miso",
  "Walnut",
  "Pebble",
];
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadGame);
  const [requestedMode, setRequestedMode] = useState<"live" | "demo">("live");
  const [connection, setConnection] = useState("Connecting to the real wheel…");
  const [retry, retryNow] = useState(0);
  const [sound, setSound] = useState(false),
    [animations, setAnimations] = useState(true);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [dialog, setDialog] = useState<"help" | "village" | null>(null),
    [villageTab, setVillageTab] = useState<VillageTab>("farm");
  const [goal, setGoal] = useState(100),
    [words, setWords] = useState("Please run so my little village can bloom.");
  const [prayerError, setPrayerError] = useState(""),
    [storageProblem, setStorageProblem] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const prayerInput = useRef<HTMLTextAreaElement>(null),
    prayerSection = useRef<HTMLElement>(null);
  const audio = useRef<AudioContext | null>(null),
    lastSound = useRef(0);
  const effect = EFFECTS[state.effect],
    ready = state.crops.filter((c) => c !== null && c >= 100).length;
  const controlsDisabled = !state.entered || state.paused;
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(m.matches);
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      if (stateRef.current.entered && !stateRef.current.paused)
        dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let stopped = false,
      busy = false;
    const controller = new AbortController();
    if (requestedMode === "demo") {
      dispatch({ type: "SOURCE", source: "demo" });
      setConnection("Simulated wheel · 12× distance · local village");
      return () => {
        stopped = true;
        controller.abort();
      };
    }
    const poll = async () => {
      if (busy || stopped) return;
      busy = true;
      const attempt = new AbortController();
      const abort = () => attempt.abort();
      controller.signal.addEventListener("abort", abort);
      const timeout = setTimeout(() => attempt.abort(), 7000);
      try {
        const reading = await fetchReading(attempt.signal);
        if (stopped) return;
        dispatch({ type: "SOURCE", source: "live" });
        dispatch({ type: "READING", reading });
        setConnection(
          `Hardware reading · ${new Date(reading.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        );
      } catch (error) {
        if (stopped) return;
        const reason =
          error instanceof Error && error.name !== "AbortError"
            ? error.message
            : "The wheel feed did not respond.";
        dispatch({
          type: "SOURCE",
          source: "demo",
          reason: `${reason} Demo mode keeps the village playable.`,
        });
        setConnection(`${reason} Retrying every 15 seconds.`);
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", abort);
        busy = false;
      }
    };
    void poll();
    const interval = setInterval(poll, 15000);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [requestedMode, retry]);
  useEffect(() => {
    if (state.source !== "live" || !state.entered || state.paused) return;
    const controller = new AbortController();
    let busy = false,
      baseline = false;
    const seen = new Set<string>();
    const started = Date.now();
    const poll = async () => {
      if (busy || controller.signal.aborted) return;
      busy = true;
      const attempt = new AbortController();
      const abort = () => attempt.abort();
      controller.signal.addEventListener("abort", abort);
      const timeout = setTimeout(() => attempt.abort(), 7000);
      try {
        const res = await fetch(EVENTS_URL, {
          signal: attempt.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        if (!res.ok) return;
        const events = parseWorldEvents(await res.json());
        for (const event of [...events].reverse()) {
          if (baseline && !seen.has(event.id) && event.occurredAt >= started) {
            dispatch({ type: "WORLD_EVENT", id: event.id, text: event.text });
          }
          seen.add(event.id);
        }
        baseline = true;
      } catch {
        /* Milestone feed is optional; wheel gameplay keeps running. */
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", abort);
        busy = false;
      }
    };
    void poll();
    const interval = setInterval(poll, 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [state.source, state.entered, state.paused]);
  useEffect(() => {
    if (!state.entered) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setStorageProblem(false);
    } catch {
      setStorageProblem(true);
    }
  }, [state]);
  useEffect(() => {
    if (!sound || !state.notice || state.eventId === lastSound.current) return;
    lastSound.current = state.eventId;
    try {
      const ctx = audio.current ?? new AudioContext();
      audio.current = ctx;
      void ctx.resume();
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      setSound(false);
    }
  }, [sound, state.eventId, state.notice]);
  function explore(tab: VillageTab) {
    setVillageTab(tab);
    setDialog("village");
  }
  function focusPrayer() {
    prayerSection.current?.scrollIntoView({
      behavior: systemReduced ? "instant" : "smooth",
      block: "center",
    });
    prayerInput.current?.focus({ preventScroll: true });
    if (state.prayer)
      document
        .getElementById("prayer-progress")
        ?.focus({ preventScroll: true });
  }
  function sendPrayer(e: FormEvent) {
    e.preventDefault();
    if (!words.trim()) {
      setPrayerError("Write a little hope for Squeektoshi.");
      prayerInput.current?.focus();
      return;
    }
    setPrayerError("");
    dispatch({ type: "PRAY", words, goal });
  }
  function toggleMode() {
    setRequestedMode(requestedMode === "live" ? "demo" : "live");
  }
  const resource = (
    name: string,
    value: number,
    icon: IconName,
    extra = "",
  ) => (
    <div className={`resource ${extra}`}>
      <span className="resource-icon">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <strong>{value.toLocaleString()}</strong>
        <span>{name}</span>
      </div>
    </div>
  );
  return (
    <div
      className={`app-shell ${!animations || systemReduced || state.paused ? "reduce-motion" : ""}`}
    >
      <a className="skip-link" href="#world-actions">
        Skip to village actions
      </a>
      <header className="site-header">
        <div className="brand">
          <img src="./favicon.svg" alt="" width="40" height="40" />
          <div>
            <h1>
              SQUEEK <span>GOD</span>
              <span className="brand-star">✦</span>
            </h1>
            <p>A REAL HAMSTER CONTROLS YOUR WORLD.</p>
          </div>
        </div>
        <div className="header-tools">
          <span className="edition">A tiny world. A higher paw.</span>
          <button
            className="icon-button"
            aria-label={sound ? "Mute sound" : "Enable sound"}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            <Icon name={sound ? "sound" : "mute"} />
          </button>
          <button
            className="icon-button motion-toggle"
            aria-label={
              animations
                ? "Pause decorative motion"
                : "Enable decorative motion"
            }
            aria-pressed={!animations}
            onClick={() => setAnimations(!animations)}
          >
            <Icon name={animations ? "leaf" : "pause"} />
          </button>
          <button
            className="icon-button"
            aria-label="How to play"
            onClick={() => setDialog("help")}
          >
            <Icon name="help" />
          </button>
        </div>
      </header>
      <main>
        <div className="village-bar">
          <div className="village-name">
            <Icon name="home" size={21} />
            <div>
              <strong>Acorn Hollow</strong>
              <span>
                Level {state.level} <span className="village-separator">·</span>{" "}
                {state.level < 2
                  ? "Little beginnings"
                  : state.level < 4
                    ? "A growing village"
                    : "A thriving valley"}
              </span>
            </div>
            <progress
              className="level-track"
              value={state.xp}
              max={100}
              aria-label="Experience to next village level"
            />
          </div>
          <div className="resources" aria-label="Village resources">
            {resource("Seeds", state.seeds, "seed", "seeds")}
            {resource("Wood", state.wood, "wood", "wood")}
            {resource("Faith", state.faith, "faith", "faith")}
            {resource("Villagers", state.homes * 2, "people", "villagers")}
          </div>
        </div>
        <div className="game-layout">
          <div className="game-column">
            <World
              state={state}
              dispatch={dispatch}
              explore={explore}
              pray={focusPrayer}
              compactMotion={systemReduced || !animations}
            />
            <div
              id="world-actions"
              className="world-actions"
              tabIndex={-1}
              aria-label="Village actions"
            >
              <div className="action-group">
                <button
                  className="action-button"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "PLANT" })}
                >
                  <Icon name="seed" />
                  <span>
                    Plant<small>2 seeds</small>
                  </span>
                </button>
                <button
                  className="action-button"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "WATER" })}
                >
                  <Icon name="water" />
                  <span>
                    Water
                    <small>
                      {state.tick - state.waterAt < 12
                        ? `${12 - (state.tick - state.waterAt)}s`
                        : "+18% growth"}
                    </small>
                  </span>
                </button>
                <button
                  className="action-button harvest-button"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "HARVEST" })}
                >
                  <Icon name="harvest" />
                  <span>
                    Harvest<small>{ready ? `${ready} ready` : "Growing"}</small>
                  </span>
                  {ready > 0 && <span className="action-counter">{ready}</span>}
                </button>
              </div>
              <div className="action-divider" />
              <button
                className="action-button build-action"
                disabled={controlsDisabled}
                onClick={() => dispatch({ type: "BUILD" })}
              >
                <Icon name="home" />
                <span>
                  Build<small>30 wood · 15 seeds</small>
                </span>
              </button>
              <button
                className="icon-button pause-button"
                disabled={!state.entered}
                aria-label={state.paused ? "Resume village" : "Pause village"}
                onClick={() => dispatch({ type: "PAUSE" })}
              >
                <Icon name={state.paused ? "play" : "pause"} size={18} />
              </button>
            </div>
            <div className="feedback" role="status" aria-live="polite">
              <Icon name={state.notice ? "faith" : "leaf"} size={15} />
              <span>
                {state.entered
                  ? state.notice || "Tend the village. Trust the hamster."
                  : "Your village is ready. Enter the world to begin."}
              </span>
            </div>
            {state.entered &&
              (state.effect === "eclipse" || state.effect === "storm") && (
                <section className="omen-banner" aria-label="World event">
                  <Icon
                    name={state.effect === "eclipse" ? "moon" : "bolt"}
                    size={24}
                  />
                  <div>
                    <strong>
                      {state.effect === "eclipse"
                        ? `Eclipse: frost in ${Math.max(0, state.effectUntil - state.tick)} seconds.`
                        : "The Squeek Storm is here."}
                    </strong>
                    <p>
                      {state.shelteredUntil > state.tick
                        ? "Your canopy is up. The crops are protected."
                        : state.effect === "eclipse"
                          ? "Protect your crops before the frost arrives."
                          : "Electric rain grows crops faster. A canopy keeps the village cozy."}
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => dispatch({ type: "SHELTER" })}
                    disabled={
                      controlsDisabled || state.shelteredUntil > state.tick
                    }
                  >
                    <Icon name="shield" size={17} />
                    {state.shelteredUntil > state.tick
                      ? "Village sheltered"
                      : "Shelter · 5 wood"}
                  </button>
                </section>
              )}
            <section className="chronicle panel">
              <div className="section-heading">
                <h2>
                  <Icon name="leaf" size={18} /> World chronicle
                </h2>
                <span className="log-indicator">
                  The wheel writes the story
                </span>
              </div>
              <ol className="event-list">
                {state.events
                  .slice(0, showAllEvents ? 15 : 4)
                  .map((event, i) => (
                    <li key={event.id}>
                      <span className={`log-dot ${event.kind}`} />
                      <span className={i === 0 ? "latest-event" : ""}>
                        {event.text}
                      </span>
                      <time>
                        {event.at === 0
                          ? "Origin"
                          : `${Math.floor(event.at / 60)}:${String(event.at % 60).padStart(2, "0")}`}
                      </time>
                    </li>
                  ))}
              </ol>
              <div className="journey-progress">
                <div>
                  <span>Next Great Harvest</span>
                  <strong>
                    {Math.floor(state.distance).toLocaleString()} /{" "}
                    {state.nextMilestone.toLocaleString()} m
                  </strong>
                </div>
                <progress
                  value={state.distance % 500}
                  max={500}
                  aria-label="Distance to next Great Harvest"
                />
              </div>
              <button
                className="text-button"
                onClick={() => setShowAllEvents(!showAllEvents)}
                disabled={state.events.length < 5}
              >
                {showAllEvents ? "Show recent events" : "Read more events"}{" "}
                <Icon name="arrow" size={14} />
              </button>
            </section>
          </div>
          <aside
            className="side-column"
            aria-label="Squeektoshi and village management"
          >
            <section className="god-panel panel">
              <div className="section-heading">
                <h2>The one above</h2>
                <span
                  className={`source-badge ${state.source}`}
                  data-testid="source-badge"
                >
                  <span />
                  {state.source === "live"
                    ? "Live"
                    : state.source === "demo"
                      ? "Demo mode"
                      : "Connecting"}
                </span>
              </div>
              <div
                className={`god-avatar ${state.reading?.active ? "running" : ""}`}
              >
                <div className="god-halo" />
                <div className="wheel-spokes" />
                <Hamster sleeping={!state.reading?.active} crown />
                <span className="god-spark god-spark-one">✦</span>
                <span className="god-spark god-spark-two">✦</span>
              </div>
              <div className="god-name">
                <h3>Squeektoshi</h3>
                <span
                  className={`activity-label ${state.reading?.active ? "active" : ""}`}
                >
                  <span />
                  {state.source === "connecting"
                    ? "Listening"
                    : state.reading?.active
                      ? "Active"
                      : "Idle"}
                </span>
              </div>
              <p className="god-subtitle">Small hamster. Unreasonable power.</p>
              <div className="telemetry">
                <div>
                  <span>Wheel speed</span>
                  <strong>
                    {state.reading ? state.reading.rpm.toFixed(1) : "—"}
                    <small> RPM</small>
                  </strong>
                </div>
                <div>
                  <span>
                    Distance{state.source === "demo" ? " · demo" : " · today"}
                  </span>
                  <strong>
                    {state.reading
                      ? (state.reading.distance / 1000).toFixed(2)
                      : "—"}
                    <small> km</small>
                  </strong>
                </div>
              </div>
              <div className={`divine-effect divine-${state.effect}`}>
                <span className="effect-icon">
                  <Icon name={effect.icon} size={20} />
                </span>
                <div>
                  <span>Divine effect</span>
                  <strong data-testid="divine-effect">{effect.name}</strong>
                </div>
              </div>
              <div className="connection-note">
                <span className="connection-detail">
                  {state.source === "demo"
                    ? requestedMode === "demo"
                      ? "Simulated activity · 12× distance"
                      : connection
                    : state.source === "live"
                      ? connection
                      : "Listening for hardware telemetry…"}
                </span>
                <button className="text-button" onClick={toggleMode}>
                  {requestedMode === "live" ? "Try demo" : "Use live feed"}{" "}
                  <Icon name="arrow" size={12} />
                </button>
              </div>
              {state.source === "demo" && (
                <button
                  className="demo-advance"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "NEXT_DEMO" })}
                >
                  Explore next demo omen <Icon name="arrow" size={15} />
                </button>
              )}
              {requestedMode === "live" && state.source === "demo" && (
                <button
                  className="text-button retry-button"
                  onClick={() => retryNow(retry + 1)}
                >
                  Retry live connection
                </button>
              )}
            </section>
            <section
              className="prayer-panel panel"
              ref={prayerSection}
              aria-labelledby="prayer-heading"
            >
              <div className="section-heading">
                <h2 id="prayer-heading">
                  <Icon name="pray" size={21} /> A little divine intervention
                </h2>
              </div>
              {!state.prayer ? (
                <form onSubmit={sendPrayer}>
                  <label htmlFor="prayer-words">
                    What does your village need?
                  </label>
                  <textarea
                    id="prayer-words"
                    ref={prayerInput}
                    value={words}
                    onChange={(e) => {
                      setWords(e.target.value);
                      setPrayerError("");
                    }}
                    maxLength={120}
                    rows={2}
                    disabled={controlsDisabled}
                    aria-invalid={!!prayerError}
                    aria-describedby={
                      prayerError ? "prayer-error" : "prayer-hint"
                    }
                  />
                  {prayerError && (
                    <p id="prayer-error" className="field-error">
                      {prayerError}
                    </p>
                  )}
                  <div className="prayer-goal">
                    <label htmlFor="prayer-goal">Ask for a run of</label>
                    <select
                      id="prayer-goal"
                      value={goal}
                      onChange={(e) => setGoal(Number(e.target.value))}
                      disabled={controlsDisabled}
                    >
                      <option value={100}>100 m</option>
                      <option value={250}>250 m</option>
                      <option value={500}>500 m</option>
                    </select>
                  </div>
                  <button
                    className="button primary pray-button"
                    disabled={controlsDisabled}
                    type="submit"
                  >
                    <Icon name="pray" size={19} />
                    <span>Pray to Squeektoshi</span>
                    <span className="prayer-cost">
                      5 <Icon name="faith" size={12} />
                    </span>
                  </button>
                  <p className="prayer-hint" id="prayer-hint">
                    Prayers stay in this browser. The wheel decides when.
                  </p>
                </form>
              ) : (
                <div
                  className="active-prayer"
                  id="prayer-progress"
                  tabIndex={-1}
                >
                  <p className="prayer-quote">“{state.prayer.words}”</p>
                  <div className="prayer-progress-label">
                    <span>
                      {state.prayer.complete
                        ? "Prayer answered!"
                        : "Carried on tiny paws"}
                    </span>
                    <strong>
                      {Math.floor(state.prayer.progress)} / {state.prayer.goal}{" "}
                      m
                    </strong>
                  </div>
                  <progress
                    value={state.prayer.progress}
                    max={state.prayer.goal}
                    aria-label="Prayer distance progress"
                  />
                  <p className="prayer-hint">
                    {state.prayer.source === "demo"
                      ? "Demo prayer · simulated distance"
                      : "Live prayer · new real wheel distance"}
                  </p>
                  <button
                    className={`button ${state.prayer.complete ? "primary" : "waiting-button"}`}
                    disabled={!state.prayer.complete || controlsDisabled}
                    onClick={() => dispatch({ type: "CLAIM_PRAYER" })}
                  >
                    <Icon
                      name={state.prayer.complete ? "faith" : "moon"}
                      size={18}
                    />
                    {state.prayer.complete
                      ? "Claim blessing"
                      : "Awaiting a small miracle"}
                  </button>
                  <span className="blessing-reward">
                    Blessing: 20 seeds · 10 wood · 10 faith
                  </span>
                </div>
              )}
            </section>
            <section className="village-panel panel">
              <div className="section-heading">
                <h2>It takes a village</h2>
                <span>{state.homes}/6 homes</span>
              </div>
              <div className="village-preview">
                <div className="villager-faces">
                  <Hamster />
                  <Hamster />
                  <Hamster />
                </div>
                <p>
                  {state.homes * 2} tiny believers.
                  <br />
                  <span>A whole lot of hope.</span>
                </p>
              </div>
              <button
                className="button secondary"
                disabled={controlsDisabled}
                onClick={() => explore("villagers")}
              >
                Explore village <Icon name="arrow" size={16} />
              </button>
            </section>
          </aside>
        </div>
      </main>
      <footer className="site-footer">
        <span>
          <span className="footer-dot" />
          {storageProblem
            ? "Saving unavailable · keep this tab open"
            : state.entered
              ? "Village saved in this browser"
              : "A world powered by little paws"}
        </span>
        <a href="https://squeekchain.com" target="_blank" rel="noreferrer">
          Made for Squeekchain <Icon name="arrow" size={14} />
        </a>
        <span className="footer-motto">In Squeektoshi we trust.</span>
      </footer>
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={
          dialog === "help"
            ? "A keeper’s field guide"
            : "Welcome to Acorn Hollow"
        }
      >
        {dialog === "help" ? (
          <div className="help-content">
            <div className="help-intro">
              <Hamster crown />
              <p>
                You tend the village.
                <br />
                <strong>A real hamster rules the sky.</strong>
              </p>
            </div>
            <ol className="help-steps">
              <li>
                <Icon name="seed" />
                <div>
                  <strong>Plant, water, harvest.</strong>
                  <p>
                    Plant for 2 seeds. Harvest ripe crops for 8 seeds, 3 wood
                    and 2 faith. Watering adds 18% growth every 12 seconds, even
                    at night.
                  </p>
                </div>
              </li>
              <li>
                <Icon name="sun" />
                <div>
                  <strong>Follow the wheel.</strong>
                  <p>
                    Idle means night. Running brings sunrise. At 90 RPM, a
                    Squeek Storm doubles growth. A sudden stop brings 12 seconds
                    of eclipse: shelter for 5 wood to prevent frost.
                  </p>
                </div>
              </li>
              <li>
                <Icon name="pray" />
                <div>
                  <strong>Put a little faith in tiny paws.</strong>
                  <p>
                    Pray for 100, 250 or 500 m of new distance. Your prayer
                    costs 5 faith and rewards 20 seeds, 10 wood and 10 faith.
                    Every 500 m also brings a Great Harvest.
                  </p>
                </div>
              </li>
              <li>
                <Icon name="home" />
                <div>
                  <strong>Make a home.</strong>
                  <p>
                    Build a cottage for 30 wood and 15 seeds. Greet villagers
                    for faith, or host a feast. Reach 100 experience to level
                    up.
                  </p>
                </div>
              </li>
            </ol>
            <div className="help-source">
              <strong>Live wheel, local village</strong>
              <p>
                The public Squeekchain API is checked every 15 seconds. Only
                fresh hardware readings are labelled Live. If it cannot be
                reached, Demo mode takes over, with simulated activity and 12×
                distance. Use “Try demo” to explore its omens.
              </p>
              <p>
                Progress is saved only in this browser. Prayers are playful game
                goals; they do not reach or influence the real hamster. Prayers
                restart when changing sources or reopening the game.
              </p>
              <a
                href="https://docs.squeekchain.com/developers/api/"
                target="_blank"
                rel="noreferrer"
              >
                Read the public API documentation{" "}
                <Icon name="arrow" size={14} />
              </a>
            </div>
            <button
              className="button secondary help-motion"
              aria-pressed={!animations}
              onClick={() => setAnimations(!animations)}
            >
              <Icon name={animations ? "pause" : "play"} size={16} />
              {animations
                ? "Pause decorative motion"
                : "Enable decorative motion"}
            </button>
            <button className="button primary" onClick={() => setDialog(null)}>
              Back to the village <Icon name="arrow" size={17} />
            </button>
          </div>
        ) : (
          <>
            <div
              className="village-tabs"
              role="group"
              aria-label="Explore the village"
            >
              {(["farm", "cottages", "villagers"] as const).map((tab) => (
                <button
                  key={tab}
                  className={villageTab === tab ? "selected" : ""}
                  aria-pressed={villageTab === tab}
                  onClick={() => setVillageTab(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {villageTab === "farm" ? (
              <>
                <p className="dialog-instruction">
                  Select a plot to plant or harvest. Watering helps every
                  growing crop.
                </p>
                <div className="farm-grid">
                  {state.crops.map((c, i) => (
                    <button
                      key={i}
                      className={`crop-tile ${c !== null && c >= 100 ? "ripe" : ""}`}
                      disabled={controlsDisabled}
                      onClick={() =>
                        dispatch(
                          c === null
                            ? { type: "PLANT", plot: i }
                            : c >= 100
                              ? { type: "HARVEST", plot: i }
                              : { type: "WATER" },
                        )
                      }
                    >
                      <Icon
                        name={
                          c === null ? "seed" : c >= 100 ? "harvest" : "leaf"
                        }
                        size={26}
                      />
                      <strong>Plot {i + 1}</strong>
                      <span>
                        {c === null
                          ? "Plant · 2 seeds"
                          : c >= 100
                            ? "Harvest crop"
                            : `Growing · ${Math.floor(c)}%`}
                      </span>
                      {c !== null && (
                        <progress
                          max={100}
                          value={c}
                          aria-label={`Plot ${i + 1} growth`}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  className="button secondary"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "WATER" })}
                >
                  <Icon name="water" />
                  Water all crops
                </button>
              </>
            ) : villageTab === "cottages" ? (
              <>
                <div className="cottage-summary">
                  <Icon name="home" size={44} />
                  <div>
                    <h3>{state.homes} cozy cottages</h3>
                    <p>Room for {state.homes * 2} little believers.</p>
                  </div>
                </div>
                <p>
                  Build up to six cottages. Each new home welcomes two hamsters
                  and earns 25 experience.
                </p>
                <div className="dialog-actions">
                  <button
                    className="button primary"
                    disabled={controlsDisabled || state.homes >= 6}
                    onClick={() => dispatch({ type: "BUILD" })}
                  >
                    <Icon name="home" />
                    Build cottage · 30 wood + 15 seeds
                  </button>
                  <button
                    className="button secondary"
                    disabled={controlsDisabled}
                    onClick={() => dispatch({ type: "FEAST" })}
                  >
                    Host feast · 5 seeds
                  </button>
                  <button
                    className="button secondary"
                    disabled={
                      controlsDisabled || state.shelteredUntil > state.tick
                    }
                    onClick={() => dispatch({ type: "SHELTER" })}
                  >
                    <Icon name="shield" />
                    Raise canopy · 5 wood
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="dialog-instruction">
                  Say hello to a neighbor for +3 faith. Villagers need 25
                  seconds between visits.
                </p>
                <div className="villager-grid">
                  {names.slice(0, state.homes * 2).map((name, i) => (
                    <button
                      key={name}
                      className="villager-tile"
                      disabled={controlsDisabled}
                      onClick={() => dispatch({ type: "GREET", name })}
                    >
                      <Hamster sleeping={state.effect === "night"} />
                      <span>
                        <strong>{name}</strong>
                        <small>
                          {
                            [
                              "Carrot enthusiast",
                              "Cloud watcher",
                              "Seed keeper",
                              "Village daydreamer",
                            ][i % 4]
                          }
                        </small>
                      </span>
                      <Icon name="arrow" size={16} />
                    </button>
                  ))}
                </div>
                <button
                  className="button secondary"
                  disabled={controlsDisabled}
                  onClick={() => dispatch({ type: "FEAST" })}
                >
                  Host a village feast · 5 seeds
                </button>
              </>
            )}
            <div className="dialog-feedback" role="status">
              {state.notice}
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
