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
function SealedPouch({ position, rotation, frontTexture, backTexture, opacity = 1.0 }) {
  const backGeom = useMemo(() => createBackPouchGeometry(24, 30), []);
  const frontGeom = useMemo(() => createFrontPeelGeometry(28, 36), []);

  const frontMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      roughness: 0.35,
      metalness: 0.04,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      side: THREE.FrontSide,
      transparent: true,
      opacity: opacity
    });
  }, [frontTexture, opacity]);

  const backMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: backTexture,
      roughness: 0.35,
      metalness: 0.04,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      side: THREE.FrontSide,
      transparent: true,
      opacity: opacity
    });
  }, [backTexture, opacity]);

  return (
    <group position={position} rotation={rotation} scale={0.96}>
      <mesh geometry={frontGeom} material={frontMat} castShadow />
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
      transparent: true,
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
      transparent: true,
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
      transparent: true,
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
      transparent: true,
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
      transparent: true,
      opacity: 1.0
    });
  }, []);

  // Inner Silver Foil Lining (for interior cavity of lid and body)
  const interiorFoilMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xccd1dc,
      roughness: 0.28,
      metalness: 0.88,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0
    });
  }, []);

  // Inner Collar / Throat Material (sleek matte charcoal with subtle red glow)
  const collarMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.42,
      metalness: 0.12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
  }, []);

  // Inner Frame Front Thumb Cutout Shape (Iconic cigarette pack U-notch)
  const collarFrontGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w2 = (BOX_W - 0.02) / 2;
    const botY = -0.5;
    const topY = 0.65;
    const notchBottom = 0.22;
    const notchWidth = 0.58;

    // Outer contour with U-cutout at top
    shape.moveTo(-w2, botY);
    shape.lineTo(-w2, topY);
    shape.lineTo(-w2 * 0.75, topY);
    shape.lineTo(-notchWidth, notchBottom + 0.05);
    shape.quadraticCurveTo(0, notchBottom - 0.04, notchWidth, notchBottom + 0.05);
    shape.lineTo(w2 * 0.75, topY);
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
  const collarSideGeom = useMemo(() => new THREE.PlaneGeometry(BOX_D - 0.02, 1.15), []);

  // Interior lining box geometries
  const bodyInteriorGeom = useMemo(() => new THREE.BoxGeometry(BOX_W - 0.03, BODY_H - 0.02, BOX_D - 0.03), []);
  const lidInteriorGeom = useMemo(() => new THREE.BoxGeometry(BOX_W - 0.03, LID_H - 0.02, BOX_D - 0.03), []);

  // Refs
  const boxRootRef = useRef();
  const lidHingeRef = useRef();
  const mouseLerp = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const anim = animRef?.current || {};
    const boxOpen = anim.boxOpen ?? 0;
    const boxScale = anim.boxScale ?? 0.82;
    const boxX = anim.boxX ?? 0;
    const boxY = anim.boxY ?? 0.80;
    const boxZ = anim.boxZ ?? 0;
    const boxRotX = anim.boxRotX ?? 0.08;
    const boxRotY = anim.boxRotY ?? -0.20;
    const boxRotZ = anim.boxRotZ ?? 0;
    const boxOpacity = anim.boxOpacity ?? 1.0;

    // Mouse parallax
    mouseLerp.current.x = THREE.MathUtils.lerp(mouseLerp.current.x, state.pointer.x * 0.07, 0.06);
    mouseLerp.current.y = THREE.MathUtils.lerp(mouseLerp.current.y, state.pointer.y * 0.05, 0.06);

    // 1. Root Cigarette Box Transform
    if (boxRootRef.current) {
      boxRootRef.current.position.set(boxX, boxY, boxZ);
      boxRootRef.current.rotation.x = boxRotX - mouseLerp.current.y;
      boxRootRef.current.rotation.y = boxRotY + mouseLerp.current.x;
      boxRootRef.current.rotation.z = boxRotZ;
      boxRootRef.current.scale.setScalar(boxScale);
      boxRootRef.current.visible = boxOpacity > 0.01;
    }

    // 2. Flip-Top Lid Hinge Rotation: flips back around X-axis (-2.15 rad = ~ -123°)
    if (lidHingeRef.current) {
      lidHingeRef.current.rotation.x = -boxOpen * 2.15;
    }

    // 3. Opacity Control
    [lidFrontMat, bodyFrontMat, boxSideMat, boxBackMat, boxPlainRedMat, interiorFoilMat, collarMat].forEach((mat) => {
      if (mat) {
        mat.opacity = boxOpacity;
        mat.depthWrite = boxOpacity > 0.95;
      }
    });
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
          position={[-BOX_W / 2 + 0.005, -BODY_H / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <mesh
          geometry={bodySideGeom}
          material={interiorFoilMat}
          position={[BOX_W / 2 - 0.005, -BODY_H / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <mesh
          geometry={bodyBackGeom}
          material={interiorFoilMat}
          position={[0, -BODY_H / 2, -BOX_D / 2 + 0.005]}
        />
        <mesh
          geometry={bottomGeom}
          material={interiorFoilMat}
          position={[0, -BODY_H + 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        {/* 
          INNER COLLAR / THROAT:
          Classic cigarette box cardstock insert with U-thumb cutout sticking up past y = 0
        */}
        <group position={[0, 0, BOX_D / 2 - 0.015]}>
          {/* Collar Front with U-cutout */}
          <mesh geometry={collarFrontGeom} material={collarMat} position={[0, 0, 0]} />
        </group>
        {/* Collar Left Side Wing */}
        <mesh
          geometry={collarSideGeom}
          material={collarMat}
          position={[-BOX_W / 2 + 0.015, 0.075, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* Collar Right Side Wing */}
        <mesh
          geometry={collarSideGeom}
          material={collarMat}
          position={[BOX_W / 2 - 0.015, 0.075, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />

        {/* 
          ============================================================
          3 BACKGROUND PACKETS INSIDE THE BOX (Packets 1, 2, 3)
          Packets stay inside the pack when the hero packet slides out!
          ============================================================
        */}
        {/* Packet 1 (directly behind hero packet) */}
        <SealedPouch
          position={[0, -0.92, 0.05]}
          rotation={[0, 0, 0]}
          frontTexture={pouchFront}
          backTexture={pouchBack}
        />
        {/* Packet 2 (middle packet) */}
        <SealedPouch
          position={[0, -0.92, -0.12]}
          rotation={[0, 0, 0]}
          frontTexture={pouchFront}
          backTexture={pouchBack}
        />
        {/* Packet 3 (rear-most packet) */}
        <SealedPouch
          position={[0, -0.92, -0.29]}
          rotation={[0, 0, 0]}
          frontTexture={pouchFront}
          backTexture={pouchBack}
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
            position={[0, 0, BOX_D / 2 - 0.005]}
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
            position={[0, 0, -BOX_D / 2 + 0.005]}
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
            position={[-BOX_W / 2 + 0.005, 0, 0]}
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
            position={[BOX_W / 2 - 0.005, 0, 0]}
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
            position={[0, LID_H / 2 - 0.005, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      </group>
    </group>
  );
}
