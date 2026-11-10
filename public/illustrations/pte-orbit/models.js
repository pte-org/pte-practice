import * as THREE from "three";
import { COLORS } from "./constants.js";
import { ceramic, roundedBox, sphere, torus, tube, cylinder } from "./primitives.js";
import { createBrandMonogram } from "./logo.js?v=motion-7";

const ORBIT_SPEEDS = Object.freeze([0.28, -0.2]);

const createMaterials = () => ({
  blue: ceramic(COLORS.blue),
  navy: ceramic(COLORS.navy),
  paper: ceramic(COLORS.paper),
  porcelain: ceramic(COLORS.porcelain),
  ice: ceramic(COLORS.ice),
  mint: ceramic(COLORS.mint),
  gold: ceramic(COLORS.gold, { metalness: 0.65, roughness: 0.22 }),
  silver: ceramic(COLORS.silver, { metalness: 0.8, roughness: 0.2 }),
});

const createCalendar = (materials) => {
  const group = new THREE.Group();
  group.name = "exam-calendar";
  group.add(roundedBox(1.24, 1.38, 0.24, 0.11, materials.porcelain));
  group.add(roundedBox(1.24, 0.35, 0.25, 0.08, materials.blue, [0, 0.5, 0.015]));
  for (const x of [-0.35, 0.35]) {
    const loop = torus(0.105, 0.035, materials.silver, [x, 0.68, 0.035]);
    loop.rotation.y = Math.PI / 2;
    group.add(loop);
  }
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      group.add(
        roundedBox(
          0.22,
          0.19,
          0.045,
          0.04,
          row === 1 && column === 1 ? materials.mint : materials.ice,
          [-0.34 + column * 0.34, 0.16 - row * 0.3, 0.14],
        ),
      );
    }
  }
  group.add(
    tube(
      [
        [-0.075, -0.15, 0.18],
        [-0.015, -0.21, 0.18],
        [0.095, -0.08, 0.18],
      ],
      0.016,
      materials.navy,
    ),
  );
  return group;
};

const createHeadset = (materials) => {
  const group = new THREE.Group();
  group.name = "learner-headset";
  const points = Array.from({ length: 25 }, (_, index) => {
    const angle = (Math.PI * index) / 24;
    return [Math.cos(angle) * 0.66, Math.sin(angle) * 0.75, 0];
  });
  group.add(tube(points, 0.095, materials.porcelain));
  group.add(
    tube(
      points.map(([x, y, z]) => [x * 0.87, y * 0.87, z]),
      0.05,
      materials.navy,
    ),
  );
  for (const side of [-1, 1]) {
    group.add(roundedBox(0.28, 0.53, 0.36, 0.11, materials.blue, [side * 0.64, -0.12, 0]));
    group.add(roundedBox(0.1, 0.43, 0.3, 0.045, materials.navy, [side * 0.49, -0.12, 0]));
  }
  group.add(
    tube(
      [
        [0.69, -0.3, 0.12],
        [0.62, -0.58, 0.2],
        [0.19, -0.64, 0.29],
      ],
      0.025,
      materials.silver,
    ),
  );
  group.add(roundedBox(0.22, 0.09, 0.09, 0.035, materials.navy, [0.13, -0.64, 0.29]));
  return group;
};

const createReport = (materials) => {
  const group = new THREE.Group();
  group.name = "progress-report";
  group.add(roundedBox(1.3, 1.13, 0.22, 0.1, materials.porcelain));
  group.add(roundedBox(0.5, 0.045, 0.03, 0.015, materials.navy, [-0.23, 0.34, 0.13]));
  [0.23, 0.38, 0.56, 0.72].forEach((height, index) => {
    group.add(
      roundedBox(
        0.16,
        height,
        0.1,
        0.035,
        [materials.ice, materials.blue, materials.blue, materials.mint][index],
        [-0.4 + index * 0.27, -0.38 + height / 2, 0.17],
      ),
    );
  });
  const medal = cylinder(0.21, 0.09, materials.gold, [0.56, 0.51, 0.18]);
  medal.rotation.x = Math.PI / 2;
  group.add(medal);
  group.add(
    tube(
      [
        [0.47, 0.51, 0.24],
        [0.53, 0.45, 0.24],
        [0.65, 0.59, 0.24],
      ],
      0.022,
      materials.paper,
    ),
  );
  return group;
};

const createLearnerCard = (materials) => {
  const group = new THREE.Group();
  group.name = "learner-identity";
  group.add(roundedBox(1.05, 0.7, 0.16, 0.09, materials.blue));
  group.add(sphere(0.1, materials.porcelain, [-0.25, 0.11, 0.11]));
  const shoulders = sphere(0.16, materials.porcelain, [-0.25, -0.14, 0.06]);
  shoulders.scale.set(1, 0.6, 0.4);
  group.add(shoulders);
  group.add(roundedBox(0.32, 0.035, 0.025, 0.015, materials.ice, [0.17, 0.08, 0.1]));
  group.add(roundedBox(0.22, 0.035, 0.025, 0.015, materials.ice, [0.12, -0.04, 0.1]));
  return group;
};

