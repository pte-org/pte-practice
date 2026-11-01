import * as THREE from "three";

/** Seconds the camera takes to glide back to the default view. */
const RETURN_DURATION = 0.8;
/** Wait after a drag ends before gliding back (ms). */
const POINTER_DELAY = 120;
/** Wheel and keyboard input arrive as bursts, so wait for the burst to finish (ms). */
const BURST_DELAY = 600;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Returns the camera to the view saved by `controls.saveState()` whenever the user lets go:
 * after a drag, a wheel zoom, or arrow-key rotation. Any new input cancels the glide.
 * When `canAnimate()` is false (paused or reduced motion) the view snaps back instead.
 *
 * @returns {{update: (delta: number) => void, afterKeyboard: () => void, cancel: () => void, dispose: () => void}}
 */
export const createHomeReturn = ({ camera, controls, element, canAnimate, render }) => {
  const homeTarget = controls.target0.clone();
  const homeOffset = new THREE.Spherical().setFromVector3(
    controls.position0.clone().sub(controls.target0),
  );
  const offset = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  let timer = null;
  let tween = null;
  let burst = false;

  const cancel = () => {
    window.clearTimeout(timer);
    timer = null;
    tween = null;
  };

  const begin = () => {
    timer = null;
    if (!canAnimate()) {
      controls.reset();
      render();
      return;
    }
    // Drop the damping inertia left from the drag so it does not fight the glide.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    const from = new THREE.Spherical().setFromVector3(
      offset.copy(camera.position).sub(controls.target),
    );
    const turn = homeOffset.theta - from.theta;
    tween = {
      progress: 0,
      from,
      // Shortest way round, so a half-turn drag does not spin back the long way.
      deltaTheta: Math.atan2(Math.sin(turn), Math.cos(turn)),
      fromTarget: controls.target.clone(),
    };
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(begin, burst ? BURST_DELAY : POINTER_DELAY);
    burst = false;
  };

  // Capture phase so the flag is set before OrbitControls dispatches its start/end pair.
  const onWheel = () => {
    burst = true;
  };

  controls.addEventListener("start", cancel);
  controls.addEventListener("end", schedule);
  element.addEventListener("wheel", onWheel, { passive: true, capture: true });

  return {
    update: (delta) => {
      if (!tween) return;
      tween.progress = Math.min(1, tween.progress + delta / RETURN_DURATION);
      const k = easeOutCubic(tween.progress);
      spherical.set(
        THREE.MathUtils.lerp(tween.from.radius, homeOffset.radius, k),
        THREE.MathUtils.lerp(tween.from.phi, homeOffset.phi, k),
        tween.from.theta + tween.deltaTheta * k,
      );
      controls.target.lerpVectors(tween.fromTarget, homeTarget, k);
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      camera.lookAt(controls.target);
      if (tween.progress >= 1) tween = null;
    },
    afterKeyboard: () => {
      cancel();
      burst = true;
      schedule();
    },
    cancel,
    dispose: () => {
      cancel();
      controls.removeEventListener("start", cancel);
      controls.removeEventListener("end", schedule);
      element.removeEventListener("wheel", onWheel, { capture: true });
    },
  };
};
