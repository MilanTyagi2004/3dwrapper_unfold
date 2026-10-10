import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture, ContactShadows } from '@react-three/drei';
import {
  POUCH_WIDTH,
  POUCH_HEIGHT,
  SEAL_TOP_H,
  SEAL_BOT_H,
  SEAL_SIDE_W,
  ARCH_AMOUNT,
  createBackPouchGeometry,
  createInnerCavityGeometry,
  createFrontPeelGeometry,
  updatePeelDeformation,
  updateBackAndCavityCrumple,
  createOralStripGeometry
} from './pouchGeometry';

// Particle grid resolution for strip dissolution
const PARTICLE_COLS = 24;
const PARTICLE_ROWS = 36;
const TOTAL_PARTICLES = PARTICLE_COLS * PARTICLE_ROWS;

/**
 * Composites pouch artwork with visible heat-seal crease lines, authentic crimp ribs,
 * and foil highlights matching the real reference photo!
 * Eliminates all white outer border pixels from the raw base image.
 */
function createSealedPouchTexture(baseImage, isBack = false) {
  if (!baseImage) return null;
  const width = baseImage.width || 807;
  const height = baseImage.height || 1186;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Fill canvas completely with base crimson-red (eliminates any white borders)
  ctx.fillStyle = '#e11e26';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw base artwork at FULL SIZE (no crop/stretch) so seal line positions stay aligned with geometry.
  // We pre-filled with red, then draw the image on top. Tiny white scanner borders (left ~7px, top ~3px)
  // are then painted over with red to preserve exact pixel alignment.
  ctx.drawImage(baseImage, 0, 0, width, height);

  // Cover narrow white border pixels from scanner/export (preserves seal line alignment)
  ctx.fillStyle = '#e11e26';
  if (!isBack) {
    ctx.fillRect(0, 0, 8, height);     // left white margin (~7px)
    ctx.fillRect(0, 0, width, 4);      // top white margin (~3px)
  } else {
    ctx.fillRect(0, 0, 3, height);     // back: minimal left border
    ctx.fillRect(0, 0, width, 3);      // back: minimal top border
  }

  // 3. Exact seal boundaries (in texture pixel space matching pouchGeometry.js)
  const topSealY = Math.floor(height * (SEAL_TOP_H / POUCH_HEIGHT));           // ~149px (just below "PEEL HERE")
  const botSealY = height - Math.floor(height * (SEAL_BOT_H / POUCH_HEIGHT)); // ~1118px (just below text)
  const leftSealX = Math.floor(width * (SEAL_SIDE_W / POUCH_WIDTH));           // ~52px
  const rightSealX = width - leftSealX;                                        // ~755px

  ctx.save();

  // 4. Very subtle crimp texture in seal areas (barely visible stamped texture, NOT a line)
  const crimpStep = 7.0;
  const archPeakPx = Math.round(height * ARCH_AMOUNT);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.035)'; // much softer than before
  for (let x = 0; x < width; x += crimpStep) {
    let archBoundaryY = topSealY;
    if (x >= leftSealX && x <= rightSealX) {
      const xNorm = (x - leftSealX) / (rightSealX - leftSealX);
      archBoundaryY = topSealY - Math.round(archPeakPx * Math.sin(Math.PI * xNorm));
    }
    ctx.fillRect(x, 0, 1.6, archBoundaryY);
    ctx.fillRect(x, botSealY, 1.6, height - botSealY);
  }
  for (let y = topSealY; y < botSealY; y += crimpStep) {
    ctx.fillRect(0, y, leftSealX, 1.4);
    ctx.fillRect(rightSealX, y, width - rightSealX, 1.4);
  }

  // 5. IMPLICIT SEAL DEPTH — no drawn lines, only soft shadow impression at the seal boundary.
  //    The 3D geometry shoulder crease + this tonal gradient gives the seal feel naturally.
  const archPeakY = topSealY - archPeakPx;

  // Helper to build the arch path (reused for shadow passes)
  function drawArchPath() {
    ctx.beginPath();
    ctx.moveTo(leftSealX, topSealY);
    ctx.bezierCurveTo(
      leftSealX + (rightSealX - leftSealX) * 0.30, topSealY,
      width / 2 - 12, archPeakY,
      width / 2, archPeakY
    );
    ctx.bezierCurveTo(
      width / 2 + 12, archPeakY,
      rightSealX - (rightSealX - leftSealX) * 0.30, topSealY,
      rightSealX, topSealY
    );
  }
  function drawBottomPath() {
    ctx.beginPath();
    ctx.moveTo(leftSealX, botSealY);
    ctx.lineTo(rightSealX, botSealY);
  }
  function drawLeftPath() {
    ctx.beginPath();
    ctx.moveTo(leftSealX, topSealY);
    ctx.lineTo(leftSealX, botSealY);
  }
  function drawRightPath() {
    ctx.beginPath();
    ctx.moveTo(rightSealX, topSealY);
    ctx.lineTo(rightSealX, botSealY);
  }

  // PASS 1: Wide blurred dark shadow (outer dark side of crease — seal area edge)
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(18, 0, 3, 0.10)';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  [drawArchPath, drawBottomPath, drawLeftPath, drawRightPath].forEach(fn => { fn(); ctx.stroke(); });
  ctx.restore();

  // PASS 2: Slightly narrower, darker center shadow band
  ctx.save();
  ctx.strokeStyle = 'rgba(12, 0, 2, 0.08)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  [drawArchPath, drawBottomPath, drawLeftPath, drawRightPath].forEach(fn => { fn(); ctx.stroke(); });
  ctx.restore();

  // PASS 3: Thin faint highlight on the PILLOW SIDE of the boundary (inner edge lightness)
  // Suggests a raised 3D shoulder without a hard line
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 120, 120, 0.06)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  // Offset arch slightly inward (toward pillow) for highlight
  ctx.beginPath();
  ctx.moveTo(leftSealX + 8, topSealY + 5);
  ctx.bezierCurveTo(
    leftSealX + (rightSealX - leftSealX) * 0.30 + 5, topSealY + 5,
    width / 2 - 10, archPeakY + 8,
    width / 2, archPeakY + 8
  );
  ctx.bezierCurveTo(
    width / 2 + 10, archPeakY + 8,
    rightSealX - (rightSealX - leftSealX) * 0.30 - 5, topSealY + 5,
    rightSealX - 8, topSealY + 5
  );
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(leftSealX + 8, botSealY - 5); ctx.lineTo(rightSealX - 8, botSealY - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(leftSealX + 5, topSealY + 5); ctx.lineTo(leftSealX + 5, botSealY - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rightSealX - 5, topSealY + 5); ctx.lineTo(rightSealX - 5, botSealY - 5); ctx.stroke();
  ctx.restore();

  // 6. SOFT MATTE EMBOSSED FOIL CREASES (Pure diffuse shadow lines, NO glossy specular streaks)
  if (!isBack) {
    ctx.strokeStyle = 'rgba(45, 0, 8, 0.15)';
    ctx.lineWidth = 2.0;

    // Top-right radiating crinkles
    ctx.beginPath();
    ctx.moveTo(width * 0.92, topSealY + 45);
    ctx.lineTo(width * 0.58, topSealY + 160);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.86, topSealY + 95);
    ctx.lineTo(width * 0.62, topSealY + 225);
    ctx.stroke();

    // Right side vertical fold
    ctx.beginPath();
    ctx.moveTo(rightSealX - 12, height * 0.44);
    ctx.lineTo(rightSealX - 48, height * 0.56);
    ctx.stroke();

    // Left vertical fold
    ctx.beginPath();
    ctx.moveTo(leftSealX + 55, height * 0.39);
    ctx.lineTo(leftSealX + 38, height * 0.57);
    ctx.stroke();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Soft procedural matte packaging bump map:
 * - Subtle crease grooves along seal boundary lines
 * - Fine matte crimp texture on seals
 * - Soft diffuse foil wrinkles (no sharp specular normal spikes)
 */
function createFoilBumpTexture() {
  const width = 512;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  const topH = Math.floor(height * (SEAL_TOP_H / POUCH_HEIGHT));
  const botH = Math.floor(height * (SEAL_BOT_H / POUCH_HEIGHT));
  const sideW = Math.floor(width * (SEAL_SIDE_W / POUCH_WIDTH));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const isTop = y < topH;
    const isBot = y > (height - botH);
    const distY1 = Math.abs(y - topH);
    const distY2 = Math.abs(y - (height - botH));
    const distY = Math.min(distY1, distY2);

    for (let x = 0; x < width; x++) {
      const isLeft = x < sideW;
      const isRight = x > (width - sideW);
      const isSeal = isTop || isBot || isLeft || isRight;

      const distX1 = Math.abs(x - sideW);
      const distX2 = Math.abs(x - (width - sideW));
      const distX = Math.min(distX1, distX2);
      const distBorder = Math.min(distX, distY);

      const idx = (y * width + x) * 4;
      let val = 128;

      if (distBorder <= 2) {
        // Soft matte indentation along seal boundary
        val -= 34;
      } else if (isSeal) {
        // Subtle heat-seal crimp indentations
        const rib = Math.sin(x * 0.90) * 16;
        val += rib;
      } else {
        // Soft matte packaging wrinkles
        const u = x / width;
        const v = 1.0 - y / height;
        const trPhase = (u * 3.8 + v * 3.4 - 3.1) * Math.PI;
        const trFold = Math.sign(Math.sin(trPhase)) * Math.pow(Math.abs(Math.sin(trPhase)), 0.38) * 12;

        const rPhase = (u * 5.0 - v * 1.5 - 2.8) * Math.PI;
        const rFold = Math.sign(Math.sin(rPhase)) * Math.pow(Math.abs(Math.sin(rPhase)), 0.38) * 10;

        const lPhase = (u * 4.5 - v * 1.8 - 0.5) * Math.PI;
        const lFold = Math.sign(Math.sin(lPhase)) * Math.pow(Math.abs(Math.sin(lPhase)), 0.38) * 9;

        const microNoise = (Math.random() - 0.5) * 4;
        val += trFold + rFold + lFold + microNoise;
      }

      val = Math.max(0, Math.min(255, val));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  return texture;
}

export function PouchModel({ animProps, animRef }) {
  const [rawFrontTexture, rawBackTexture] = useTexture([
    '/pouch-front.png',
    '/pouch-back.png'
  ]);

  if (rawFrontTexture && rawFrontTexture.colorSpace !== THREE.SRGBColorSpace) {
    rawFrontTexture.colorSpace = THREE.SRGBColorSpace;
    rawFrontTexture.anisotropy = 16;
    rawFrontTexture.needsUpdate = true;
  }
  if (rawBackTexture && rawBackTexture.colorSpace !== THREE.SRGBColorSpace) {
    rawBackTexture.colorSpace = THREE.SRGBColorSpace;
    rawBackTexture.anisotropy = 16;
    rawBackTexture.needsUpdate = true;
  }

  // Composited textures with prominent seal lines & crimp patterns
  const frontTexture = useMemo(() => {
    if (rawFrontTexture && rawFrontTexture.image) {
      return createSealedPouchTexture(rawFrontTexture.image, false);
    }
    return rawFrontTexture;
  }, [rawFrontTexture]);

  const backTexture = useMemo(() => {
    if (rawBackTexture && rawBackTexture.image) {
      return createSealedPouchTexture(rawBackTexture.image, true);
    }
    return rawBackTexture;
  }, [rawBackTexture]);

  const foilBumpTexture = useMemo(() => createFoilBumpTexture(), []);

  // Geometries with exact cuts & notches matching reference photo
  const backGeom = useMemo(() => createBackPouchGeometry(48, 64), []);
  const innerCavityGeom = useMemo(() => createInnerCavityGeometry(32, 42), []);
  const frontPeelGeom = useMemo(() => createFrontPeelGeometry(64, 88), []);
  const oralStripGeom = useMemo(() => createOralStripGeometry(28, 38, 1.15, 1.68), []);

  // 1. PURE MATTE RED PACKAGING MATERIAL (NO GLOSS, NO SHINY HIGHLIGHTS)
  const frontMaterial = useMemo(() => {
    const tex = frontTexture || rawFrontTexture;
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
    }
    return new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: foilBumpTexture,
      bumpScale: 0.008,         // Soft tactile packaging texture
      roughness: 0.92,          // PURE MATTE: High roughness, completely diffuse, zero glossy highlights
      metalness: 0.0,           // Non-metallic matte finish
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [frontTexture, rawFrontTexture, foilBumpTexture]);

  // Backside of curling foil layer (satin silver foil interior)
  const peelBacksideMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xd2d7e0,
      roughness: 0.42,
      metalness: 0.80,
      bumpMap: foilBumpTexture,
      bumpScale: 0.006,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [foilBumpTexture]);

  // Back Face Material — matching front pure matte
  const backMaterial = useMemo(() => {
    const tex = backTexture || rawBackTexture;
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
    }
    return new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: foilBumpTexture,
      bumpScale: 0.008,
      roughness: 0.92,          // Pure matte
      metalness: 0.0,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [backTexture, rawBackTexture, foilBumpTexture]);

  // Inner Silver Foil Cavity Bed
  const innerFoilMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xc4c9d2,
      roughness: 0.38,
      metalness: 0.84,
      bumpMap: foilBumpTexture,
      bumpScale: 0.005,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [foilBumpTexture]);

  // Oral Strip Material: crystalline translucent sky-blue oral strip
  const stripMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      roughness: 0.18,
      metalness: 0.02,
      transmission: 0.78,
      thickness: 0.08,
      ior: 1.45,
      clearcoat: 0.80,
      clearcoatRoughness: 0.20,
      emissive: '#0284c7',
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      clipShadows: true
    });
  }, []);

  const peelClipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const particlePlateletGeom = useMemo(() => {
    return new THREE.PlaneGeometry(0.046, 0.048);
  }, []);

  const particlePlateletMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      roughness: 0.20,
      transmission: 0.75,
      emissive: '#0284c7',
      emissiveIntensity: 0.16,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
  }, []);

  const particlesData = useMemo(() => {
    const list = [];
    const sWidth = 1.15;
    const sHeight = 1.68;

    for (let r = 0; r < PARTICLE_ROWS; r++) {
      const v = (r + 0.5) / PARTICLE_ROWS;
      for (let c = 0; c < PARTICLE_COLS; c++) {
        const u = (c + 0.5) / PARTICLE_COLS;
        const x = -sWidth / 2 + u * sWidth;
        const y = -sHeight / 2 + v * sHeight;

        const distFromEdge = Math.min(u, 1 - u, v, 1 - v) * 2.0;
        const noise = (Math.sin(u * 15.3 + v * 21.7) + 1.0) * 0.5;
        const threshold = distFromEdge * 0.55 + noise * 0.25;

        const angle = Math.atan2(y, x) + (Math.random() - 0.5) * 0.6;
        const speed = 0.8 + Math.random() * 0.9;

        list.push({
          u, v,
          originX: x,
          originY: y,
          originZ: 0.002,
          driftX: Math.cos(angle) * speed,
          driftY: Math.sin(angle) * speed + (Math.random() - 0.2) * 0.5,
          driftZ: (Math.random() - 0.45) * 0.8,
          rotSpeedX: (Math.random() - 0.5) * 12.0,
          rotSpeedY: (Math.random() - 0.5) * 12.0,
          rotSpeedZ: (Math.random() - 0.5) * 8.0,
          threshold
        });
      }
    }
    return list;
  }, []);

  // Refs
  const packetGroupRef = useRef();
  const frontPeelGroupRef = useRef();
  const frontPeelMeshRef = useRef();
  const peelBacksideMeshRef = useRef();
  const stripGroupRef = useRef();
  const stripMeshRef = useRef();
  const innerCavityMeshRef = useRef();
  const backMeshRef = useRef();
  const instancedParticlesRef = useRef();
  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  // Mouse parallax
  const mouseLerp = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const anim = animRef?.current || animProps || {};
    const peel = anim.peel ?? 0;
    const packetCrumple = anim.packetCrumple ?? 0;
    const packetOpacity = anim.packetOpacity ?? 1.0;
    const backOpacity = anim.backOpacity ?? 1.0;
    const packetX = anim.packetX ?? 0;
    const packetY = anim.packetY ?? 0;
    const packetZ = anim.packetZ ?? 0;
    const packetRotX = anim.packetRotX ?? 0;
    const packetRotY = anim.packetRotY ?? 0;
    const packetRotZ = anim.packetRotZ ?? 0;
    const packetScale = anim.packetScale ?? 1.0;
    const stripX = anim.stripX ?? 0.0;
    const stripY = anim.stripY ?? -0.12;
    const stripZ = anim.stripZ ?? -0.015;
    const stripRotX = anim.stripRotX ?? 0;
    const stripRotY = anim.stripRotY ?? 0;
    const stripRotZ = anim.stripRotZ ?? 0;
    const stripOpacity = anim.stripOpacity ?? 1.0;
    const stripScale = anim.stripScale ?? 1.0;
    const dissolveT = anim.dissolveProgress ?? 0;

    // 1. Continuous Foil Peel & Hand-Paper Crumple Deformation
    if (frontPeelMeshRef.current) {
      updatePeelDeformation(frontPeelGeom, peel, packetCrumple);
    }
    if (backGeom) {
      updateBackAndCavityCrumple(backGeom, packetCrumple, false);
    }
    if (innerCavityGeom) {
      updateBackAndCavityCrumple(innerCavityGeom, packetCrumple, true);
    }

    // Dynamic Opacity & Visibility
    // Front foil: fade starts at peel=0.70, finishes at peel=1.0 (wider = smoother)
    const peelFade = Math.max(0, Math.min(1, 1.0 - Math.max(0, (peel - 0.70) / 0.30)));
    const frontLayerOpacity = packetOpacity * peelFade;
    const isFrontTransp = frontLayerOpacity < 0.99;

    // Back silver foil uses its OWN dedicated opacity — fully GSAP-driven, smooth, independent
    const isBackTransp = backOpacity < 0.99;
    const isFrontTranspFlag = packetOpacity < 0.99;

    if (frontMaterial) {
      frontMaterial.opacity = frontLayerOpacity;
      frontMaterial.depthWrite = !isFrontTransp;
      frontMaterial.transparent = isFrontTransp;
    }
    if (peelBacksideMaterial) {
      peelBacksideMaterial.opacity = frontLayerOpacity;
      peelBacksideMaterial.depthWrite = !isFrontTransp;
      peelBacksideMaterial.transparent = isFrontTransp;
    }
    if (peelBacksideMeshRef.current) {
      peelBacksideMeshRef.current.visible = peel > 0.015 && frontLayerOpacity > 0.005;
    }
    if (frontPeelGroupRef.current) {
      frontPeelGroupRef.current.visible = frontLayerOpacity > 0.005;
    }

    if (backMaterial) {
      backMaterial.opacity = backOpacity;
      backMaterial.depthWrite = !isBackTransp;
      backMaterial.transparent = isBackTransp || true;
    }
    if (innerFoilMaterial) {
      innerFoilMaterial.opacity = backOpacity;
      innerFoilMaterial.depthWrite = !isBackTransp;
      innerFoilMaterial.transparent = isBackTransp || true;
    }

    // Inner cavity visible during peel, fades with dedicated backOpacity
    if (innerCavityMeshRef.current) {
      innerCavityMeshRef.current.visible = peel > 0.02 && backOpacity > 0.002;
    }

    // 2. Mouse Parallax
    mouseLerp.current.x = THREE.MathUtils.lerp(
      mouseLerp.current.x,
      state.pointer.x * 0.07,
      0.06
    );
    mouseLerp.current.y = THREE.MathUtils.lerp(
      mouseLerp.current.y,
      state.pointer.y * 0.05,
      0.06
    );

    const mouseX = mouseLerp.current.x;
    const mouseY = mouseLerp.current.y;

    // 3. Packet Group Transform
    const pRotX = -mouseY + packetRotX;
    const pRotY = mouseX + packetRotY;
    const pRotZ = packetRotZ;

    if (packetGroupRef.current) {
      packetGroupRef.current.position.set(packetX, packetY, packetZ);
      packetGroupRef.current.rotation.set(pRotX, pRotY, pRotZ);

      const scaleX = (1.0 - packetCrumple * 0.35) * packetScale;
      const scaleY = (1.0 - packetCrumple * 0.28) * packetScale;
      const scaleZ = (1.0 + packetCrumple * 0.70) * packetScale;
      packetGroupRef.current.scale.set(scaleX, scaleY, scaleZ);

      packetGroupRef.current.visible = Math.max(packetOpacity, backOpacity) > 0.002 && packetY > -10.0;
    }

    // 4. Oral Strip Position & Orientation
    if (stripGroupRef.current) {
      const rawDetached = Math.max(0, Math.min(1, (stripZ - 0.02) / 0.25));
      const isDetached = rawDetached * rawDetached * (3.0 - 2.0 * rawDetached);

      const cosY = Math.cos(pRotY);
      const sinY = Math.sin(pRotY);
      const cosX = Math.cos(pRotX);
      const sinX = Math.sin(pRotX);

      const xRot = stripX * cosY + stripZ * sinY;
      const zRot1 = -stripX * sinY + stripZ * cosY;
      const yRot = stripY * cosX - zRot1 * sinX;
      const zRot = stripY * sinX + zRot1 * cosX;

      const finalX = THREE.MathUtils.lerp(packetX + xRot, stripX + mouseX * 0.15, isDetached);
      const finalY = THREE.MathUtils.lerp(packetY + yRot, stripY - mouseY * 0.15, isDetached);
      const finalZ = THREE.MathUtils.lerp(packetZ + zRot, stripZ, isDetached);

      stripGroupRef.current.position.set(finalX, finalY, finalZ);

      const sRotX = THREE.MathUtils.lerp(pRotX + stripRotX, -mouseY * 0.35 + stripRotX, isDetached);
      const sRotY = THREE.MathUtils.lerp(pRotY + stripRotY, mouseX * 0.35 + stripRotY, isDetached);
      const sRotZ = THREE.MathUtils.lerp(pRotZ + stripRotZ, stripRotZ, isDetached);

      stripGroupRef.current.rotation.set(sRotX, sRotY, sRotZ);
    }

    // 5. Solid Strip Mesh Visibility & Progressive Reveal
    const isPeelingOrRevealed = peel > 0.03 || packetOpacity < 0.98;
    const isStripVisible = isPeelingOrRevealed && stripOpacity > 0.005;

    if (stripMeshRef.current && stripMaterial) {
      stripMaterial.opacity = stripOpacity * 0.86;
      stripMeshRef.current.scale.setScalar(stripScale);
      stripMeshRef.current.visible = isStripVisible;

      const yCreaseCenter = (POUCH_HEIGHT * 0.52) - peel * (POUCH_HEIGHT * 1.07);
      if (yCreaseCenter > 0.85) {
        // Strip top is at -0.12 + 0.84 = +0.72. Before peel reaches top of strip, clip it
        peelClipPlane.constant = -0.90;
        stripMaterial.clippingPlanes = [peelClipPlane];
      } else if (yCreaseCenter >= -1.05) {
        // Strip extends down to -0.12 - 0.84 = -0.96. Progressively reveal along peel crease
        peelClipPlane.constant = -yCreaseCenter;
        stripMaterial.clippingPlanes = [peelClipPlane];
      } else {
        stripMaterial.clippingPlanes = [];
      }
    }

    // 6. Particle Dissolution
    if (instancedParticlesRef.current) {
      if (dissolveT <= 0.001) {
        particlePlateletMat.opacity = 0;
        instancedParticlesRef.current.visible = false;
      } else {
        instancedParticlesRef.current.visible = true;
        const plateletFade = Math.sin(Math.min(Math.PI, dissolveT * Math.PI));
        particlePlateletMat.opacity = Math.pow(plateletFade, 0.82) * 0.82;

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          const data = particlesData[i];
          const rawLocal = Math.max(0, (dissolveT - data.threshold * 0.6) / (1.0 - data.threshold * 0.6 + 0.001));

          if (rawLocal <= 0) {
            dummyObj.position.set(data.originX, data.originY, data.originZ);
            dummyObj.rotation.set(0, 0, 0);
            dummyObj.scale.set(1, 1, 1);
          } else {
            const localT = Math.min(1.0, rawLocal);
            const smoothLocal = localT * localT * (3.0 - 2.0 * localT);
            const driftCurve = localT * localT;
            const px = data.originX + data.driftX * (smoothLocal * 0.55 + driftCurve * 0.35);
            const py = data.originY + data.driftY * (smoothLocal * 0.45 + driftCurve * 0.25);
            const pz = data.originZ + data.driftZ * smoothLocal * 0.55;

            dummyObj.position.set(px, py, pz);
            dummyObj.rotation.set(
              smoothLocal * data.rotSpeedX,
              smoothLocal * data.rotSpeedY,
              smoothLocal * data.rotSpeedZ
            );
            const pScale = Math.max(0, 1.0 - smoothLocal * 1.05);
            dummyObj.scale.setScalar(pScale);
          }

          dummyObj.updateMatrix();
          instancedParticlesRef.current.setMatrixAt(i, dummyObj.matrix);
        }
        instancedParticlesRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 
        ============================================================
        PACKET BODY GROUP (Single unified hero pouch)
        ============================================================
      */}
      <group ref={packetGroupRef}>
        {/* Soft contact shadow below packet */}
        <ContactShadows
          position={[0, -POUCH_HEIGHT / 2 - 0.06, 0]}
          opacity={0.35}
          scale={5.0}
          blur={2.4}
          far={2.8}
          color="#150003"
        />

        {/* Back face of the packet (seamless with front edge) */}
        <mesh
          ref={backMeshRef}
          geometry={backGeom}
          material={backMaterial}
          castShadow
          receiveShadow
        />

        {/* Inner silver foil cavity bed (revealed only during peel) */}
        <mesh
          ref={innerCavityMeshRef}
          geometry={innerCavityGeom}
          material={innerFoilMaterial}
          visible={false}
          receiveShadow
        />

        {/* 
          FRONT PEEL LAYER:
          Completely sealed at start.
          Peels open with organic curved roll from top notch.
        */}
        <group ref={frontPeelGroupRef}>
          {/* Front printed face with prominent artwork & visible seal lines */}
          <mesh
            ref={frontPeelMeshRef}
            geometry={frontPeelGeom}
            material={frontMaterial}
            castShadow
          />
          {/* Underside silver foil layer (strictly hidden when sealed) */}
          <mesh
            ref={peelBacksideMeshRef}
            geometry={frontPeelGeom}
            material={peelBacksideMaterial}
            visible={false}
            receiveShadow
          />
        </group>
      </group>

      {/* 
        ============================================================
        ORAL STRIP & DISSOLUTION PARTICLES
        ============================================================
      */}
      <group ref={stripGroupRef} position={[0.0, -0.12, 0.008]}>
        <mesh
          ref={stripMeshRef}
          geometry={oralStripGeom}
          material={stripMaterial}
          visible={false}
          renderOrder={10}
          castShadow
          receiveShadow
        />

        <instancedMesh
          ref={instancedParticlesRef}
          args={[particlePlateletGeom, particlePlateletMat, TOTAL_PARTICLES]}
          renderOrder={11}
          visible={false}
        />
      </group>
    </group>
  );
}
