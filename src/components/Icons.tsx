export type IconName =
  | "seed"
  | "wood"
  | "faith"
  | "home"
  | "water"
  | "harvest"
  | "pray"
  | "sun"
  | "moon"
  | "bolt"
  | "play"
  | "pause"
  | "sound"
  | "mute"
  | "help"
  | "close"
  | "arrow"
  | "leaf"
  | "shield"
  | "check"
  | "people"
  | "expand";
const paths: Record<IconName, string> = {
  seed: "M12 20v-8M12 15C4 16 3 10 4 6c6-1 10 2 8 9Zm0-3c-1-6 3-9 8-8 1 6-2 9-8 8Z",
  wood: "m5 17 11-11 5 5-11 11-5-5ZM4 15l5 5M14 5l5 5M3 18l3 3M16 4l4 4",
  faith: "m12 2 2 6 6 4-6 3-2 7-3-7-7-3 7-4 3-6Z",
  home: "m3 11 9-8 9 8M5 10v11h14V10M10 21v-8h4v8",
  water: "M12 2S5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2ZM9 15v1l2 2",
  harvest: "M5 3v7l4 4v7M3 3v6m4-6v6M17 3v18m0-18c7 4 4 11 0 11",
  pray: "m3 17 5-5 4-9 4 9 5 5M8 12l4 9 4-9M3 21l5-3m13 3-5-3",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  bolt: "m14 2-9 12h6l-1 8 9-13h-7l2-7Z",
  play: "m8 4 12 8-12 8V4Z",
  pause: "M8 4v16M16 4v16",
  sound: "M10 4 5 8H2v8h3l5 4V4Zm5 3c5 2 5 8 0 10m3-13c9 5 9 11 0 16",
  mute: "M10 4 5 8H2v8h3l5 4V4Zm5 5 6 6m0-6-6 6",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9 8c0-4 7-4 6 0 0 3-3 2-3 5m0 3v1",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M3 12h18m-6-6 6 6-6 6",
  leaf: "M4 20c0-8 6-14 16-16 1 12-3 18-12 15M4 20 15 9",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 10 3 3 6-6",
  check: "m5 12 5 5L20 6",
  people:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-2c0-7 14-7 14 0v2m0-16c6-2 8 7 2 8m1 2c3 0 4 2 4 6",
  expand: "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6",
};
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Hamster({
  className = "",
  sleeping = false,
  crown = false,
}: {
  className?: string;
  sleeping?: boolean;
  crown?: boolean;
}) {
  return (
    <svg
      className={`hamster-art ${className}`}
      viewBox="0 0 40 40"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {crown && <path d="M13 5h3v3h3V3h3v5h3V5h3v8H13z" fill="#f5cd70" />}
      <path d="M7 15h3v-4h7v5h7v-5h7v4h3v17h-5v4H12v-4H7z" fill="#a96647" />
      <path d="M8 17h4v-4h4v6h10v-6h4v4h3v13h-5v5H13v-5H8z" fill="#e6ad6b" />
      <path d="M13 23h15v4h4v5h-6v4H14v-4H8v-5h5z" fill="#fff1cf" />
      <path d="M12 15h3v4h-3zm15 0h3v4h-3z" fill="#de8e89" />
      {sleeping ? (
        <path d="M12 23h5v2h-5zm13 0h5v2h-5z" fill="#33243a" />
      ) : (
        <path d="M13 22h3v4h-3zm13 0h3v4h-3z" fill="#33243a" />
      )}
      <path d="M19 27h5v2h-2v2h-2v-2h-1z" fill="#a35c69" />
      <path d="M10 28h4v2h-4zm18 0h4v2h-4z" fill="#efa59a" />
    </svg>
  );
}
