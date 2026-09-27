import * as THREE from 'three';

export const POUCH_WIDTH = 2.4;
export const POUCH_HEIGHT = 3.5;
export const POUCH_DEPTH = 0.13;

/**
 * Cushion depth calculation for realistic flexible packaging volume
 */
export function getCushionZ(uNorm, vNorm) {
  const mx = 0.08;
  const myBot = 0.07;
  const myTop = 0.07;

  const tx = Math.max(0, Math.min(1, (uNorm - mx) / (1 - 2 * mx)));
  const ty = Math.max(0, Math.min(1, (vNorm - myBot) / (1 - myBot - myTop)));

  const sx = Math.sin(Math.PI * tx);
  const sy = Math.sin(Math.PI * ty);
  const cushion = Math.pow(sx * sy, 0.75);

  let crimp = 0;
  if (vNorm < myBot || vNorm > (1 - myTop)) {
    crimp = Math.sin(vNorm * 220) * 0.005 * (1 - cushion);
  }

  return cushion * (POUCH_DEPTH * 0.5) + crimp;
}

/**
 * Back Pouch Mesh Geometry (mapped to pouch-back.png)
 */
export function createBackPouchGeometry(Nx = 36, Ny = 45) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -POUCH_WIDTH / 2 + u * POUCH_WIDTH;
      const y = -POUCH_HEIGHT / 2 + v * POUCH_HEIGHT;
      const z = -getCushionZ(u, v);

      positions.push(x, y, z);
      uvs.push(1.0 - u, v);
    }
  }

  for (let j = 0; j < Ny; j++) {
    for (let i = 0; i < Nx; i++) {
      const a = j * (Nx + 1) + i;
      const b = j * (Nx + 1) + (i + 1);
      const c = (j + 1) * (Nx + 1) + i;
      const d = (j + 1) * (Nx + 1) + (i + 1);

      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  geom.userData.basePositions = new Float32Array(positions);
  geom.userData.Nx = Nx;
  geom.userData.Ny = Ny;

  return geom;
}

/**
 * Inner Cavity Geometry (silver foil lining inside the pouch where strip sits)
 */
export function createInnerCavityGeometry(Nx = 32, Ny = 40) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -POUCH_WIDTH / 2 + u * POUCH_WIDTH;
      const y = -POUCH_HEIGHT / 2 + v * POUCH_HEIGHT;
      const z = -0.030 - getCushionZ(u, v) * 0.20;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < Ny; j++) {
    for (let i = 0; i < Nx; i++) {
      const a = j * (Nx + 1) + i;
      const b = j * (Nx + 1) + (i + 1);
      const c = (j + 1) * (Nx + 1) + i;
      const d = (j + 1) * (Nx + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  geom.userData.basePositions = new Float32Array(positions);
  geom.userData.Nx = Nx;
  geom.userData.Ny = Ny;

  return geom;
}

/**
 * Front Peel Layer Geometry:
 * High resolution grid capable of organic S-curve corner peeling and backward fold.
 */
export function createFrontPeelGeometry(Nx = 48, Ny = 64) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -POUCH_WIDTH / 2 + u * POUCH_WIDTH;
      const y = -POUCH_HEIGHT / 2 + v * POUCH_HEIGHT;
      const z = getCushionZ(u, v);

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < Ny; j++) {
    for (let i = 0; i < Nx; i++) {
      const a = j * (Nx + 1) + i;
      const b = j * (Nx + 1) + (i + 1);
      const c = (j + 1) * (Nx + 1) + i;
      const d = (j + 1) * (Nx + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const posAttr = new THREE.Float32BufferAttribute(positions, 3);
  geom.setAttribute('position', posAttr);
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  geom.userData.basePositions = new Float32Array(positions);
  geom.userData.Nx = Nx;
  geom.userData.Ny = Ny;

  return geom;
}

/**
 * Sharp faceted paper crease transfer function.
 * Flattens valleys and peaks while steepening slopes to create crisp origami paper crease ridges.
 */
function sharpPaperCrease(phase) {
  const s = Math.sin(phase);
  return Math.sign(s) * Math.pow(Math.abs(s), 0.38);
}

/**
 * Calculates hand-crushed paper/foil fold displacement at normalized coordinates (u, v).
 */
export function getPaperCrumpleDisplacement(u, v, crumple) {
  if (crumple <= 0.0001) {
    return { dx: 0, dy: 0, dz: 0 };
  }

  // Non-linear buckling curve: paper initially flexes, then buckles sharply into faceted folds
  const c = Math.pow(crumple, 1.15);

  const uc = u - 0.5;
  const vc = v - 0.5;

  // 1. Inward lateral & vertical compression (pinched towards center by hand)
  const pinchX = -uc * c * 0.38 * (1.0 + 0.25 * Math.sin(v * 12.0));
  const pinchY = -vc * c * 0.30 * (1.0 + 0.25 * Math.cos(u * 10.0));

  // 2. Multi-frequency sharp origami & hand-fold faceted creases
  const fold1 = sharpPaperCrease((u * 2.4 + v * 1.9) * Math.PI * 2.8);
  const fold2 = sharpPaperCrease((u * 2.1 - v * 2.4) * Math.PI * 2.5);
  const fold3 = sharpPaperCrease((v * 3.6 + 0.3) * Math.PI);
  const centerVFold = sharpPaperCrease((1.0 - Math.abs(uc) * 2.0) * Math.PI * 1.4);

  // 3. Volumetric depth crinkling (sharp alternating ridges)
  const ridgeZ = (
    fold1 * 0.16 +
    fold2 * 0.13 +
    fold3 * 0.09 +
    centerVFold * 0.15
  ) * c;

  // 4. Perimeter irregular micro-crinkles
  const distFromCenter = Math.sqrt(uc * uc + vc * vc) * 2.0;
  const edgeCrinkle = Math.sin(u * 22.0 + v * 28.0) * 0.035 * Math.min(1.0, distFromCenter) * c;

  return {
    dx: pinchX,
    dy: pinchY,
    dz: ridgeZ + edgeCrinkle
  };
}

/**
 * Option 1: Deep Top-Half Peel Down Deformation:
 * Begins at the top notch ("PEEL HERE") and smoothly rolls downward across the entire top 50% of the pouch,
 * completely unveiling the inner cavity bed and the oral strip with an organic cylindrical foil roll.
 */
export function updatePeelDeformation(geom, peelProgress, crumpleProgress = 0) {
  if (!geom || !geom.userData.basePositions) return;

  const basePositions = geom.userData.basePositions;
  const posAttr = geom.attributes.position;
  const posArray = posAttr.array;
  const Nx = geom.userData.Nx;
  const Ny = geom.userData.Ny;

  if (peelProgress <= 0.001 && crumpleProgress <= 0.001) {
    for (let i = 0; i < basePositions.length; i++) {
      posArray[i] = basePositions[i];
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
    return;
  }

  // Full peel-off threshold: rolls down across 100% of the pouch height and slides completely off the bottom
  // Reaches from top notch (v=1.0) all the way down past the strip and off the bottom crimp
  const foldDist = peelProgress * 1.80;
  const rollWidth = 0.22 + peelProgress * 0.06; // smooth cylindrical foil roll crest

  let pIndex = 0;
  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;

      const baseX = basePositions[pIndex];
      const baseY = basePositions[pIndex + 1];
      const baseZ = basePositions[pIndex + 2];

      let curX = baseX;
      let curY = baseY;
      let curZ = baseZ;

      if (peelProgress > 0.001) {
        // Organic peel wavefront: starts at top-left notch (u=0, v=1) and rolls down across the full width
        const dv = 1.0 - v;
        const d = dv + 0.12 * u - 0.04 * Math.sin(u * Math.PI) + 0.03 * Math.sin(dv * 5.0) * (1.0 - u);

        const delta = foldDist - d;

        if (delta > 0) {
          // Rolling direction: downward with subtle lateral outward expansion
          const dirX = (u - 0.5) * 0.22;
          const dirY = -0.92;

          let travel = 0;
          let liftZ = 0;

          if (delta <= rollWidth) {
            // Inside the rolling crest: smooth quintic hermite curve for C2 continuity
            const tau = delta / rollWidth;
            const sCurve = tau * tau * (3.0 - 2.0 * tau);
            const angle = sCurve * Math.PI;

            travel = (rollWidth / Math.PI) * Math.sin(angle);
            liftZ = (rollWidth / Math.PI) * (1.0 - Math.cos(angle)) * (1.4 + peelProgress * 0.5);
            liftZ += 0.012 * Math.sin(sCurve * Math.PI) * Math.cos(u * 4.0);
          } else {
            // Past the crest: folded and rolled downward over the pouch front
            const past = delta - rollWidth;
            travel = (rollWidth / Math.PI) + past * (0.85 + 0.04 * Math.sin(u * 4.0));
            liftZ = (2.0 * rollWidth / Math.PI) * (1.4 + peelProgress * 0.5) + 0.02;

            // Natural free-edge curl at the top flap edge
            const topDist = dv;
            if (topDist < 0.25) {
              const curlFactor = (0.25 - topDist) / 0.25;
              liftZ += curlFactor * curlFactor * 0.09 * (1.0 + 0.3 * Math.abs(u - 0.5));
            }
          }

          curX = baseX + dirX * travel * POUCH_WIDTH * 0.30;
          curY = baseY + dirY * travel * POUCH_HEIGHT * 0.85;
          curZ = baseZ + liftZ;
        }
      }

      // Hand-paper crumple displacement
      if (crumpleProgress > 0.001) {
        const { dx, dy, dz } = getPaperCrumpleDisplacement(u, v, crumpleProgress);
        curX += dx * POUCH_WIDTH * 0.65;
        curY += dy * POUCH_HEIGHT * 0.65;
        curZ += dz;
      }

      posArray[pIndex] = curX;
      posArray[pIndex + 1] = curY;
      posArray[pIndex + 2] = curZ;

      pIndex += 3;
    }
  }

  posAttr.needsUpdate = true;
  geom.computeVertexNormals();
}

/**
 * Updates back pouch & inner silver cavity geometries with hand-paper crumple deformation.
 */
export function updateBackAndCavityCrumple(geom, crumpleProgress, isCavity = false) {
  if (!geom || !geom.userData.basePositions) return;

  const basePositions = geom.userData.basePositions;
  const posAttr = geom.attributes.position;
  const posArray = posAttr.array;
  const Nx = geom.userData.Nx;
  const Ny = geom.userData.Ny;

  if (crumpleProgress <= 0.001) {
    for (let i = 0; i < basePositions.length; i++) {
      posArray[i] = basePositions[i];
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
    return;
  }

  let pIndex = 0;
  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;

      const baseX = basePositions[pIndex];
      const baseY = basePositions[pIndex + 1];
      const baseZ = basePositions[pIndex + 2];

      const { dx, dy, dz } = getPaperCrumpleDisplacement(u, v, crumpleProgress);
      const zSpread = isCavity ? -0.015 : -0.035;

      posArray[pIndex] = baseX + dx * POUCH_WIDTH * 0.65;
      posArray[pIndex + 1] = baseY + dy * POUCH_HEIGHT * 0.65;
      posArray[pIndex + 2] = baseZ + dz * 0.85 + zSpread * crumpleProgress;

      pIndex += 3;
    }
  }

  posAttr.needsUpdate = true;
  geom.computeVertexNormals();
}

/**
 * Oral Strip Geometry:
 * Thin, elongated rectangular oral dissolving film patch matching reference image.
 * Dimensions: width = 1.12, height = 1.75 (1.86x longer than previous).
 * Features subtle center vertical crease line, micro-wave surface flex, and thin solid depth.
 */
export function createOralStripGeometry(Nx = 28, Ny = 38, width = 1.12, height = 1.75) {
  const geom = new THREE.BufferGeometry();
  const thickness = 0.004;

  const positions = [];
  const uvs = [];
  const indices = [];

  // Front face
  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -width / 2 + u * width;
      const y = -height / 2 + v * height;

      // Subtle center vertical crease line matching reference photo
      const centerDist = Math.abs(u - 0.5) * 2.0;
      const centerCrease = (1.0 - Math.pow(centerDist, 0.45)) * 0.002;
      // Gentle surface film flex
      const wave = Math.sin(u * Math.PI) * 0.002 + Math.sin(v * Math.PI) * 0.002;
      const z = thickness / 2 - centerCrease + wave;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const offsetBack = (Nx + 1) * (Ny + 1);

  // Back face
  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -width / 2 + u * width;
      const y = -height / 2 + v * height;

      const centerDist = Math.abs(u - 0.5) * 2.0;
      const centerCrease = (1.0 - Math.pow(centerDist, 0.45)) * 0.002;
      const wave = Math.sin(u * Math.PI) * 0.002 + Math.sin(v * Math.PI) * 0.002;
      const z = -thickness / 2 - centerCrease + wave;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Front indices
  for (let j = 0; j < Ny; j++) {
    for (let i = 0; i < Nx; i++) {
      const a = j * (Nx + 1) + i;
      const b = j * (Nx + 1) + (i + 1);
      const c = (j + 1) * (Nx + 1) + i;
      const d = (j + 1) * (Nx + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  // Back indices
  for (let j = 0; j < Ny; j++) {
    for (let i = 0; i < Nx; i++) {
      const a = offsetBack + j * (Nx + 1) + i;
      const b = offsetBack + j * (Nx + 1) + (i + 1);
      const c = offsetBack + (j + 1) * (Nx + 1) + i;
      const d = offsetBack + (j + 1) * (Nx + 1) + (i + 1);

      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  // Skirts for thin solid depth
  for (let i = 0; i < Nx; i++) {
    const f1 = i;
    const f2 = i + 1;
    const b1 = offsetBack + i;
    const b2 = offsetBack + i + 1;
    indices.push(f1, b1, b2);
    indices.push(f1, b2, f2);

    const tf1 = Ny * (Nx + 1) + i;
    const tf2 = Ny * (Nx + 1) + (i + 1);
    const tb1 = offsetBack + Ny * (Nx + 1) + i;
    const tb2 = offsetBack + Ny * (Nx + 1) + (i + 1);
    indices.push(tf1, tb2, tb1);
    indices.push(tf1, tf2, tb2);
  }

  for (let j = 0; j < Ny; j++) {
    const f1 = j * (Nx + 1);
    const f2 = (j + 1) * (Nx + 1);
    const b1 = offsetBack + j * (Nx + 1);
    const b2 = (j + 1) * (Nx + 1);
    indices.push(f1, b2, b1);
    indices.push(f1, f2, b2);

    const rf1 = j * (Nx + 1) + Nx;
    const rf2 = (j + 1) * (Nx + 1) + Nx;
    const rb1 = offsetBack + j * (Nx + 1) + Nx;
    const rb2 = offsetBack + (j + 1) * (Nx + 1) + Nx;
    indices.push(rf1, rb1, rb2);
    indices.push(rf1, rb2, rf2);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}
