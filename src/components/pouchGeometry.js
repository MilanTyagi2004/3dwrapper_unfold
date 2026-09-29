import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// EXACT DEMONIC FUEL POUCH PROPORTIONS (Matching Real Photo on Right)
// Dimensions: 2.46 width x 3.50 height (Aspect Ratio ~ 1 : 1.42)
// Physical Features:
// 1. Steep, distinct 3D shoulder at the seal line transitioning into puffed pillow
// 2. Sculpted physical metallic foil crinkles matching the photo ridges
// 3. Dual side tear notches (left & right) in the top seal band
// 4. Top-edge center dip notch + 45° corner chamfers + rounded bottom corners
// ─────────────────────────────────────────────────────────────────────────────
export const POUCH_WIDTH = 2.46;
export const POUCH_HEIGHT = 3.50;
export const POUCH_DEPTH = 0.24;

// Exact sealed border dimensions matching reference photo
export const SEAL_TOP_H = 0.44;   // Top seal band containing "PEEL HERE" & tear notches (~12.5% height)
export const SEAL_BOT_H = 0.20;   // Bottom seal band below text (~5.7% height)
export const SEAL_SIDE_W = 0.16;  // Left & right seal margins (~6.5% width)
// Arch height for inverted-cone top seal (UV units) — center rises ARCH_AMOUNT above side baseline
export const ARCH_AMOUNT = 0.08;

/**
 * Sharp faceted foil crease function for physically authentic flexible packaging
 */
function sharpFoilCrease(phase) {
  const s = Math.sin(phase);
  return Math.sign(s) * Math.pow(Math.abs(s), 0.38);
}

/**
 * Cushion depth calculation:
 * - Outside the seal border: COMPLETELY FLAT PRESSED SEAL (z = 0.001)
 * - Inside the seal border: Puffed pillow cushion with sharp 3D shoulder and real foil crinkles
 */
export function getCushionZ(uNorm, vNorm) {
  const mxL = SEAL_SIDE_W / POUCH_WIDTH;
  const mxR = SEAL_SIDE_W / POUCH_WIDTH;
  const myBot = SEAL_BOT_H / POUCH_HEIGHT;
  const myTop = SEAL_TOP_H / POUCH_HEIGHT;

  // INVERTED-CONE arch top boundary: center rises ARCH_AMOUNT UV units above side baseline
  const archLift = ARCH_AMOUNT * Math.sin(Math.PI * uNorm); // 0 at edges, ARCH_AMOUNT at center
  const topBoundaryV = Math.min(0.985, (1 - myTop) + archLift);

  // OUTSIDE SEAL BORDER: 100% Flat pressed heat-seal
  if (uNorm <= mxL || uNorm >= (1 - mxR) || vNorm <= myBot || vNorm >= topBoundaryV) {
    return 0.001;
  }

  // INSIDE PILLOW: Flexible puffed foil body (ty uses arch-adjusted top boundary)
  const tx = (uNorm - mxL) / (1 - mxL - mxR);
  const ty = (vNorm - myBot) / (topBoundaryV - myBot);

  // Sharp, distinct 3D shoulder within the first 2.8% of the pillow to form the visible 3D seal line
  const distFromBorder = Math.min(tx, 1 - tx, ty, 1 - ty);
  const shoulder = Math.min(1.0, distFromBorder / 0.028);
  const smoothShoulder = Math.pow(Math.sin(shoulder * Math.PI * 0.5), 0.72);

  // Heat-seal crease groove right at the clamp boundary
  const creaseGroove = (1.0 - Math.min(1.0, distFromBorder / 0.022)) * -0.004;

  const sx = Math.sin(Math.PI * tx);
  const sy = Math.sin(Math.PI * ty);
  const cushion = Math.pow(sx * sy, 0.38) * smoothShoulder;

  // EXACT FACETED METALLIC FOIL CRINKLES (Matching the real photo):
  // 1. Top-right cluster of radiating crinkles (above and to the right of the horned eye)
  const foldTR1 = sharpFoilCrease((tx * 3.8 + ty * 3.4 - 3.1) * Math.PI) * 0.028;
  const foldTR2 = sharpFoilCrease((tx * 3.2 + ty * 4.6 - 3.6) * Math.PI) * 0.022;
  const foldTR3 = sharpFoilCrease((tx * 4.8 - ty * 2.2 - 1.2) * Math.PI) * 0.018;

  // 2. Right side vertical/diagonal fold (catching highlight in photo)
  const foldRight = sharpFoilCrease((tx * 5.0 - ty * 1.5 - 2.8) * Math.PI) * 0.022;

  // 3. Left side vertical crease fold (running down the left of the eye)
  const foldLeft = sharpFoilCrease((tx * 4.5 - ty * 1.8 - 0.5) * Math.PI) * 0.020;

  // 4. Bottom-right diagonal crease (near DEMONIC FUEL)
  const foldBR = sharpFoilCrease((tx * 3.6 - ty * 3.2 + 0.8) * Math.PI) * 0.018;

  // 5. Corner tension diagonals radiating from the clamp corners
  const diagTL = Math.sin((tx + ty) * Math.PI * 3.5) * 0.010 * Math.max(0, 1.0 - distFromBorder * 3.0);
  const diagTR = Math.sin((1.0 - tx + ty) * Math.PI * 3.5) * 0.014 * Math.max(0, 1.0 - distFromBorder * 3.0);

  // 6. Micro surface flex
  const microFlex = (Math.sin(tx * 18.0 + ty * 14.0) * 0.0035 + Math.sin(tx * 28.0 - ty * 20.0) * 0.0025);

  const totalWrinkle = (foldTR1 + foldTR2 + foldTR3 + foldRight + foldLeft + foldBR + diagTL + diagTR + microFlex) * cushion;

  return cushion * (POUCH_DEPTH * 0.5) + totalWrinkle + creaseGroove;
}

