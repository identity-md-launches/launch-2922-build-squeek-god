import type { GameState } from "./engine";
export const W = 640,
  H = 380;
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: "home" | "villager" | "plot" | "shrine";
  index: number;
}
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const houses = [
  { x: 174, y: 186 },
  { x: 284, y: 163 },
  { x: 427, y: 202 },
  { x: 350, y: 245 },
  { x: 105, y: 236 },
  { x: 495, y: 165 },
];
export const plots = Array.from({ length: 6 }, (_, i) => ({
  x: 412 + (i % 3) * 33,
  y: 269 + Math.floor(i / 3) * 25,
}));
function rect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function poly(c: CanvasRenderingContext2D, points: number[][], color: string) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  col: string,
) {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function cloud(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  rect(c, x, y, 50 * scale, 8 * scale, color);
  rect(c, x + 8 * scale, y - 7 * scale, 32 * scale, 9 * scale, color);
  rect(c, x + 16 * scale, y - 12 * scale, 16 * scale, 6 * scale, color);
}
function pine(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  night: boolean,
) {
  rect(c, x - 2 * s, y - 12 * s, 4 * s, 22 * s, "#523f41");
  for (let i = 0; i < 4; i++)
    poly(
      c,
      [
        [x, y - (45 - i * 10) * s],
        [x - (10 + i * 3) * s, y - (22 - i * 8) * s],
        [x + (10 + i * 3) * s, y - (22 - i * 8) * s],
      ],
      night ? "#173c40" : i % 2 ? "#286447" : "#367852",
    );
  rect(c, x - 1 * s, y - 40 * s, 2 * s, 5 * s, "#649464");
}
function tree(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  rect(c, x - 3 * s, y - 20 * s, 6 * s, 29 * s, "#624948");
  rect(c, x + 1 * s, y - 12 * s, 2 * s, 21 * s, "#a16e4c");
  rect(c, x - 17 * s, y - 38 * s, 34 * s, 23 * s, "#285448");
  rect(c, x - 12 * s, y - 48 * s, 28 * s, 35 * s, "#3c7150");
  rect(c, x - 24 * s, y - 30 * s, 17 * s, 17 * s, "#345f48");
  rect(c, x + 13 * s, y - 32 * s, 12 * s, 16 * s, "#285448");
  rect(c, x - 12 * s, y - 44 * s, 15 * s, 6 * s, "#638856");
  rect(c, x - 17 * s, y - 33 * s, 6 * s, 4 * s, "#72925d");
  rect(c, x + 1 * s, y - 39 * s, 13 * s, 10 * s, "#557f4f");
  rect(c, x + 10 * s, y - 30 * s, 4 * s, 7 * s, "#78945b");
}
function house(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  i: number,
  night: boolean,
) {
  ellipse(c, x + 3, y + 5, 33, 9, "#294636");
  rect(c, x - 23, y - 24, 48, 29, "#5e4350");
  rect(c, x - 20, y - 22, 41, 26, "#dab381");
  rect(c, x - 20, y - 22, 41, 4, "#8e6f66");
  rect(c, x + 16, y - 22, 5, 26, "#b18568");
  rect(c, x - 14, y - 12, 9, 10, "#6d6579");
  rect(c, x - 13, y - 11, 7, 7, night ? "#ffd878" : "#b9d4b1");
  rect(c, x - 9, y - 11, 1, 8, "#775548");
  rect(c, x - 14, y - 7, 10, 1, "#775548");
  rect(c, x - 16, y - 1, 14, 3, "#7b594c");
  rect(c, x + 5, y - 10, 10, 15, "#6a5149");
  rect(c, x + 7, y - 8, 6, 13, "#895e48");
  rect(c, x + 11, y - 3, 2, 2, "#edc471");
  for (let j = 0; j < 8; j++) {
    const width = 14 + j * 7;
    rect(
      c,
      x - width / 2,
      y - 49 + j * 4,
      width,
      4,
      i === 2 ? (j % 2 ? "#c07f65" : "#ad6657") : j % 2 ? "#d8af62" : "#c99a53",
    );
  }
  rect(c, x - 31, y - 20, 62, 3, "#74504c");
  rect(c, x + 13, y - 49, 6, 15, "#815b60");
  rect(c, x + 12, y - 51, 9, 3, "#ae7f76");
  rect(c, x - 8, y - 39, 15, 8, "#f3d187");
  rect(c, x - 5, y - 36, 9, 5, "#977455");
  rect(c, x - 23, y + 4, 50, 3, "#a98d65");
  if (night) {
    c.globalAlpha = 0.1;
    ellipse(c, x - 9, y - 7, 19, 15, "#ffd888");
    c.globalAlpha = 1;
  }
}
function hamster(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  frame: number,
  sleep: boolean,
) {
  ellipse(c, x, y + 6, 7, 2, "#234233");
  if (sleep) {
    rect(c, x - 6, y - 1, 12, 7, color);
    rect(c, x - 4, y - 3, 4, 4, color);
    rect(c, x + 3, y, 3, 2, "#382d3b");
    rect(c, x - 4, y + 3, 9, 3, "#f0dbab");
    return;
  }
  rect(c, x - 5, y - 5, 10, 10, color);
  rect(c, x - 6, y - 3, 12, 7, color);
  rect(c, x - 4, y - 8, 3, 4, color);
  rect(c, x + 2, y - 8, 3, 4, color);
  rect(c, x - 3, y - 6, 1, 2, "#ce8982");
  rect(c, x + 3, y - 6, 1, 2, "#ce8982");
  rect(c, x - 4, y, 9, 5, "#f8e9c7");
  rect(c, x - 3, y - 2, 2, 2, "#322d39");
  rect(c, x + 3, y - 2, 2, 2, "#322d39");
  rect(c, x, y + 1, 2, 1, "#b87b80");
  rect(c, x - 4, y + 5 + (frame % 2), 3, 2, "#a97964");
  rect(c, x + 2, y + 5 + ((frame + 1) % 2), 3, 2, "#a97964");
}
function crop(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  growth: number | null,
  frame: number,
) {
  rect(c, x, y, 28, 19, "#4b3c37");
  rect(c, x + 1, y + 1, 26, 15, "#775040");
  rect(c, x + 2, y + 3, 24, 2, "#8b6146");
  rect(c, x + 2, y + 10, 24, 2, "#8b6146");
  for (let i = 0; i < 4; i++) {
    const px = x + 5 + (i % 2) * 13,
      py = y + 6 + Math.floor(i / 2) * 8;
    if (growth === null) {
      rect(c, px, py, 2, 1, "#443b38");
      continue;
    }
    const h = growth >= 100 ? 10 : growth > 60 ? 7 : growth > 20 ? 4 : 2;
    const sway = frame % 2 && growth > 60 ? 1 : 0;
    rect(c, px, py - h, 2, h, "#91a65d");
    rect(c, px - 2 + sway, py - h, 3, 2, "#b4c973");
    rect(c, px + 1 + sway, py - h - 2, 3, 3, "#7faa5b");
    if (growth >= 100) {
      rect(c, px - 1, py - 3, 4, 5, "#f6c55e");
      rect(c, px, py - 4, 3, 2, "#ffdf8b");
    }
  }
}
export function drawWorld(
  c: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  reduceMotion: boolean,
): Hotspot[] {
  const t = reduceMotion || state.paused ? 0 : time / 1000;
  const frame = Math.floor(t * 3),
    night = state.effect === "night" || state.effect === "eclipse",
    storm = state.effect === "storm";
  const hotspots: Hotspot[] = [];
  c.clearRect(0, 0, W, H);
  c.imageSmoothingEnabled = false;
  const sky = c.createLinearGradient(0, 0, 0, 220);
  if (night) {
    sky.addColorStop(0, "#14192f");
    sky.addColorStop(0.6, "#373452");
    sky.addColorStop(1, "#75606c");
  } else if (storm) {
    sky.addColorStop(0, "#24233e");
    sky.addColorStop(0.6, "#58516b");
    sky.addColorStop(1, "#a57d8a");
  } else {
    sky.addColorStop(0, "#514164");
    sky.addColorStop(0.48, "#b87b83");
    sky.addColorStop(1, "#e7b38b");
  }
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 65; i++) {
    const x = Math.floor(rand(i + 4) * 640),
      y = Math.floor(rand(i + 61) * 136);
    c.globalAlpha = night
      ? 0.4 + rand(i + 70) * 0.5
      : 0.13 + rand(i + 70) * 0.35;
    rect(c, x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1, "#fff1cf");
    if (i % 11 === 0) {
      rect(c, x - 2, y + 1, 5, 1, "#fff1cf");
      rect(c, x, y - 1, 1, 5, "#fff1cf");
    }
  }
  c.globalAlpha = 1;
  // The god's wheel hangs in the sky, a moon-sized reminder of who is in charge.
  const sunX = 487,
    sunY = 91;
  if (state.effect === "eclipse") {
    ellipse(c, sunX, sunY, 31, 31, "#d4989c");
    ellipse(c, sunX + 3, sunY - 2, 28, 28, "#25243e");
  } else if (night) {
    ellipse(c, sunX, sunY, 24, 24, "#f3dda9");
    ellipse(c, sunX + 11, sunY - 8, 22, 22, "#33334e");
  } else {
    c.globalAlpha = 0.1;
    ellipse(c, sunX, sunY, 64, 64, "#ffda9c");
    c.globalAlpha = 0.13;
    ellipse(c, sunX, sunY, 45, 45, "#ffda9c");
    c.globalAlpha = 1;
    ellipse(c, sunX, sunY, 27, 27, "#ffe2ad");
    rect(c, sunX - 23, sunY - 4, 46, 2, "#f5c393");
  }
  cloud(c, 68 + Math.sin(t / 19) * 8, 69, 1.1, night ? "#3d3f5c" : "#c69a9d");
  cloud(c, 290 + Math.sin(t / 26) * 10, 42, 0.8, night ? "#33364e" : "#b18b9d");
  cloud(c, 551 + Math.sin(t / 27) * 8, 131, 0.7, night ? "#44435b" : "#d9a7a0");
  if (storm) {
    cloud(c, 120, 35, 2.1, "#44425b");
    cloud(c, 415, 40, 1.8, "#484158");
  }
  // Layered, stepped mountains.
  poly(
    c,
    [
      [0, 169],
      [27, 145],
      [39, 146],
      [76, 107],
      [88, 107],
      [120, 145],
      [141, 139],
      [184, 101],
      [200, 101],
      [242, 153],
      [268, 133],
      [302, 149],
      [333, 126],
      [349, 126],
      [394, 155],
      [423, 134],
      [447, 141],
      [465, 118],
      [480, 118],
      [524, 153],
      [554, 128],
      [570, 131],
      [609, 101],
      [623, 103],
      [640, 121],
      [640, 240],
      [0, 240],
    ],
    night ? "#333d50" : "#70677c",
  );
  poly(
    c,
    [
      [0, 185],
      [36, 166],
      [62, 168],
      [96, 147],
      [113, 149],
      [132, 172],
      [169, 156],
      [198, 166],
      [229, 143],
      [247, 147],
      [278, 173],
      [316, 161],
      [341, 168],
      [378, 143],
      [398, 150],
      [431, 178],
      [467, 151],
      [494, 160],
      [522, 181],
      [553, 157],
      [581, 169],
      [612, 148],
      [640, 160],
      [640, 246],
      [0, 246],
    ],
    night ? "#344b50" : "#657c76",
  );
  poly(
    c,
    [
      [0, 210],
      [40, 193],
      [81, 199],
      [118, 186],
      [157, 200],
      [196, 190],
      [234, 198],
      [280, 180],
      [318, 194],
      [367, 182],
      [410, 193],
      [457, 185],
      [505, 203],
      [560, 184],
      [607, 192],
      [640, 181],
      [640, 270],
      [0, 270],
    ],
    night ? "#294a47" : "#557b59",
  );
  for (let i = 0; i < 30; i++)
    pine(c, i * 24 - 8, 210 + Math.sin(i * 4) * 6, 0.55, night);
  // High valley: stepped cliffs, moss edges and grass.
  poly(
    c,
    [
      [0, 251],
      [32, 235],
      [83, 231],
      [110, 218],
      [181, 213],
      [222, 205],
      [280, 212],
      [319, 203],
      [364, 214],
      [416, 208],
      [453, 219],
      [499, 216],
      [542, 224],
      [602, 228],
      [640, 245],
      [640, 380],
      [0, 380],
    ],
    "#554c49",
  );
  poly(
    c,
    [
      [0, 240],
      [35, 226],
      [83, 225],
      [110, 211],
      [181, 207],
      [222, 199],
      [280, 206],
      [319, 197],
      [364, 208],
      [416, 202],
      [453, 213],
      [499, 210],
      [542, 218],
      [602, 222],
      [640, 239],
      [640, 353],
      [609, 354],
      [581, 346],
      [548, 349],
      [512, 340],
      [466, 350],
      [412, 338],
      [360, 346],
      [301, 335],
      [248, 344],
      [201, 336],
      [146, 346],
      [97, 337],
      [45, 347],
      [0, 338],
    ],
    night ? "#3a604a" : "#64834f",
  );
  poly(
    c,
    [
      [0, 265],
      [46, 256],
      [98, 258],
      [139, 240],
      [190, 246],
      [228, 236],
      [278, 245],
      [324, 234],
      [371, 245],
      [419, 238],
      [463, 253],
      [520, 245],
      [571, 254],
      [640, 249],
      [640, 342],
      [576, 336],
      [523, 330],
      [476, 340],
      [414, 329],
      [356, 334],
      [300, 325],
      [244, 334],
      [189, 324],
      [136, 335],
      [80, 325],
      [0, 331],
    ],
    night ? "#42684b" : "#7d975b",
  );
  for (let i = 0; i < 600; i++) {
    const x = Math.floor(rand(i + 100) * 640),
      y = 221 + Math.floor(rand(i + 800) * 122);
    rect(
      c,
      x,
      y,
      rand(i + 940) > 0.5 ? 2 : 1,
      1,
      i % 4 === 0 ? "#a6b36c" : i % 3 === 0 ? "#526c46" : "#6b8750",
    );
  }
  // A winding sandy path connects every part of the village.
  poly(
    c,
    [
      [300, 216],
      [311, 216],
      [309, 244],
      [294, 253],
      [292, 268],
      [336, 276],
      [358, 289],
      [410, 288],
      [410, 300],
      [355, 301],
      [329, 288],
      [281, 281],
      [262, 261],
      [214, 258],
      [207, 242],
      [221, 240],
      [225, 248],
      [273, 248],
      [294, 240],
    ],
    "#af9c73",
  );
  poly(
    c,
    [
      [291, 277],
      [303, 281],
      [289, 307],
      [259, 328],
      [246, 327],
      [274, 304],
    ],
    "#af9c73",
  );
  poly(
    c,
    [
      [371, 280],
      [378, 268],
      [427, 240],
      [436, 244],
      [389, 279],
    ],
    "#af9c73",
  );
  for (let i = 0; i < 36; i++) {
    const x = 274 + rand(i + 400) * 41,
      y = 244 + rand(i + 450) * 40;
    rect(c, x, y, 2, 1, "#c4ae7f");
  }
  // Stream and pond, with pixel reflections and lilypads.
  poly(
    c,
    [
      [72, 255],
      [95, 248],
      [117, 253],
      [137, 266],
      [142, 283],
      [160, 295],
      [184, 298],
      [199, 311],
      [190, 328],
      [165, 337],
      [131, 334],
      [107, 322],
      [93, 304],
      [74, 291],
      [63, 273],
    ],
    "#3e5e5c",
  );
  poly(
    c,
    [
      [75, 258],
      [96, 252],
      [114, 256],
      [132, 268],
      [137, 286],
      [158, 300],
      [181, 302],
      [194, 312],
      [185, 324],
      [164, 332],
      [134, 330],
      [111, 319],
      [98, 301],
      [78, 288],
      [69, 272],
    ],
    night ? "#416c72" : "#619a9a",
  );
  for (let i = 0; i < 28; i++) {
    const x = 80 + rand(i + 760) * 101,
      y = 264 + rand(i + 790) * 58;
    rect(c, x + Math.sin(t + i) * 2, y, 5 + rand(i + 30) * 7, 1, "#a3c2b2");
  }
  rect(c, 109, 285, 8, 3, "#789b6b");
  rect(c, 156, 315, 9, 3, "#789b6b");
  rect(c, 153, 313, 3, 2, "#e7b3ab");
  // Wooden bridge and fence.
  rect(c, 102, 291, 39, 5, "#715343");
  for (let i = 0; i < 9; i++)
    rect(c, 102 + i * 4, 280, 3, 18, i % 2 ? "#bf9c6d" : "#ae8a62");
  rect(c, 101, 278, 40, 2, "#d8b581");
  rect(c, 101, 298, 40, 2, "#694c43");
  for (let i = 0; i < 8; i++) {
    const x = 401 + i * 16;
    rect(c, x, 320, 3, 14, "#bda575");
    rect(c, x - 1, 318, 5, 3, "#d1b984");
  }
  rect(c, 401, 324, 114, 2, "#a88d64");
  rect(c, 401, 330, 114, 2, "#a88d64");
  // Shrine, flowers and the miniature god statue.
  ellipse(c, 350, 215, 25, 8, "#344c41");
  rect(c, 332, 207, 38, 8, "#c3b798");
  rect(c, 337, 199, 28, 9, "#a2968b");
  rect(c, 341, 187, 20, 12, "#b4aaa0");
  hamster(c, 351, 182, "#cfc0a1", 0, false);
  rect(c, 344, 172, 3, 4, "#f9d17f");
  rect(c, 350, 169, 3, 7, "#f9d17f");
  rect(c, 357, 172, 3, 4, "#f9d17f");
  for (let i = 0; i < 4; i++) {
    const x = 327 + i * 16;
    rect(c, x, 207, 2, 6, "#e3c49c");
    rect(c, x, 204, 2, 3, "#ffd997");
  }
  hotspots.push({
    id: "shrine",
    x: 329,
    y: 165,
    w: 44,
    h: 54,
    label: "Visit the shrine",
    kind: "shrine",
    index: 0,
  });
  // Cottage chimney smoke drifts on its own clock.
  houses.slice(0, state.homes).forEach((h, i) => {
    house(c, h.x, h.y, i, night);
    for (let k = 0; k < 3; k++) {
      c.globalAlpha = 0.28 - k * 0.07;
      rect(
        c,
        h.x + 13 + Math.sin(t + k) * 3,
        h.y - 56 - k * 8 - ((t * 3) % 8),
        5 + k * 2,
        4,
        "#e2cdc2",
      );
    }
    c.globalAlpha = 1;
    hotspots.push({
      id: `house-${i}`,
      x: h.x - 29,
      y: h.y - 50,
      w: 62,
      h: 59,
      label: `Visit cottage ${i + 1}`,
      kind: "home",
      index: i,
    });
  });
  // Tiny windmill and cloth awning at the farm.
  rect(c, 536, 226, 14, 44, "#aa9e82");
  poly(
    c,
    [
      [534, 227],
      [543, 213],
      [552, 227],
    ],
    "#7d5c63",
  );
  rect(c, 538, 246, 4, 8, "#62665c");
  c.save();
  c.translate(543, 231);
  c.rotate(reduceMotion ? -0.4 : t * (storm ? 1.6 : 0.3));
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    rect(c, 2, -2, 23, 4, "#ded0a4");
    rect(c, 9, -3, 15, 7, "#f0dcac");
    rect(c, 10, -1, 1, 4, "#b6a47f");
    rect(c, 17, -1, 1, 4, "#b6a47f");
  }
  c.restore();
  rect(c, 541, 229, 4, 4, "#86694f");
  plots.forEach((p, i) => {
    crop(c, p.x, p.y, state.crops[i], frame);
    hotspots.push({
      id: `plot-${i}`,
      x: p.x - 1,
      y: p.y - 4,
      w: 31,
      h: 25,
      label:
        state.crops[i] === null
          ? `Plant plot ${i + 1}`
          : state.crops[i]! >= 100
            ? `Harvest plot ${i + 1}`
            : `Inspect plot ${i + 1}, ${Math.floor(state.crops[i]!)}% grown`,
      kind: "plot",
      index: i,
    });
  });
  // Six villagers are awake or asleep in response to wheel activity.
  const villagers = [
    { x: 245, y: 239, name: "Mochi" },
    { x: 370, y: 271, name: "Pip" },
    { x: 196, y: 278, name: "Nibbles" },
    { x: 478, y: 251, name: "Clover" },
    { x: 278, y: 306, name: "Bean" },
    { x: 383, y: 230, name: "Maple" },
    { x: 332, y: 304, name: "Peanut" },
    { x: 152, y: 242, name: "Toast" },
    { x: 518, y: 293, name: "Biscuit" },
    { x: 450, y: 325, name: "Miso" },
    { x: 231, y: 304, name: "Walnut" },
    { x: 102, y: 242, name: "Pebble" },
  ];
  villagers.slice(0, state.homes * 2).forEach((v, i) => {
    const asleep = night && state.effect !== "eclipse";
    const x = asleep ? v.x : v.x + Math.sin(t * 0.35 + i * 2) * 13,
      y = asleep ? v.y : v.y + Math.cos(t * 0.4 + i) * 5;
    hamster(
      c,
      Math.round(x),
      Math.round(y),
      ["#e6b978", "#b9a398", "#e2d1b0", "#ba875e"][i % 4],
      frame,
      asleep,
    );
    if (asleep && i % 2 === 0) {
      rect(c, x + 8, y - 13, 4, 1, "#e5d3b1");
      rect(c, x + 10, y - 12, 2, 2, "#e5d3b1");
      rect(c, x + 8, y - 10, 4, 1, "#e5d3b1");
    }
    hotspots.push({
      id: `villager-${i}`,
      x: x - 9,
      y: y - 11,
      w: 20,
      h: 20,
      label: `Say hello to ${v.name}`,
      kind: "villager",
      index: i,
    });
  });
  // Foreground foliage frames the civilization.
  tree(c, 49, 253, 1.2);
  tree(c, 596, 265, 1.25);
  pine(c, 11, 282, 1.3, night);
  pine(c, 625, 316, 1.7, night);
  pine(c, 31, 334, 0.9, night);
  tree(c, 71, 366, 1.2);
  for (let i = 0; i < 50; i++) {
    const x = rand(i + 1020) * 620 + 10,
      y = 231 + rand(i + 1080) * 111;
    if (x > 400 && x < 521 && y > 265 && y < 322) continue;
    rect(c, x, y, 1, 4, "#4b7344");
    rect(
      c,
      x - 1,
      y - 1,
      3,
      2,
      i % 3 === 0 ? "#e7b6a3" : i % 2 ? "#e7d68a" : "#b9c1a2",
    );
  }
  // Exposed earth at the bottom, little roots, rocks and a descending waterfall.
  poly(
    c,
    [
      [0, 350],
      [45, 359],
      [99, 349],
      [147, 357],
      [200, 348],
      [248, 356],
      [300, 347],
      [360, 357],
      [414, 349],
      [467, 362],
      [514, 351],
      [548, 362],
      [584, 353],
      [640, 367],
      [640, 380],
      [0, 380],
    ],
    "#3a3e3a",
  );
  for (let i = 0; i < 60; i++) {
    const x = rand(i + 1500) * 640,
      y = 354 + rand(i + 1550) * 26;
    rect(c, x, y, 3 + rand(i) * 6, 2, i % 2 ? "#685747" : "#4c4d3e");
  }
  rect(c, 169, 334, 15, 46, "#80adac");
  rect(c, 173, 334, 4, 46, "#bed2bd");
  rect(c, 181, 338, 2, 42, "#a4c4b4");
  for (let i = 0; i < 5; i++)
    rect(c, 170, 340 + ((t * 13 + i * 9) % 38), 11, 1, "#d4dec5");
  // Ambient night tint preserves contrast and the visibility of every building.
  if (night) {
    rect(c, 0, 0, W, H, "#141d3c26");
  }
  if (state.shelteredUntil > state.tick) {
    c.strokeStyle = "#b5d9cc";
    c.lineWidth = 1;
    c.setLineDash([3, 3]);
    c.strokeRect(405, 261, 107, 55);
    c.setLineDash([]);
  }
  if (storm) {
    for (let i = 0; i < 70; i++) {
      const x = (rand(i + 2210) * 700 - t * 46) % 700,
        y = (rand(i + 2250) * 400 + t * 130) % 400;
      rect(c, x, y, 1, 5, "#c5ced36b");
    }
    // One gentle lightning stroke per six seconds; no full-screen flash or rapid strobing.
    if (!reduceMotion && t % 6 < 0.18) {
      poly(
        c,
        [
          [218, 31],
          [210, 66],
          [222, 66],
          [209, 97],
          [236, 59],
          [224, 59],
          [231, 31],
        ],
        "#f7e6bb",
      );
    }
  }
  if (state.effect === "festival") {
    for (let i = 0; i < 25; i++) {
      const x = rand(i + 3100) * 640,
        y = (rand(i + 3300) * 380 + t * 16) % 380;
      rect(c, x, y, 2, 3, ["#f6d17b", "#e5a7ac", "#a4d0ad"][i % 3]);
    }
  }
  if (!reduceMotion)
    for (let i = 0; i < 12; i++) {
      const x = rand(i + 4100) * 600 + 20 + Math.sin(t + i) * 5,
        y = 240 + rand(i + 4300) * 92 + Math.cos(t * 0.8 + i) * 7;
      c.globalAlpha = 0.3 + Math.sin(t * 1.6 + i) * 0.25;
      rect(c, x, y, 2, 2, "#ffe6a7");
    }
  c.globalAlpha = 1;
  return hotspots;
}
