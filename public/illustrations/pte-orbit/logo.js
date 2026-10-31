import * as THREE from "three";
import { ceramic, mesh } from "./primitives.js";

const LOGO = Object.freeze({
  scale: 0.0025,
  centerX: 237,
  centerY: 281,
  depth: 0.22,
  bevelSize: 0.012,
  bevelThickness: 0.012,
  bevelSegments: 4,
});

/**
 * Per-ribbon gradients based on the 2D brand mark (logo-mark.png), deepened ~10% so the mark
 * still reads as dark as the 2D logo once lit and seen through the glass, laid along the same
 * direction as in the artwork. `axis(x, y)` maps a point in source-path units to 0..1.
 */
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const GRADIENTS = Object.freeze({
  // Top edge fading to the deep right-hand bowl (2D: #005EFC → #003DF5).
  outerRing: { from: 0x0052ec, to: 0x0030e0, axis: (x) => clamp01(x / 474) },
  // Back stem: cyan at the top to blue lower down (2D: #01B2FB → #0069FB).
  backStem: { from: 0x00a0ea, to: 0x005ced, axis: (_x, y) => clamp01((y - 76) / 300) },
  // Inner fold: blue near the bowl, brightening to cyan towards the lower left (2D: #017DFB → #00A8FC).
  innerFold: {
    from: 0x016eec,
    to: 0x0096ea,
    axis: (x, y) => clamp01(((384 - x) / 167) * 0.4 + ((y - 49) / 301) * 0.6),
  },
  // Front stem: blue at the top deepening at the tail (2D: #0052FB → #003CF4).
  frontStem: { from: 0x0046ec, to: 0x0030dc, axis: (_x, y) => clamp01((y - 76) / 486) },
});

// Partition the reference into adjoining solids so shared folds do not overlap.
const OUTER_RING = [
  ["M", 0, 0],
  ["L", 273, 0],
  ["C", 384, 0, 474, 87, 474, 198],
  ["C", 474, 309, 386, 389, 273, 389],
  ["L", 200, 389],
  ["L", 200, 308],
  ["C", 200, 333, 213, 350, 233, 350],
  ["C", 319, 350, 384, 291, 384, 215],
  ["C", 384, 137, 300, 60, 217, 49],
  ["L", 50, 49],
  ["C", 23, 49, 0, 29, 0, 0],
  ["Z"],
];

const BACK_STEM = [
  ["M", 91, 76],
  ["L", 145, 76],
  ["C", 120, 76, 102, 90, 102, 108],
  ["L", 102, 449],
  ["C", 102, 468, 108, 480, 122, 493],
  ["L", 200, 562],
  ["L", 64, 443],
  ["C", 49, 429, 42, 415, 42, 393],
  ["L", 42, 126],
  ["C", 42, 99, 64, 76, 91, 76],
  ["Z"],
];

const INNER_FOLD = [
  ["M", 217, 49],
  ["C", 300, 60, 384, 137, 384, 215],
  ["C", 384, 291, 319, 350, 233, 350],
  ["C", 255, 346, 267, 332, 267, 309],
  ["L", 267, 111],
  ["C", 267, 81, 247, 49, 217, 49],
  ["Z"],
];

const FRONT_STEM = [
  ["M", 145, 76],
  ["C", 176, 76, 200, 101, 200, 132],
  ["L", 200, 562],
  ["L", 122, 493],
  ["C", 108, 480, 102, 468, 102, 449],
  ["L", 102, 108],
  ["C", 102, 90, 120, 76, 145, 76],
  ["Z"],
];

const buildShape = (commands) => {
  const shape = new THREE.Shape();
  const point = (x, y) => [(x - LOGO.centerX) * LOGO.scale, (LOGO.centerY - y) * LOGO.scale];
  for (const [command, ...coordinates] of commands) {
    if (command === "M") shape.moveTo(...point(...coordinates));
    if (command === "L") shape.lineTo(...point(...coordinates));
    if (command === "C") {
      shape.bezierCurveTo(
        ...point(coordinates[0], coordinates[1]),
        ...point(coordinates[2], coordinates[3]),
        ...point(coordinates[4], coordinates[5]),
      );
    }
    if (command === "Z") shape.closePath();
  }
  return shape;
};

const createRibbon = (commands, name, offset, gradient) => {
  const geometry = new THREE.ExtrudeGeometry(buildShape(commands), {
    depth: LOGO.depth,
    steps: 1,
    curveSegments: 40,
    bevelEnabled: true,
    bevelSize: LOGO.bevelSize,
    bevelThickness: LOGO.bevelThickness,
    bevelSegments: LOGO.bevelSegments,
  });
  geometry.translate(0, 0, -LOGO.depth / 2);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const start = new THREE.Color(gradient.from);
  const end = new THREE.Color(gradient.to);
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) / LOGO.scale + LOGO.centerX;
    const y = LOGO.centerY - positions.getY(index) / LOGO.scale;
    color
      .copy(start)
      .lerp(end, gradient.axis(x, y))
      .toArray(colors, index * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingBox();
  // Unlit front faces reproduce the 2D mark's exact colours and gradient; only the bevelled
  // sides take light, which keeps the extruded depth readable.
  const face = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const edge = ceramic(gradient.to, {
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.2,
    specularIntensity: 0.2,
    envMapIntensity: 1.1,
    toneMapped: false,
  });
  const ribbon = mesh(geometry, [face, edge], [0, 0, offset]);
  ribbon.name = name;
  return ribbon;
};

/** @returns {THREE.Group} */
export const createBrandMonogram = () => {
  const group = new THREE.Group();
  group.name = "pte-brand-monogram";
  group.add(createRibbon(OUTER_RING, "outer-blue-ribbon", 0, GRADIENTS.outerRing));
  group.add(createRibbon(BACK_STEM, "cyan-back-stem", 0, GRADIENTS.backStem));
  // Small depth offsets preserve the folded ribbon seams when viewed from the side.
  group.add(createRibbon(INNER_FOLD, "cyan-inner-fold", 0.008, GRADIENTS.innerFold));
  group.add(createRibbon(FRONT_STEM, "front-blue-stem", 0.016, GRADIENTS.frontStem));
  group.rotation.y = 0.28;
  return group;
};