/**
 * Exact edge cutouts and notches matching the reference photo:
 * 1. Top-edge center dip notch + subtle secondary dip
 * 2. Left side tear notch (cut into top seal band)
 * 3. Right side tear notch (cut into top seal band at same height)
 * 4. 45° corner chamfers on top-left and top-right
 * 5. Rounded bottom corners
 */
function getEdgeDisplacement(u, v) {
  let dx = 0;
  let dy = 0;

  const yRel = (v - 0.5) * POUCH_HEIGHT;
  const halfH = POUCH_HEIGHT / 2;

  // 1. TOP-EDGE NOTCHES:
  const distCenterU = Math.abs(u - 0.50) * POUCH_WIDTH;
  if (v > 0.94 && distCenterU < 0.10) {
    const notchT = Math.max(0, 1.0 - distCenterU / 0.10);
    const dip = 0.032 * Math.pow(notchT, 1.5) * ((v - 0.94) / 0.06);
    dy -= dip;
  }
  const distSecU = Math.abs(u - 0.65) * POUCH_WIDTH;
  if (v > 0.96 && distSecU < 0.06) {
    const notchT = Math.max(0, 1.0 - distSecU / 0.06);
    dy -= 0.014 * notchT;
  }

  // 2. SIDE TEAR NOTCHES (Both Left and Right in the top seal band)
  const notchY = halfH - SEAL_TOP_H * 0.48;
  const distNotchY = Math.abs(yRel - notchY);

  // Left tear-notch:
  if (u < 0.065 && distNotchY < 0.07) {
    const notchT = Math.max(0, 1.0 - distNotchY / 0.07);
    const uFactor = (0.065 - u) / 0.065;
    dx += 0.052 * Math.pow(notchT, 1.4) * uFactor;
  }

  // Right tear-notch:
  if (u > 0.935 && distNotchY < 0.07) {
    const notchT = Math.max(0, 1.0 - distNotchY / 0.07);
    const uFactor = (u - 0.935) / 0.065;
    dx -= 0.052 * Math.pow(notchT, 1.4) * uFactor;
  }

  // 3. TOP CORNER 45° CHAMFERS (Clipped corners)
  const chamferSize = 0.072;
  const distTL_X = u * POUCH_WIDTH;
  const distTL_Y = (1.0 - v) * POUCH_HEIGHT;
  if (distTL_X + distTL_Y < chamferSize) {
    const diff = chamferSize - (distTL_X + distTL_Y);
    dx += diff * 0.50;
    dy -= diff * 0.50;
  }
  const distTR_X = (1.0 - u) * POUCH_WIDTH;
  const distTR_Y = (1.0 - v) * POUCH_HEIGHT;
  if (distTR_X + distTR_Y < chamferSize) {
    const diff = chamferSize - (distTR_X + distTR_Y);
    dx -= diff * 0.50;
    dy -= diff * 0.50;
  }

  // 4. BOTTOM CORNERS (Softened / smoothly rounded)
  const r = 0.050;
  const cu = Math.min(u, 1 - u);
  const cv = v;
  if (cu < r && cv < r) {
    const du = (r - cu) / r;
    const dv = (r - cv) / r;
    const dist = Math.sqrt(du * du + dv * dv);
    if (dist > 0.01) {
      const pinch = Math.min(0.018, dist * 0.014);
      dx += (u < 0.5 ? pinch : -pinch);
      dy += pinch;
    }
  }

  // 5. Subtle micro-edge waviness
  const edgeWaveX = Math.sin(v * 36.0) * 0.0012 + Math.cos(v * 18.0) * 0.0008;
  const edgeWaveY = Math.sin(u * 30.0) * 0.0010 + Math.cos(u * 15.0) * 0.0006;
  if (u < 0.04 || u > 0.96) dx += edgeWaveX;
  if (v < 0.04 || v > 0.96) dy += edgeWaveY;

  return { dx, dy };
}

