import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import type { Action, GameState } from "../game/engine";
import { drawWorld, W, H } from "../game/renderer";
import type { Hotspot } from "../game/renderer";
import { Hamster, Icon } from "./Icons";
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
export const EFFECTS = {
  sunrise: {
    name: "Divine sunrise",
    icon: "sun",
    description: "The wheel turns. Your world blooms.",
    detail: "Villagers are awake. Crops grow in the sunlight.",
  },
  storm: {
    name: "Squeek Storm",
    icon: "bolt",
    description: "Fast paws. Electric skies.",
    detail: "Electric rain makes crops grow twice as fast.",
  },
  eclipse: {
    name: "The great pause",
    icon: "moon",
    description: "The wheel stopped. The sky held its breath.",
    detail: "Raise a canopy before frost nibbles your crops.",
  },
  night: {
    name: "Sacred slumber",
    icon: "moon",
    description: "Even a god needs a little nap.",
    detail: "Villagers rest. Watering still helps your crops grow.",
  },
  festival: {
    name: "Great Harvest",
    icon: "leaf",
    description: "Small steps. A very big blessing.",
    detail: "A wheel milestone! Crops grow faster for a little while.",
  },
} as const;
export default function World({
  state,
  dispatch,
  explore,
  pray,
  compactMotion,
}: {
  state: GameState;
  dispatch: Dispatch<Action>;
  explore: (tab: "farm" | "cottages" | "villagers") => void;
  pray: () => void;
  compactMotion: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    stateRef = useRef(state),
    spots = useRef<Hotspot[]>([]);
  stateRef.current = state;
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    let id = 0,
      last = 0,
      lastEffect = stateRef.current.effect;
    let transition: { frame: HTMLCanvasElement; start: number } | null = null;
    const render = (t: number) => {
      if (t - last > 45) {
        const current = stateRef.current;
        if (
          lastEffect !== current.effect &&
          !compactMotion &&
          !current.paused
        ) {
          const frame = document.createElement("canvas");
          frame.width = W;
          frame.height = H;
          frame.getContext("2d")?.drawImage(c.canvas, 0, 0);
          transition = { frame, start: t };
        }
        if (compactMotion || current.paused) transition = null;
        lastEffect = current.effect;
        spots.current = drawWorld(c, current, t, compactMotion);
        if (transition) {
          const opacity = 1 - (t - transition.start) / 1800;
          if (opacity > 0) {
            c.globalAlpha = opacity;
            c.drawImage(transition.frame, 0, 0);
            c.globalAlpha = 1;
          } else transition = null;
        }
        last = t;
      }
      id = requestAnimationFrame(render);
    };
    id = requestAnimationFrame(render);
    return () => cancelAnimationFrame(id);
  }, [compactMotion]);
  function interact(spot: Hotspot) {
    if (spot.kind === "shrine") {
      pray();
      return;
    }
    if (spot.kind === "home") {
      explore("cottages");
      return;
    }
    if (spot.kind === "villager") {
      dispatch({ type: "GREET", name: names[spot.index] });
      return;
    }
    const growth = state.crops[spot.index];
    if (growth === null) dispatch({ type: "PLANT", plot: spot.index });
    else if (growth >= 100) dispatch({ type: "HARVEST", plot: spot.index });
    else explore("farm");
  }
  const e = EFFECTS[state.effect];
  return (
    <section
      className={`world-frame effect-${state.effect}`}
      aria-label="Acorn Hollow game world"
    >
      <canvas
        ref={canvas}
        width={W}
        height={H}
        role="img"
        aria-label={`Pixel-art Acorn Hollow: ${state.homes} cottages, ${state.homes * 2} hamsters. ${e.detail} Use Explore village for all scene interactions.`}
        onClick={(ev) => {
          if (!state.entered || state.paused) return;
          const b = ev.currentTarget.getBoundingClientRect();
          const scale = Math.max(b.width / W, b.height / H);
          const x = (ev.clientX - b.left + (W * scale - b.width) / 2) / scale,
            y = (ev.clientY - b.top + (H * scale - b.height) / 2) / scale;
          const found = [...spots.current]
            .reverse()
            .find(
              (s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h,
            );
          if (found) interact(found);
        }}
      />
      <div className="world-topline">
        <span className="world-location">
          <span className="tiny-diamond" /> Acorn Hollow{" "}
          <span className="muted">/</span> Day {state.day}
        </span>
        <span className="season">
          <Icon name={e.icon} size={16} />
          {state.effect === "night"
            ? "Nightfall"
            : state.effect === "eclipse"
              ? "Eclipse"
              : state.effect === "storm"
                ? "Thunder rain"
                : "Early spring"}
        </span>
      </div>
      {state.entered && (
        <>
          <button
            className="scene-marker marker-shrine"
            aria-label="Pray at Squeektoshi’s shrine"
            onClick={pray}
          >
            <Icon name="faith" size={17} />
            <span>Shrine</span>
          </button>
          <button
            className="scene-marker marker-farm"
            aria-label="Manage the village farm"
            onClick={() => explore("farm")}
          >
            <Icon name="leaf" size={17} />
            <span>Farm</span>
          </button>
          <button
            className="scene-marker marker-cottage"
            aria-label="Visit the village cottages"
            onClick={() => explore("cottages")}
          >
            <Icon name="home" size={17} />
            <span>Cottages</span>
          </button>
          <div className="world-caption">
            <span className={`effect-dot ${state.effect}`} />
            <span>{state.paused ? "Village paused" : e.description}</span>
            {state.shelteredUntil > state.tick && (
              <span className="canopy-status">
                <Icon name="shield" size={14} /> Sheltered
              </span>
            )}
          </div>
          {state.paused && (
            <div className="pause-veil">
              <Icon name="pause" size={28} />
              <p>Your little world is on pause.</p>
              <button
                className="button primary"
                onClick={() => dispatch({ type: "PAUSE" })}
              >
                Resume village
              </button>
            </div>
          )}
        </>
      )}
      {!state.entered && (
        <div className="entry-veil">
          <div className="entry-content">
            <div className="entry-mascot">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <Hamster crown />
              <span className="mascot-spark spark-one">✦</span>
              <span className="mascot-spark spark-two">✦</span>
            </div>
            <h2>
              Tiny paws.
              <br />
              <span>Divine power.</span>
            </h2>
            <p>
              Care for a tiny village.
              <br />A real hamster decides its fate.
            </p>
            <button
              className="button primary enter-button"
              onClick={() => dispatch({ type: "ENTER" })}
            >
              Enter world <Icon name="arrow" />
            </button>
            <span className="entry-note">No wallet. Just a little faith.</span>
          </div>
        </div>
      )}
    </section>
  );
}
