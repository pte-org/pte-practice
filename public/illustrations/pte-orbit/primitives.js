import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** @returns {THREE.MeshPhysicalMaterial} */
export const ceramic = (color, options = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25,
    ...options,
  });

/** @returns {THREE.Mesh} */
export const mesh = (geometry, material, position = [0, 0, 0]) => {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
};

/** @returns {THREE.Mesh} */
export const roundedBox = (width, height, depth, radius, material, position) =>
  mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material, position);

/** @returns {THREE.Mesh} */
export const tube = (points, radius, material) => {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return mesh(new THREE.TubeGeometry(curve, 36, radius, 8, false), material);
};

/** @returns {THREE.Mesh} */
export const sphere = (radius, material, position) =>
  mesh(new THREE.SphereGeometry(radius, 32, 20), material, position);

/** @returns {THREE.Mesh} */
export const torus = (radius, thickness, material, position) =>
  mesh(new THREE.TorusGeometry(radius, thickness, 12, 96), material, position);

/** @returns {THREE.Mesh} */
export const cylinder = (radius, height, material, position) =>
  mesh(new THREE.CylinderGeometry(radius, radius, height, 96), material, position);
