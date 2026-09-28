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
 * Realistic 180-Degree Foil Peel Deformation:
 * Implements physically authentic foil peel mechanics with a tight 180° cylindrical roll crest
 * initiating at the top-left tear notch ("PEEL HERE") and rolling tightly downward across the pouch.
 * - The unpeeled portion remains 100% firmly attached to the pouch.
 * - The rolling crest curves tightly (R = 0.052), flipping the material upside down.
 * - The peeled flap folds backwards 180°, displaying the metallic silver interior foil,
 *   laying tight against the pouch without ballooning or floating into mid-air.
 * - Progresses cleanly down past the bottom crimp for a 100% full peel-off.
 */
export function updatePeelDeformation(geom, peelProgress, crumpleProgress = 0) {
  if (!geom || !geom.userData.basePositions) return;

  const basePositions = geom.userData.basePositions;
  const posAttr = geom.attributes.position;
  const posArray = posAttr.array;
  const Nx = geom.userData.Nx;
  const Ny = geom.userData.Ny;

  if (peelProgress <= 0.0005 && crumpleProgress <= 0.0005) {
    for (let i = 0; i < basePositions.length; i++) {
      posArray[i] = basePositions[i];
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
    return;
  }

  // Peeling wavefront travels smoothly from top notch (y = +1.80) to past the bottom crimp (y = -1.90)
  // Pouch spans y in [-1.75, +1.75]. Total travel span = 3.70 units.
  const yCenter = 1.80 - peelProgress * 3.70;

  // Crisp, authentic aluminum foil bend radius (physical hinge, NOT a tube)
  const R = 0.085;
  const Lbend = Math.PI * R; // ~0.267 units

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

      if (peelProgress > 0.0005) {
        // Natural diagonal slant: top-left notch initiates the peel first
        const slant = 0.16 * (u - 0.5) - 0.02 * Math.sin(u * Math.PI);
        const yCrease = yCenter + slant;

        // Distance from vertex to current crease line along the pouch height
        const d = baseY - yCrease;

        if (d <= 0) {
          // 1. Unpeeled: firmly attached to the pouch
          curX = baseX;
          curY = baseY;
          curZ = baseZ;
        } else {
          // 2. Realistic Tactile Foil Peel (Length-Preserving 180° Fold)
          let dy = 0;
          let dz = 0;

          if (d <= Lbend) {
            // Inside the tight 180° smooth bend curve
            const theta = (d / Lbend) * Math.PI; // 0 to PI
            dy = R * Math.sin(theta);
            dz = R * (1.0 - Math.cos(theta));
          } else {
            // Past the bend: the peeled foil flap folds downward in front of the pouch
            const dRem = d - Lbend;
            // Preserves sheet length while tilting gently forward away from pouch
            const tiltCos = 0.95;
            const tiltSin = 0.28;
            dy = -dRem * tiltCos;
            dz = 2.0 * R + dRem * tiltSin;
          }

          // Subtle authentic metallic foil physics:
          // Transverse cupping across width:
          const cupZ = 0.018 * Math.sin(u * Math.PI) * Math.min(1.0, d / 0.35);
          // Very gentle micro-wave:
          const waveZ = 0.008 * Math.sin(d * 3.5) * Math.min(1.0, d);
          // Subtle lateral contraction:
          const pinchX = 0.012 * (u - 0.5) * Math.min(1.0, d / 0.5);

          curX = baseX + pinchX;
          curY = yCrease + dy;
          curZ = baseZ + dz + cupZ + waveZ;

          // As the peel reaches the bottom (peelProgress > 0.80),
          // the fully detached flap smoothly drifts downward and forward
          if (peelProgress > 0.80) {
            const detach = peelProgress - 0.80;
            curY -= detach * detach * 4.5;
            curZ += detach * 0.35;
          }
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
