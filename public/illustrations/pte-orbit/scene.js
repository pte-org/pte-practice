import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SETTINGS, THEMES } from "./constants.js";
import { createEcosystem } from "./models.js?v=motion-9";
import { createHomeReturn } from "./home-return.js?v=motion-5";
import { createIntro } from "./intro.js?v=motion-10";

/**
 * @param {{intro?: boolean}} [options] `intro` plays the entrance glide-in (used when embedded).
 * @returns {{setTheme: Function, setMotion: Function, reset: Function, dispose: Function}}
 */
export const mountScene = (host, reducedMotion, options = {}) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60);
  camera.position.set(...SETTINGS.camera);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SETTINGS.maxPixelRatio));
  // Neutral keeps the brand blues saturated; ACES Filmic washed them towards pastel.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-label", "PTE Orbit 3D");
  renderer.domElement.tabIndex = 0;
  host.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...SETTINGS.target);
  controls.enableDamping = !reducedMotion;
  controls.enablePan = false;
  controls.minDistance = SETTINGS.minimumDistance;
  controls.maxDistance = SETTINGS.maximumDistance;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.8;
  controls.update();
  controls.saveState();
  const ecosystem = createEcosystem();
  scene.add(ecosystem.root);
  scene.add(new THREE.HemisphereLight(0xe7f4ff, 0x67829e, 1.4));
  const key = new THREE.DirectionalLight(0xfff1db, 2.5);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(SETTINGS.shadowMapSize);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x97cfff, 1.8);
  rim.position.set(3, 3, -4);
  scene.add(rim);
  // Receive shadows without lighting a visible rectangle against the CSS background.
  const floorMaterial = new THREE.ShadowMaterial({ color: 0x183d60, opacity: 0.13 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.38;
  floor.receiveShadow = true;
  scene.add(floor);
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.fov = width < 420 ? 47 : width < 600 ? 43 : 37;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
  };
  let playing = !reducedMotion;
  let elapsed = 0;
  let previousTime = null;
  let disposed = false;
  let contextLost = false;
  let environment = null;
  let environmentStarted = false;
  const render = () => {
    if (!disposed && !contextLost) renderer.render(scene, camera);
  };
  const enhanceEnvironment = () => {
    if (disposed || contextLost || environmentStarted) return;
    environmentStarted = true;
    try {
      const environmentScene = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      environment = generator.fromScene(environmentScene, 0.04);
      scene.environment = environment.texture;
      environmentScene.dispose();
      generator.dispose();
      render();
    } catch (error) {
      console.warn("PTE Orbit environment enhancement was skipped:", error);
    }
  };
  const setTheme = (name) => {
    const theme = THEMES[name] ?? THEMES.light;
    scene.background = new THREE.Color(theme.background);
    ecosystem.orbitMaterial.color.setHex(theme.orbit);
    scene.environmentIntensity = theme.intensity;
    renderer.toneMappingExposure = name === "dark" ? 1.05 : 1;
    render();
  };
  const tick = (timestamp) => {
    if (disposed || contextLost) return;
    const elapsedDelta = previousTime === null ? 0 : (timestamp - previousTime) / 1000;
    const delta = Math.min(elapsedDelta, SETTINGS.maxDelta);
    previousTime = timestamp;
    if (playing) {
      // Orbital speed follows real time even when rendering takes longer than one frame.
      elapsed += elapsedDelta;
      ecosystem.update(elapsed);
    }
    intro?.update(delta);
    homeReturn.update(delta);
    controls.update(delta);
    render();
  };
  const visibility = () => {
    previousTime = null;
    renderer.setAnimationLoop(document.hidden || contextLost || !playing ? null : tick);
  };
  const homeReturn = createHomeReturn({
    camera,
    controls,
    element: renderer.domElement,
    canAnimate: () => playing && !document.hidden && !contextLost,
    render,
  });
  // Entrance glide-in; skipped when nothing animates (paused or reduced motion).
  const intro =
    options.intro && playing ? createIntro({ camera, controls, root: ecosystem.root }) : null;
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const onKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === "ArrowLeft") spherical.theta -= 0.1;
    if (event.key === "ArrowRight") spherical.theta += 0.1;
    if (event.key === "ArrowUp") spherical.phi -= 0.08;
    if (event.key === "ArrowDown") spherical.phi += 0.08;
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi,
      controls.minPolarAngle,
      controls.maxPolarAngle,
    );
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
    render();
    homeReturn.afterKeyboard();
  };
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    visibility();
    host.dispatchEvent(new CustomEvent("scene-error", { detail: "context-lost" }));
  };
  renderer.domElement.addEventListener("keydown", onKeyDown);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  controls.addEventListener("change", () => {
    if (!playing) render();
  });
  document.addEventListener("visibilitychange", visibility);
  setTheme("light");
  resize();
  renderer.setAnimationLoop(playing ? tick : null);
  host.dataset.ready = "true";
  host.dataset.threeRevision = THREE.REVISION;
  host.dataset.meshes = String(renderer.info.render.calls);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(enhanceEnvironment, { timeout: 1600 });
  } else {
    window.setTimeout(enhanceEnvironment, 0);
  }
  return {
    setTheme,
    setMotion: (value) => {
      playing = value;
      controls.enableDamping = value && !reducedMotion;
      visibility();
      render();
    },
    reset: () => {
      intro?.cancel();
      homeReturn.cancel();
      controls.reset();
      elapsed = 0;
      ecosystem.update(0);
      render();
    },
    dispose: () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      intro?.dispose();
      homeReturn.dispose();
      controls.dispose();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (object.isMesh) {
          geometries.add(object.geometry);
          const values = Array.isArray(object.material) ? object.material : [object.material];
          values.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
};