/**
 * Maps normalized mesh (u, v) to texture (uTex, vTex)
 * Clamped to prevent sampling border edge pixels
 */
function getScaledUV(u, v) {
  const uTex = Math.max(0.002, Math.min(0.998, u));
  const vTex = Math.max(0.002, Math.min(0.998, v));
  return [uTex, vTex];
}

/**
 * Back Pouch Mesh Geometry
 */
export function createBackPouchGeometry(Nx = 48, Ny = 64) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const { dx, dy } = getEdgeDisplacement(u, v);
      const x = -POUCH_WIDTH / 2 + u * POUCH_WIDTH + dx;
      const y = -POUCH_HEIGHT / 2 + v * POUCH_HEIGHT + dy;
      const z = -Math.max(0.001, getCushionZ(u, v));

      positions.push(x, y, z);
      const [uTex, vTex] = getScaledUV(1.0 - u, v);
      uvs.push(uTex, vTex);
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
 * Inner Cavity Geometry
 */
export function createInnerCavityGeometry(Nx = 32, Ny = 42) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  const padX = SEAL_SIDE_W / POUCH_WIDTH;
  const padYBot = SEAL_BOT_H / POUCH_HEIGHT;
  const padYTop = SEAL_TOP_H / POUCH_HEIGHT;

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    const mappedV = padYBot + v * (1.0 - padYBot - padYTop);
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const mappedU = padX + u * (1.0 - 2 * padX);

      const x = -POUCH_WIDTH / 2 + mappedU * POUCH_WIDTH;
      const y = -POUCH_HEIGHT / 2 + mappedV * POUCH_HEIGHT;
      const z = -0.010 - getCushionZ(mappedU, mappedV) * 0.12;

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
 * Front Peel Layer Geometry
 */
export function createFrontPeelGeometry(Nx = 60, Ny = 80) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const { dx, dy } = getEdgeDisplacement(u, v);
      const x = -POUCH_WIDTH / 2 + u * POUCH_WIDTH + dx;
      const y = -POUCH_HEIGHT / 2 + v * POUCH_HEIGHT + dy;
      const z = Math.max(0.001, getCushionZ(u, v));

      positions.push(x, y, z);
      const [uTex, vTex] = getScaledUV(u, v);
      uvs.push(uTex, vTex);
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
 * Hand-crushed paper/foil fold displacement calculation
 */