/** Edge-weighted glow: alpha = intensity · (1 − n·v)^power. */
const createFresnelRimMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      rimColor: { value: new THREE.Color(0x7fb4ea) },
      power: { value: 2 },
      intensity: { value: 0.95 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 rimColor;
      uniform float power;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
        float rim = pow(1.0 - facing, power) * intensity;
        gl_FragColor = vec4(rimColor, rim);
        #include <colorspace_fragment>
      }
    `,
  });

const createCore = (materials) => {
  const group = new THREE.Group();
  group.name = "pte-glass-core";
  // Alpha-blended glass rather than `transmission`: transmission re-renders the logo into an
  // offscreen buffer and refracts it, which blurred the mark and shifted its blues. A faint,
  // glossy transparent shell drawn after the opaque logo keeps the mark crisp and true to the
  // 2D colours while the clearcoat still gives glass highlights.
  const glass = ceramic(0xffffff, {
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    roughness: 0.04,
    metalness: 0,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.7,
  });
  const shell = sphere(1.05, glass);
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.renderOrder = 1;
  group.add(shell);
  // Fresnel rim: clear in the middle, bright towards the silhouette like real glass, so the
  // sphere reads as glass without washing a white film over the logo inside.
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 40), createFresnelRimMaterial());
  rim.renderOrder = 2;
  group.add(rim);
  group.add(createBrandMonogram());
  const collar = torus(1.07, 0.016, materials.silver);
  collar.rotation.set(Math.PI / 2.7, 0.25, 0);
  group.add(collar);
  return group;
};

const createOrbit = (radius, rotation, material, speed) => {
  const group = new THREE.Group();
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.78);
  const points = curve.getPoints(128).map((point) => new THREE.Vector3(point.x, 0, point.y));
  const path = new THREE.CatmullRomCurve3(points, true);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 160, 0.008, 5, true), material));
  group.rotation.set(...rotation);
  return { group, path, rotation, speed };
};

/** @returns {{root: THREE.Group, update: Function, orbitMaterial: THREE.MeshStandardMaterial}} */
export const createEcosystem = () => {
  const materials = createMaterials();
  const root = new THREE.Group();
  const core = createCore(materials);
  core.position.y = 0.48;
  root.add(core);
  const pedestal = cylinder(1.35, 0.23, materials.porcelain, [0, -1.25, 0]);
  root.add(pedestal);
  root.add(cylinder(1.19, 0.04, materials.silver, [0, -1.115, 0]));
  root.add(cylinder(0.99, 0.035, materials.blue, [0, -1.08, 0]));
  const orbitMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a78b8,
    roughness: 0.4,
    metalness: 0.5,
  });
  const orbits = [
    createOrbit(2.43, [0.24, 0, -0.25], orbitMaterial, ORBIT_SPEEDS[0]),
    createOrbit(2.17, [-0.5, 0.45, 0.5], orbitMaterial, ORBIT_SPEEDS[1]),
  ];
  orbits.forEach(({ group }) => {
    group.position.y = 0.42;
    root.add(group);
  });
  const nodes = [
    {
      object: createCalendar(materials),
      position: [-2.03, 1.2, 0.25],
      rotation: [-0.08, 0.3, -0.13],
    },
    {
      object: createHeadset(materials),
      position: [1.8, 1.55, -0.35],
      rotation: [0.08, -0.25, -0.18],
    },
    {
      object: createReport(materials),
      position: [1.98, -0.35, 1.05],
      rotation: [-0.04, -0.2, 0.12],
    },
    {
      object: createLearnerCard(materials),
      position: [-1.62, -0.42, 1.38],
      rotation: [0.05, 0.35, -0.16],
    },
  ];
  nodes.forEach(({ object, position, rotation }) => {
    object.position.set(...position);
    object.rotation.set(...rotation);
    root.add(object);
  });
  const beads = orbits.map(({ group }, index) => {
    const bead = sphere(index === 0 ? 0.065 : 0.045, index === 0 ? materials.gold : materials.mint);
    group.add(bead);
    return bead;
  });
  const accents = [
    [-0.95, 2.1, -0.8],
    [2.7, 0.35, -0.3],
    [-2.5, 0.05, -0.5],
  ];
  accents.forEach((position, index) =>
    root.add(sphere(0.06 + index * 0.015, index === 1 ? materials.gold : materials.ice, position)),
  );
  const update = (time) => {
    // Keep the glass sphere and P monogram fixed while the orbit rings turn around it.
    core.position.y = 0.48;
    core.rotation.set(0, 0, 0);
    orbits.forEach(({ group, rotation, speed }) => {
      group.rotation.set(rotation[0], rotation[1] + time * speed, rotation[2]);
    });
    nodes.forEach(({ object, position, rotation }, index) => {
      object.position.y = position[1] + Math.sin(time * 0.7 + index * 1.6) * 0.09;
      object.rotation.z = rotation[2] + Math.sin(time * 0.5 + index) * 0.035;
    });
    beads.forEach((bead, index) =>
      bead.position.copy(orbits[index].path.getPointAt((time * 0.035 + index * 0.5) % 1)),
    );
  };
  update(0);
  return { root, update, orbitMaterial };
};
