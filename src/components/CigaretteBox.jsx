import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture, ContactShadows } from '@react-three/drei';
import {
  POUCH_WIDTH,
  POUCH_HEIGHT,
  createBackPouchGeometry,
  createFrontPeelGeometry
} from './pouchGeometry';

// Flip-Top Cigarette Box Dimensions (Proportional to box image.png: 767w x 386 lid / 939 body)
export const BOX_W = 2.68;
export const BOX_D = 0.98;
export const BODY_H = 3.28;
export const LID_H = 1.34;
export const TOTAL_BOX_H = BODY_H + LID_H; // 4.62

/**
 * Sealed Static Pouch Component (used for the 3 background packets inside the box)
 */
function SealedPouch({ position, rotation, frontMat, backMat }) {
  const backGeom = useMemo(() => createBackPouchGeometry(24, 30), []);
  const frontGeom = useMemo(() => createFrontPeelGeometry(28, 36), []);

  return (
    <group position={position} rotation={rotation} scale={0.96}>
      <mesh geometry={frontGeom} material={frontMat} castShadow receiveShadow />
      <mesh geometry={backGeom} material={backMat} receiveShadow />
    </group>
  );
}

/**
 * High-fidelity 3D Flip-Top Cigarette Box Component
 */
export function CigaretteBox({ animRef }) {
  // Load front textures cropped directly from box image.png + sides, back, and pouch textures
  const [
    lidTexture,
    bodyTexture,
    sideTexture,
    backTexture,
    pouchFront,
    pouchBack
  ] = useTexture([
    '/box-lid.png',
    '/box-body.png',
    '/box-side.png',
    '/box-back.png',
    '/pouch-front.png',
    '/pouch-back.png'
  ]);

  // Ensure sRGB color space & high anisotropy for ultra-sharp packaging
  [lidTexture, bodyTexture, sideTexture, backTexture, pouchFront, pouchBack].forEach((tex) => {
    if (tex && tex.colorSpace !== THREE.SRGBColorSpace) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
    }
  });

  // Base crimson red paperboard color
  const RED_COLOR = '#cf0f1a';

  // Front Lid Material (with cropped "FOR THE OBSESSED" texture)
  const lidFrontMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: lidTexture,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0
    });
  }, [lidTexture]);

  // Front Body Material (with cropped "DEMONIC FUEL" eye texture)
  const bodyFrontMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: bodyTexture,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0
    });
  }, [bodyTexture]);

  // Outer Box Cardstock Material (sides, back, top, bottom)
  const boxSideMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: sideTexture,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0
    });
  }, [sideTexture]);

  const boxBackMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: backTexture,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0
    });
  }, [backTexture]);

  const boxPlainRedMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: RED_COLOR,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0
    });
  }, []);

  // Inner Silver Foil Lining (for interior cavity of lid and body)
  const interiorFoilMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xccd1dc,
      roughness: 0.28,
      metalness: 0.88,
      side: THREE.FrontSide, // Inward facing foil; backface-culled from outside so zero silver shows on exterior
      transparent: false,
      opacity: 1.0
    });
  }, []);

  // Inner Collar / Throat Material (sleek matte charcoal with subtle red glow)
  const collarMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x4A0808,   // dark burgundy — same red family as box, clearly darker (inner cardstock feel)
      roughness: 0.65,   // matte cardstock texture
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
  }, []);

  // Sealed background pouches material — clearly matte red to match hero pouch
  const sealedFrontMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: pouchFront,
      roughness: 0.82,
      metalness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 1.0,
      reflectivity: 0.06,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0,
      depthWrite: true
    });
  }, [pouchFront]);

  const sealedBackMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: pouchBack,
      roughness: 0.82,
      metalness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 1.0,
      reflectivity: 0.06,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1.0,
      depthWrite: true
    });
  }, [pouchBack]);

  // Inner Frame Front Thumb Cutout Shape (Iconic cigarette pack U-notch)
  const collarFrontGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w2 = (BOX_W - 0.02) / 2;
    const botY = 0.0;   // starts at the seam — no lower portion that gets occluded
    const topY = 0.44;
    const notchBottom = 0.14;
    const notchWidth = 0.65;

    // Outer contour with U-cutout at top — purely in the lid-opening space
    shape.moveTo(-w2, botY);
    shape.lineTo(-w2, topY);
    shape.lineTo(-w2 * 0.72, topY);
    shape.lineTo(-notchWidth, notchBottom + 0.04);
    shape.quadraticCurveTo(0, notchBottom - 0.03, notchWidth, notchBottom + 0.04);
    shape.lineTo(w2 * 0.72, topY);
    shape.lineTo(w2, topY);
    shape.lineTo(w2, botY);
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }, []);

  // Geometries for panels
  const bodyFrontGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, BODY_H), []);
  const bodyBackGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, BODY_H), []);
  const bodySideGeom = useMemo(() => new THREE.PlaneGeometry(BOX_D, BODY_H), []);
  const bottomGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, BOX_D), []);

  const lidFrontGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, LID_H), []);
  const lidBackGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, LID_H), []);
  const lidSideGeom = useMemo(() => new THREE.PlaneGeometry(BOX_D, LID_H), []);
  const topGeom = useMemo(() => new THREE.PlaneGeometry(BOX_W, BOX_D), []);
  const collarSideGeom = useMemo(() => new THREE.PlaneGeometry(BOX_D - 0.02, 0.94), []);

  // Interior lining box geometries
  const bodyInteriorGeom = useMemo(() => new THREE.BoxGeometry(BOX_W - 0.03, BODY_H - 0.02, BOX_D - 0.03), []);
  const lidInteriorGeom = useMemo(() => new THREE.BoxGeometry(BOX_W - 0.03, LID_H - 0.02, BOX_D - 0.03), []);

  // Refs
  const boxRootRef = useRef();
  const lidHingeRef = useRef();
  const mouseLerp = useRef({ x: 0, y: 0 });
  // Smoothed idle oscillation refs (lerped so swing builds in gradually, never pops)
  const swingLerp = useRef({ floatY: 0, swingZ: 0, tiltX: 0 });

  useFrame((state) => {
    const anim = animRef?.current || {};
    const boxOpen = anim.boxOpen ?? 0;
    const boxScale = anim.boxScale ?? 0.75;
    const boxX = anim.boxX ?? 0;
    const boxY = anim.boxY ?? 0.05;
    const boxZ = anim.boxZ ?? 0;
    const boxRotX = anim.boxRotX ?? 0.08;
    const boxRotY = anim.boxRotY ?? -0.20;
    const boxRotZ = anim.boxRotZ ?? 0;
    const boxOpacity = anim.boxOpacity ?? 1.0;

    // Mouse parallax
    mouseLerp.current.x = THREE.MathUtils.lerp(mouseLerp.current.x, state.pointer.x * 0.07, 0.06);
    mouseLerp.current.y = THREE.MathUtils.lerp(mouseLerp.current.y, state.pointer.y * 0.05, 0.06);

    // Idle suspension: gentle float + pendulum swing while closed.
    // Targets are sine-driven; actual values lerp toward targets at ~3%/frame
    // so the swing builds in organically and never pops on loop restart.
    const idleFactor = Math.max(0, 1.0 - boxOpen * 10);
    const t = state.clock.elapsedTime;
    const floatTarget = Math.sin(t * 0.80) * 0.036 * idleFactor;   // ~7.9s period, ±0.036 units
    const swingTarget = Math.sin(t * 0.62 + 1.1) * 0.012 * idleFactor; // ~10.1s period, ±0.7°
    const tiltTarget = Math.sin(t * 0.48 + 2.4) * 0.005 * idleFactor; // ~13.1s period, ±0.3°
    swingLerp.current.floatY = THREE.MathUtils.lerp(swingLerp.current.floatY, floatTarget, 0.014);
    swingLerp.current.swingZ = THREE.MathUtils.lerp(swingLerp.current.swingZ, swingTarget, 0.014);
    swingLerp.current.tiltX = THREE.MathUtils.lerp(swingLerp.current.tiltX, tiltTarget, 0.014);

    // 1. Root Cigarette Box Transform
    if (boxRootRef.current) {
      boxRootRef.current.position.set(boxX, boxY + swingLerp.current.floatY, boxZ);
      boxRootRef.current.rotation.x = boxRotX + swingLerp.current.tiltX - mouseLerp.current.y;
      boxRootRef.current.rotation.y = boxRotY + mouseLerp.current.x;
      boxRootRef.current.rotation.z = boxRotZ + swingLerp.current.swingZ;
      boxRootRef.current.scale.setScalar(boxScale);
      boxRootRef.current.visible = boxOpacity > 0.001;
    }

    // 2. Flip-Top Lid Hinge Rotation: flips back around X-axis (-2.15 rad = ~ -123°)
    if (lidHingeRef.current) {
      lidHingeRef.current.rotation.x = -boxOpen * 2.15;
    }

    // 3. Opacity & Transparency Control
    const isFading = boxOpacity < 0.999;

    // All box panels follow global boxOpacity (entry fade-in, exit fade-out)
    [lidFrontMat, bodyFrontMat, boxSideMat, boxBackMat, boxPlainRedMat, interiorFoilMat, sealedFrontMat, sealedBackMat].forEach((mat) => {
      if (mat) {
        mat.opacity = boxOpacity;
        mat.transparent = true;         // always transparent so Three.js fades it smoothly
        mat.depthWrite = boxOpacity > 0.9; // depthWrite only when nearly opaque
      }
    });

    // Collar: hidden when closed, visible when lid is open.
    // Geometry is now always in front of the packet (z = BOX_D/2 + 0.005),
    // so no occlusion by the packet — size is geometrically constant.
    const collarT = boxOpen * boxOpen * (3.0 - 2.0 * boxOpen); // smoothstep on lid
    const collarOpacity = collarT * boxOpacity;
    if (collarMat) {
      collarMat.opacity = collarOpacity;
      collarMat.transparent = true;
      collarMat.depthWrite = collarOpacity > 0.5;
    }
  });

  return (
    <group ref={boxRootRef} position={[0, 0, 0]}>
      {/* Soft Contact Shadow below the cigarette box */}
      <ContactShadows
        position={[0, -BODY_H - 0.05, 0]}
        opacity={0.5}
        scale={4.8}
        blur={2.2}
        far={3.0}
        color="#150003"
      />

      {/* 
        ============================================================
        LOWER CASE / BODY BASE (From y = -BODY_H to y = 0)
        Horizontal seam is at y = 0
        ============================================================
      */}
      <group position={[0, 0, 0]}>
        {/* Front Panel (box-body.png: DEMONIC FUEL, horned eye, HELL MINT) */}
        <mesh
          geometry={bodyFrontGeom}
          material={bodyFrontMat}
          position={[0, -BODY_H / 2, BOX_D / 2]}
          castShadow
          receiveShadow
        />

        {/* Back Panel */}
        <mesh
          geometry={bodyBackGeom}
          material={boxBackMat}
          position={[0, -BODY_H / 2, -BOX_D / 2]}
          rotation={[0, Math.PI, 0]}
          receiveShadow
        />

        {/* Left Side Panel (with vertical branding & barcode) */}
        <mesh
          geometry={bodySideGeom}
          material={boxSideMat}
          position={[-BOX_W / 2, -BODY_H / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          castShadow
          receiveShadow
        />

        {/* Right Side Panel */}
        <mesh
          geometry={bodySideGeom}
          material={boxSideMat}
          position={[BOX_W / 2, -BODY_H / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
        />

        {/* Bottom Panel */}
        <mesh
          geometry={bottomGeom}
          material={boxPlainRedMat}
          position={[0, -BODY_H, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        />

        {/* Interior Lining: Left, Right, Back, Bottom silver foil walls */}
        <mesh
          geometry={bodySideGeom}
          material={interiorFoilMat}
          position={[-BOX_W / 2 + 0.012, -BODY_H / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <mesh
          geometry={bodySideGeom}
          material={interiorFoilMat}
          position={[BOX_W / 2 - 0.012, -BODY_H / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <mesh
          geometry={bodyBackGeom}
          material={interiorFoilMat}
          position={[0, -BODY_H / 2, -BOX_D / 2 + 0.012]}
        />
        <mesh
          geometry={bottomGeom}
          material={interiorFoilMat}
          position={[0, -BODY_H + 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        {/* 
          INNER COLLAR / THROAT:
          Classic cigarette box cardstock insert with U-thumb cutout sticking up past y = 0
        */}
        <group position={[0, 0, BOX_D / 2 + 0.005]}>
          {/* Collar Front — trimmed to lid-opening space only, always in front of packet */}
          <mesh geometry={collarFrontGeom} material={collarMat} position={[0, 0, 0]} />
        </group>
        {/* Collar Left Side Wing */}
        <mesh
          geometry={collarSideGeom}
          material={collarMat}
          position={[-BOX_W / 2 + 0.015, -0.03, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* Collar Right Side Wing */}
        <mesh
          geometry={collarSideGeom}
          material={collarMat}
          position={[BOX_W / 2 - 0.015, -0.03, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />

        {/* 
          ============================================================
          3 BACKGROUND PACKETS INSIDE THE BOX (Packets 1, 2, 3)
          Packets stay inside the pack when the hero packet slides out!
          Aligned with resting height (-0.66) so the red DEMONIC pouch
          fills the collar cutout when the hero packet emerges!
          ============================================================
        */}
        {/* Packet 1 (directly behind hero packet) */}
        <SealedPouch
          position={[0, -0.66, 0.08]}
          rotation={[0, 0, 0]}
          frontMat={sealedFrontMat}
          backMat={sealedBackMat}
        />
        {/* Packet 2 (middle packet) */}
        <SealedPouch
          position={[0, -0.69, -0.08]}
          rotation={[0, 0, 0]}
          frontMat={sealedFrontMat}
          backMat={sealedBackMat}
        />
        {/* Packet 3 (rear-most packet) */}
        <SealedPouch
          position={[0, -0.72, -0.24]}
          rotation={[0, 0, 0]}
          frontMat={sealedFrontMat}
          backMat={sealedBackMat}
        />
      </group>

      {/* 
        ============================================================
        FLIP-TOP LID GROUP
        Pivots around rear horizontal hinge line: [0, 0, -BOX_D / 2]
        When closed (rotX = 0):
          - Front wall is at z = +BOX_D / 2, spans y = 0 to y = +LID_H
          - Back wall is at z = -BOX_D / 2, spans y = 0 to y = +LID_H
          - Top wall is at y = +LID_H
        ============================================================
      */}
      <group ref={lidHingeRef} position={[0, 0, -BOX_D / 2]}>
        {/* Relative to hinge [0, 0, -BOX_D / 2], the lid center is at [0, LID_H / 2, BOX_D / 2] */}
        <group position={[0, LID_H / 2, BOX_D / 2]}>
          {/* Lid Front Panel (box-lid.png: "FOR THE OBSESSED") */}
          <mesh
            geometry={lidFrontGeom}
            material={lidFrontMat}
            position={[0, 0, BOX_D / 2]}
            castShadow
          />
          {/* Lid Front Inner Foil Lining */}
          <mesh
            geometry={lidFrontGeom}
            material={interiorFoilMat}
            position={[0, 0, BOX_D / 2 - 0.012]}
            rotation={[0, Math.PI, 0]}
          />

          {/* Lid Back Panel */}
          <mesh
            geometry={lidBackGeom}
            material={boxBackMat}
            position={[0, 0, -BOX_D / 2]}
            rotation={[0, Math.PI, 0]}
          />
          {/* Lid Back Inner Foil Lining */}
          <mesh
            geometry={lidBackGeom}
            material={interiorFoilMat}
            position={[0, 0, -BOX_D / 2 + 0.012]}
          />

          {/* Lid Left Side Panel */}
          <mesh
            geometry={lidSideGeom}
            material={boxSideMat}
            position={[-BOX_W / 2, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            castShadow
          />
          <mesh
            geometry={lidSideGeom}
            material={interiorFoilMat}
            position={[-BOX_W / 2 + 0.012, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          />

          {/* Lid Right Side Panel */}
          <mesh
            geometry={lidSideGeom}
            material={boxSideMat}
            position={[BOX_W / 2, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
          />
          <mesh
            geometry={lidSideGeom}
            material={interiorFoilMat}
            position={[BOX_W / 2 - 0.012, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          />

          {/* Lid Top Panel */}
          <mesh
            geometry={topGeom}
            material={boxPlainRedMat}
            position={[0, LID_H / 2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
          />
          <mesh
            geometry={topGeom}
            material={interiorFoilMat}
            position={[0, LID_H / 2 - 0.012, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      </group>
    </group>
  );
}