export function getPaperCrumpleDisplacement(u, v, crumple) {
  if (crumple <= 0.0001) {
    return { dx: 0, dy: 0, dz: 0 };
  }

  const c = Math.pow(crumple, 1.15);
  const uc = u - 0.5;
  const vc = v - 0.5;

  const pinchX = -uc * c * 0.38 * (1.0 + 0.25 * Math.sin(v * 12.0));
  const pinchY = -vc * c * 0.30 * (1.0 + 0.25 * Math.cos(u * 10.0));

  const fold1 = sharpFoilCrease((u * 2.4 + v * 1.9) * Math.PI * 2.8);
  const fold2 = sharpFoilCrease((u * 2.1 - v * 2.4) * Math.PI * 2.5);
  const fold3 = sharpFoilCrease((v * 3.6 + 0.3) * Math.PI);
  const centerVFold = sharpFoilCrease((1.0 - Math.abs(uc) * 2.0) * Math.PI * 1.4);

  const ridgeZ = (
    fold1 * 0.16 +
    fold2 * 0.13 +
    fold3 * 0.09 +
    centerVFold * 0.15
  ) * c;

  const distFromCenter = Math.sqrt(uc * uc + vc * vc) * 2.0;
  const edgeCrinkle = Math.sin(u * 22.0 + v * 28.0) * 0.035 * Math.min(1.0, distFromCenter) * c;

  return {
    dx: pinchX,
    dy: pinchY,
    dz: ridgeZ + edgeCrinkle
  };
}

/**
 * Realistic Foil Peel Deformation
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

  const yStart = POUCH_HEIGHT * 0.52;
  const yEnd = -POUCH_HEIGHT * 0.55;
  const yCenter = yStart - peelProgress * (yStart - yEnd);

  // Wider curl = real thin-foil behavior (was 0.075 — too tight, plastic-like)
  const R = 0.090;
  const Lbend = Math.PI * R;

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
        // Corner-start slant: foil tears from one notch, not perfectly horizontal
        const slant = 0.18 * (u - 0.5) - 0.025 * Math.sin(u * Math.PI);
        const yCrease = yCenter + slant;
        const d = baseY - yCrease;

        if (d <= 0) {
          curX = baseX;
          curY = baseY;
          curZ = baseZ;
        } else {
          let dy = 0;
          let dz = 0;

          if (d <= Lbend) {
            // Smooth arc curl — wider radius = gentler, more foil-like bend
            const theta = (d / Lbend) * Math.PI;
            dy = R * Math.sin(theta);
            dz = R * (1.0 - Math.cos(theta));
          } else {
            // Flat peeled flap: lies back almost horizontally (natural foil drape)
            const dRem = d - Lbend;
            dy = -dRem * 0.98;   // nearly flat back-flap (was 0.94 — too steep)
            dz = 2.0 * R + dRem * 0.12; // minimal forward lean (was 0.26 — too angled)
          }

          // Width cupping: foil cups across its width as tension releases (Poisson effect)
          const cupZ = 0.026 * Math.sin(u * Math.PI) * Math.min(1.0, d / 0.30);

          // Micro-flutter: layered sine waves simulate thin foil vibration/drape
          const waveZ = (
            0.008 * Math.sin(d * 4.0) +
            0.004 * Math.sin(d * 9.3 + u * 2.1)
          ) * Math.min(1.0, d);

          // Width pinch: foil narrows slightly as it peels (Poisson's ratio in film)
          const pinchX = 0.016 * (u - 0.5) * Math.min(1.0, d / 0.5);

          curX = baseX + pinchX;
          curY = yCrease + dy;
          curZ = baseZ + dz + cupZ + waveZ;

          // Foil detach: flutters away gracefully at the end of peel
          if (peelProgress > 0.82) {
            const detach = peelProgress - 0.82;
            // Smooth quadratic drop + slight backward drift
            curY -= detach * detach * 2.5;
            curZ += detach * 0.14;
            // Slight lateral flutter as it falls
            curX += detach * 0.06 * Math.sin(u * Math.PI * 2.0);
          }
        }
      }

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
 * Oral Strip Geometry
 */
export function createOralStripGeometry(Nx = 28, Ny = 38, width = 1.15, height = 1.68) {
  const geom = new THREE.BufferGeometry();
  const thickness = 0.004;

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= Ny; j++) {
    const v = j / Ny;
    for (let i = 0; i <= Nx; i++) {
      const u = i / Nx;
      const x = -width / 2 + u * width;
      const y = -height / 2 + v * height;

      const centerDist = Math.abs(u - 0.5) * 2.0;
      const centerCrease = (1.0 - Math.pow(centerDist, 0.45)) * 0.002;
      const wave = Math.sin(u * Math.PI) * 0.002 + Math.sin(v * Math.PI) * 0.002;
      const z = thickness / 2 - centerCrease + wave;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const offsetBack = (Nx + 1) * (Ny + 1);

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
    const b2 = offsetBack + (j + 1) * (Nx + 1);
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
