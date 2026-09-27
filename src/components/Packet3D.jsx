import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture, ContactShadows } from '@react-three/drei';
import {
  POUCH_WIDTH,
  POUCH_HEIGHT,
  createBackPouchGeometry,
  createInnerCavityGeometry,
  createFrontPeelGeometry,
  updatePeelDeformation,
  updateBackAndCavityCrumple,
  createOralStripGeometry
} from './pouchGeometry';

// Particle grid resolution for strip dissolution (24 cols x 36 rows = 864 platelets)
const PARTICLE_COLS = 24;
const PARTICLE_ROWS = 36;
const TOTAL_PARTICLES = PARTICLE_COLS * PARTICLE_ROWS;

export function PouchModel({ animProps, animRef }) {
  // Load front and back packaging textures
  const [frontTexture, backTexture] = useTexture([
    '/pouch-front.png',
    '/pouch-back.png'
  ]);

  // Ensure textures are strictly in sRGB color space with high anisotropy
  if (frontTexture && frontTexture.colorSpace !== THREE.SRGBColorSpace) {
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.anisotropy = 16;
    frontTexture.needsUpdate = true;
  }
  if (backTexture && backTexture.colorSpace !== THREE.SRGBColorSpace) {
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.anisotropy = 16;
    backTexture.needsUpdate = true;
  }

  // Geometries
  const backGeom = useMemo(() => createBackPouchGeometry(36, 45), []);
  const innerCavityGeom = useMemo(() => createInnerCavityGeometry(32, 40), []);
  const frontPeelGeom = useMemo(() => createFrontPeelGeometry(48, 64), []);
  const oralStripGeom = useMemo(() => createOralStripGeometry(28, 38, 1.12, 1.75), []);

  // 1. Satin foil front finish with transparency support for background fade
  const frontMaterial = useMemo(() => {
    if (frontTexture) {
      frontTexture.colorSpace = THREE.SRGBColorSpace;
      frontTexture.anisotropy = 16;
      frontTexture.needsUpdate = true;
    }
    return new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      roughness: 0.35, // Soft satin foil
      metalness: 0.04, // Subtle foil core
      clearcoat: 0.25, // Soft protective laminate
      clearcoatRoughness: 0.4,
      reflectivity: 0.5,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [frontTexture]);

  // Backside of the curling foil layer (satin silver foil interior)
  const peelBacksideMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.30,
      metalness: 0.88,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, []);

  // Back Face Material
  const backMaterial = useMemo(() => {
    if (backTexture) {
      backTexture.colorSpace = THREE.SRGBColorSpace;
      backTexture.anisotropy = 16;
      backTexture.needsUpdate = true;
    }
    return new THREE.MeshPhysicalMaterial({
      map: backTexture,
      roughness: 0.35,
      metalness: 0.04,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      reflectivity: 0.5,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, [backTexture]);

  // Inner Silver Foil Cavity Bed
  const innerFoilMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xc4c9d2,
      roughness: 0.34,
      metalness: 0.84,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      depthWrite: true
    });
  }, []);

  // Oral Strip Material: Translucent electric cobalt blue matching reference photo
  const stripMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#0284c7',
      roughness: 0.22,
      metalness: 0.04,
      transmission: 0.55,
      thickness: 0.05,
      ior: 1.42,
      clearcoat: 0.75,
      clearcoatRoughness: 0.18,
      emissive: '#034078',
      emissiveIntensity: 0.32,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
  }, []);

  // Particle platelet geometry for dissolution fragments
  const particlePlateletGeom = useMemo(() => {
    return new THREE.PlaneGeometry(0.046, 0.048);
  }, []);

  const particlePlateletMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#0284c7',
      roughness: 0.25,
      transmission: 0.50,
      emissive: '#034078',
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
  }, []);

  // Precompute particle grid offsets and drift vectors for the elongated strip (1.12 x 1.75)
  const particlesData = useMemo(() => {
    const list = [];
    const sWidth = 1.12;
    const sHeight = 1.75;

    for (let r = 0; r < PARTICLE_ROWS; r++) {
      const v = (r + 0.5) / PARTICLE_ROWS;
      for (let c = 0; c < PARTICLE_COLS; c++) {
        const u = (c + 0.5) / PARTICLE_COLS;
        const x = -sWidth / 2 + u * sWidth;
        const y = -sHeight / 2 + v * sHeight;

        // Dissolve from edges inward with organic noise
        const distFromEdge = Math.min(u, 1 - u, v, 1 - v) * 2.0;
        const noise = (Math.sin(u * 15.3 + v * 21.7) + 1.0) * 0.5;
        const threshold = distFromEdge * 0.55 + noise * 0.25;

        // Drift vector outward from center
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
  const frontPeelMeshRef = useRef();
  const stripGroupRef = useRef();
  const stripMeshRef = useRef();
  const instancedParticlesRef = useRef();
  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  // Mouse parallax
  const mouseLerp = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    // Read continuously interpolated GSAP properties from animRef or animProps
    const anim = animRef?.current || animProps || {};
    const peel = anim.peel ?? 0;
    const packetCrumple = anim.packetCrumple ?? 0;
    const packetOpacity = anim.packetOpacity ?? 1.0;
    const packetX = anim.packetX ?? 0;
    const packetY = anim.packetY ?? 0;
    const packetZ = anim.packetZ ?? 0;
    const packetRotX = anim.packetRotX ?? 0;
    const packetRotY = anim.packetRotY ?? 0;
    const packetRotZ = anim.packetRotZ ?? 0;
    const packetScale = anim.packetScale ?? 1.0;
    const stripX = anim.stripX ?? 0.0;
    const stripY = anim.stripY ?? 0.45;
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

    // Dynamic Opacity Fade and DepthWrite toggle for see-through transparent packet
    const isTransp = packetOpacity < 0.99;
    if (frontMaterial) {
      frontMaterial.opacity = packetOpacity;
      frontMaterial.depthWrite = !isTransp;
    }
    if (peelBacksideMaterial) {
      peelBacksideMaterial.opacity = packetOpacity;
      peelBacksideMaterial.depthWrite = !isTransp;
    }
    if (backMaterial) {
      backMaterial.opacity = packetOpacity;
      backMaterial.depthWrite = !isTransp;
    }
    if (innerFoilMaterial) {
      innerFoilMaterial.opacity = packetOpacity;
      innerFoilMaterial.depthWrite = !isTransp;
    }

    // 2. Subtle Mouse Parallax
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

    // 3. Continuous Packet Group Transform & Volumetric Hand-Crush Scale
    // Positioned strictly behind the emerging strip
    const pRotX = -mouseY + packetRotX;
    const pRotY = mouseX + packetRotY;
    const pRotZ = packetRotZ;

    if (packetGroupRef.current) {
      packetGroupRef.current.position.set(packetX, packetY, packetZ);
      packetGroupRef.current.rotation.set(pRotX, pRotY, pRotZ);

      // Volumetric 3D scale compression when hand-folded
      const scaleX = (1.0 - packetCrumple * 0.35) * packetScale;
      const scaleY = (1.0 - packetCrumple * 0.28) * packetScale;
      const scaleZ = (1.0 + packetCrumple * 0.70) * packetScale;
      packetGroupRef.current.scale.set(scaleX, scaleY, scaleZ);

      // Hide packet when completely off-screen or faded out
      packetGroupRef.current.visible = packetOpacity > 0.002 && packetY > -10.0;
    }

    // 4. Continuous Oral Strip Position & Orientation
    // Inside packet (stripZ <= -0.01): rigidly follows packet cavity on hover
    // Emerging forward to hero position (stripZ >= 0.05): smoothly detaches and stays in front
    if (stripGroupRef.current) {
      // Silky-smooth C2 continuous smoothstep detachment from packet cavity
      const rawDetached = Math.max(0, Math.min(1, (stripZ - (-0.018)) / 0.22));
      const isDetached = rawDetached * rawDetached * (3.0 - 2.0 * rawDetached);

      const cosY = Math.cos(pRotY);
      const sinY = Math.sin(pRotY);
      const cosX = Math.cos(pRotX);
      const sinX = Math.sin(pRotX);

      // Rotate local offset (stripX, stripY, stripZ) around packet origin
      const xRot = stripX * cosY + stripZ * sinY;
      const zRot1 = -stripX * sinY + stripZ * cosY;
      const yRot = stripY * cosX - zRot1 * sinX;
      const zRot = stripY * sinX + zRot1 * cosX;

      const finalX = THREE.MathUtils.lerp(packetX + xRot, stripX + mouseX * 0.15, isDetached);
      const finalY = THREE.MathUtils.lerp(packetY + yRot, stripY - mouseY * 0.15, isDetached);
      const finalZ = THREE.MathUtils.lerp(packetZ + zRot, stripZ, isDetached);

      stripGroupRef.current.position.set(finalX, finalY, finalZ);

      const sRotX = THREE.MathUtils.lerp(-mouseY + stripRotX, -mouseY * 0.35 + stripRotX, isDetached);
      const sRotY = THREE.MathUtils.lerp(mouseX + stripRotY, mouseX * 0.35 + stripRotY, isDetached);
      const sRotZ = stripRotZ;

      stripGroupRef.current.rotation.set(sRotX, sRotY, sRotZ);
    }

    // 5. Solid Strip Mesh Smooth Crossfade, Scale & Strict Visibility
    // When packet is sealed (peel <= 0.01), strip is 100% hidden!
    // As foil peels open, strip becomes visible inside cavity and stays visible until dissolution.
    if (stripMeshRef.current && stripMaterial) {
      stripMaterial.opacity = stripOpacity;
      stripMeshRef.current.scale.setScalar(stripScale);
      stripMeshRef.current.visible = (peel > 0.01 || packetOpacity < 0.98) && stripOpacity > 0.005;
    }

    // 6. Particle Dissolution (Smooth Bell-Curve Overlapping Breakup)
    if (instancedParticlesRef.current) {
      if (dissolveT <= 0.001) {
        particlePlateletMat.opacity = 0;
        instancedParticlesRef.current.visible = false;
      } else {
        instancedParticlesRef.current.visible = true;
        // Continuous sinusoidal bell-curve opacity envelope (zero sharp steps)
        const plateletFade = Math.sin(Math.min(Math.PI, dissolveT * Math.PI));
        particlePlateletMat.opacity = Math.pow(plateletFade, 0.82) * 0.95;

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          const data = particlesData[i];
          const rawLocal = Math.max(0, (dissolveT - data.threshold * 0.6) / (1.0 - data.threshold * 0.6 + 0.001));

          if (rawLocal <= 0) {
            dummyObj.position.set(data.originX, data.originY, data.originZ);
            dummyObj.rotation.set(0, 0, 0);
            dummyObj.scale.set(1, 1, 1);
          } else {
            const localT = Math.min(1.0, rawLocal);
            // Smoothstep acceleration curve for organic fluid dispersion
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
        PACKET BODY GROUP (Smoothly drops downward off-screen)
        ============================================================
      */}
      <group ref={packetGroupRef}>
        {/* Contact shadow below packet */}
        <ContactShadows
          position={[0, -POUCH_HEIGHT / 2 - 0.1, 0]}
          opacity={0.4}
          scale={5.5}
          blur={2.5}
          far={3.0}
          color="#150003"
        />

        {/* Back face of the packet */}
        <mesh
          geometry={backGeom}
          material={backMaterial}
          castShadow
          receiveShadow
        />

        {/* Inner silver foil cavity bed */}
        <mesh
          geometry={innerCavityGeom}
          material={innerFoilMaterial}
          receiveShadow
        />

        {/* 
          FRONT PEEL LAYER:
          Completely sealed at start.
          Peels open with continuous curved S-fold from top-left notch.
        */}
        <group>
          {/* Front printed face */}
          <mesh
            ref={frontPeelMeshRef}
            geometry={frontPeelGeom}
            material={frontMaterial}
            castShadow
          />
          {/* Underside silver foil layer */}
          <mesh
            geometry={frontPeelGeom}
            material={peelBacksideMaterial}
            receiveShadow
          />
        </group>
      </group>

      {/* 
        ============================================================
        ORAL STRIP & DISSOLUTION PARTICLES
        Independent from packet group so packet drops while strip stays!
        ============================================================
      */}
      <group ref={stripGroupRef} position={[0.0, 0.45, -0.015]}>
        {/* Solid translucent blue elongated strip */}
        <mesh
          ref={stripMeshRef}
          geometry={oralStripGeom}
          material={stripMaterial}
          visible={false}
          renderOrder={10}
          castShadow
          receiveShadow
        />

        {/* Instanced particle grid for mid-air dissolution */}
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
