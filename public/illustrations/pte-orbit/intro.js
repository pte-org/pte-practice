import * as THREE from "three";

/** Seconds for the entrance: camera glides in while the scene grows to full size. */
const INTRO_DURATION = 1.1;
const START_DISTANCE_FACTOR = 1.35;
const START_THETA_OFFSET = 0.55;
const START_PHI_OFFSET = -0.12;
const START_SCALE = 0.86;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Entrance animation: the camera starts further out and turned aside, the ecosystem slightly
 * smaller, and both ease into the default view saved by `controls.saveState()`. Any user input
 * ends it at once (the home-return glide takes over from there).
 *
 * @returns {{update: (delta: number) => void, cancel: () => void, dispose: () => void}}
 */
export const createIntro = ({ camera, controls, root }) => {
  const target = controls.target0.clone();
  const home = new THREE.Spherical().setFromVector3(
    controls.position0.clone().sub(controls.target0),
  );
  const from = new THREE.Spherical(
    Math.min(home.radius * START_DISTANCE_FACTOR, controls.maxDistance),
    home.phi + START_PHI_OFFSET,
    home.theta + START_THETA_OFFSET,
  );
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  let progress = 0;
  let active = true;

  const apply = (k) => {
    spherical.set(
      THREE.MathUtils.lerp(from.radius, home.radius, k),
      THREE.MathUtils.lerp(from.phi, home.phi, k),
      THREE.MathUtils.lerp(from.theta, home.theta, k),
    );
    camera.position.copy(target).add(offset.setFromSpherical(spherical));
    camera.lookAt(target);
    root.scale.setScalar(THREE.MathUtils.lerp(START_SCALE, 1, k));
  };

  const cancel = () => {
    if (!active) return;
    active = false;
    root.scale.setScalar(1);
  };

  apply(0);
  controls.addEventListener("start", cancel);

  return {
    update: (delta) => {
      if (!active) return;
      progress = Math.min(1, progress + delta / INTRO_DURATION);
      apply(easeOutCubic(progress));
      if (progress >= 1) active = false;
    },
    cancel,
    dispose: () => {
      cancel();
      controls.removeEventListener("start", cancel);
    },
  };
};
