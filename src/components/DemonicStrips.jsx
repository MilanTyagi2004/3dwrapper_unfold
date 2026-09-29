import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import gsap from 'gsap';
import { PouchModel } from './Packet3D';
import { CigaretteBox } from './CigaretteBox';
import './DemonicStrips.css';

// Responsive Camera Controller: Centers 3D model horizontally and frames it compactly on mobile
function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isMobile = size.width <= 840;
    if (isMobile) {
      camera.position.set(0, 0.06, 8.6);
      camera.lookAt(0, 0.06, 0);
      camera.fov = 44;
    } else {
      camera.position.set(0.14, 0.0, 8.6);
      camera.lookAt(0.14, 0, 0);
      camera.fov = 43;
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
}

// 5 Cinematic Storytelling Stages: Unbox -> Dispense -> Peel -> Emerge -> Dissolve
const STAGES = [
  {
    id: 'pack',
    eyebrow: '01 — UNPACK',
    headline: 'Engineered\nfor the\nobsessed.',
    description: 'Flip-top pocket pack. Precision cardstock casing\nhousing 4 single-serve oral strip pouches.',
    meta: 'FLIP-TOP PACK · 4 STRIPS'
  },
  {
    id: 'dispense',
    eyebrow: '02 — DISPENSE',
    headline: 'One slide.\nPure energy.',
    description: 'The front pouch glides smoothly out of the pack\nand advances into hero focus.',
    meta: '45MG CAFFEINE · POCKET READY'
  },
  {
    id: 'peel',
    eyebrow: '03 — READY',
    headline: 'Energy,\nwithout the\nritual.',
    description: '45mg natural caffeine in a thin oral strip.\nNo can. No water. No waiting.',
    meta: 'ZERO SUGAR · FAST DISSOLVE'
  },
  {
    id: 'taste',
    eyebrow: '04 — EMERGE',
    headline: 'Mint hits.\nEnergy follows.',
    description: 'The oral strip glides out into focus\nas the packet fades away.',
    meta: 'FAST DISSOLVE · SHARP MINT'
  },
  {
    id: 'dissolve',
    eyebrow: '05 — DISSOLVE',
    headline: 'Gone in seconds.',
    description: 'The strip dissolves slowly into the moment,\nleaving only pure focus behind.',
    meta: 'FAST ABSORPTION · NO WASTE'
  }
];

const INITIAL_ANIM = {
  boxOpen: 0,
  boxScale: 0.70,
  boxX: 0.0,
  boxY: -0.22,
  boxZ: 0.0,
  boxRotX: 0.06,
  boxRotY: -Math.PI * 0.14,   // ~-25°: barely angled, gentle settle-in sweep
  boxRotZ: 0.0,
  boxOpacity: 0.0,             // materialise from darkness as it spins
  packetX: -0.033,
  packetY: -0.651,
  packetZ: 0.106,
  packetRotX: 0.08,
  packetRotY: -0.20,
  packetRotZ: 0.0,
  packetScale: 0.75,
  packetOpacity: 1.0,
  packetCrumple: 0,
  peel: 0,
  stripX: 0.0,
  stripY: -0.12,
  stripZ: 0.008,
  stripRotX: 0,
  stripRotY: 0,
  stripRotZ: 0,
  stripOpacity: 1.0,
  stripScale: 1.0,
  dissolveProgress: 0,
  timelineProgress: 0
};

const DemonicStrips = () => {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);
  const lastStageRef = useRef(0);

  // High-performance shared mutable ref (zero React state overhead during 60/120Hz animation)
  const animRef = useRef({ ...INITIAL_ANIM });

  // React state updated ONLY when active stage changes (5 times per 9.6s loop)
  const [stageIndex, setStageIndex] = useState(0);


  useEffect(() => {
    // Shared continuous animation object driven by GSAP
    const animObj = { ...INITIAL_ANIM };

    // Master 10-Second Continuous Timeline with Overlapping Tracks
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.5,
      paused: false,
      onUpdate: () => {
        // Direct ref mutation for Three.js useFrame (zero React re-renders!)
        animRef.current = animObj;

        const time = tl.time();

        // Determine active stage based on timeline intervals
        let newStage = 0;
        if (time >= 6.6) newStage = 4;      // DISSOLVE
        else if (time >= 5.2) newStage = 3; // EMERGE
        else if (time >= 3.8) newStage = 2; // READY / PEEL
        else if (time >= 2.0) newStage = 1; // DISPENSE
        else newStage = 0;                   // UNPACK

        if (newStage !== lastStageRef.current) {
          lastStageRef.current = newStage;
          setStageIndex(newStage);
        }
      }
    });

    timelineRef.current = tl;
    window.__stripsTimeline = tl;

    // Explicit baseline state at t = 0 for seamless repeat loops
    tl.set(animObj, { ...INITIAL_ANIM }, 0);

    // =========================================================================
    // 0.00s – 0.75s : STAGE 01 (UNPACK) — PRODUCT REVEAL SPIN
    // Box materialises from darkness while sweeping ~120° into hero position.
    // Always visible from frame 1 (side-corner panel) — no invisible t=0 pop.
    // =========================================================================

    // Opacity: fast materialise from dark (done by 0.4s)
    tl.to(animObj, {
      boxOpacity: 1.0,
      duration: 0.45,
      ease: 'power2.out'
    }, 0.0);

    // Rotation: subtle 25° sweep — front face visible 100% of the time
    tl.to(animObj, {
      boxRotY: -0.20,
      boxRotX: 0.08,
      duration: 0.85,
      ease: 'sine.out'
    }, 0.0);

    // Rise + scale: rises from slightly below as it spins
    tl.to(animObj, {
      boxY: 0.05,
      boxScale: 0.75,
      duration: 0.75,
      ease: 'power2.out'
    }, 0.0);

    // =========================================================================
    // 1.00s – 2.05s : STAGE 01 (UNPACK) — FLIP-TOP LID OPENS & BOX TILTS
    // The cigarette box lid flips open backwards (-123°), revealing 4 red packets inside!
    // =========================================================================
    tl.to(animObj, {
      boxOpen: 1.0,
      duration: 1.05,
      ease: 'back.out(1.2)'
    }, 1.0);

    tl.to(animObj, {
      boxRotY: -0.15,
      boxRotX: 0.12,
      duration: 1.05,
      ease: 'sine.inOut'
    }, 1.0);

    tl.to(animObj, {
      packetRotY: -0.15,
      packetRotX: 0.12,
      packetX: -0.025,
      packetY: -0.655,
      packetZ: 0.08,
      duration: 1.05,
      ease: 'sine.inOut'
    }, 1.0);

    // =========================================================================
    // 2.05s – 3.80s : STAGE 02 (DISPENSE) — HERO PACKET ELEVATES CLEANLY OUT OF BOX
    // 1. Box stays 100% STATIONARY in place (NO downward drop while sliding!)
    // 2. Hero packet slides straight UP out of the collar opening, clearing the box
    // 3. ONLY AFTER the packet has completely exited the box (t >= 2.95s),
    //    the packet floats into center stage and the box recedes & fades away
    // =========================================================================
    // Step 1: Packet slides straight UP along the box throat, completely emerging
    // Box remains 100% fixed at [0, 0.05, 0] with zero movement!
    tl.to(animObj, {
      packetX: -0.025,
      packetY: 1.86,
      packetZ: 0.38,
      duration: 0.85,
      ease: 'power2.out'
    }, 2.05);

    // Step 2: Only after packet is 100% clear of the box (t >= 2.95s),
    // packet floats down to center stage [0, 0, 0], scales to 1.0, and faces camera
    tl.to(animObj, {
      packetX: 0.0,
      packetY: 0.0,
      packetZ: 0.0,
      packetRotY: 0.0,
      packetRotX: -0.04,
      packetScale: 1.0,
      duration: 0.85,
      ease: 'power2.inOut'
    }, 2.95);

    // Step 3: Concurrently at t >= 2.95s, box drops and recedes away into the background
    tl.to(animObj, {
      boxZ: -3.5,
      boxY: -0.80,
      boxOpacity: 0.0,
      duration: 0.85,
      ease: 'sine.in'
    }, 2.95);

    // =========================================================================
    // 3.80s – 5.65s : STAGE 03 (READY / PEEL) — TACTILE FOIL PEEL DOWN
    // Real foil peel feel: slow grab at notch → accelerating pull → gentle settle
    // =========================================================================
    tl.to(animObj, {
      peel: 1.0,
      duration: 1.85,
      ease: 'power2.inOut'  // slow start (notch grab) → accelerating pull → settle
    }, 3.8);

    // Micro-jerk at peel start: slight pull-back tension, then settle forward as foil yields
    tl.to(animObj, {
      packetRotX: -0.035,   // slight backward tilt from pull tension
      duration: 0.30,
      ease: 'power3.out'
    }, 3.8);
    tl.to(animObj, {
      packetRotX: -0.010,   // settles naturally as foil gives way
      duration: 1.55,
      ease: 'sine.out'
    }, 4.1);

    tl.to(animObj, {
      packetRotX: -0.04,
      duration: 0.80,
      ease: 'sine.inOut'
    }, 4.55);

    // =========================================================================
    // 5.35s – 6.60s : STAGE 04 (EMERGE) — STRIP GLIDES FORWARD & PACKET MELTS
    // Fully revealed strip floats gracefully forward into hero focus in front
    // =========================================================================
    tl.to(animObj, {
      packetOpacity: 0.0,
      duration: 1.25,
      ease: 'sine.inOut'
    }, 5.35);

    tl.to(animObj, {
      packetZ: -0.16,
      duration: 1.20,
      ease: 'sine.out'
    }, 5.35);

    // Strip glides forward into hero spotlight:
    tl.to(animObj, {
      stripZ: 0.44,
      duration: 1.25,
      ease: 'sine.inOut'
    }, 5.35);

    tl.to(animObj, {
      stripY: -0.02,
      duration: 1.25,
      ease: 'sine.inOut'
    }, 5.35);

    tl.to(animObj, {
      stripScale: 1.08,
      duration: 1.25,
      ease: 'sine.inOut'
    }, 5.35);

    tl.to(animObj, {
      stripRotX: -0.05,
      duration: 1.25,
      ease: 'sine.inOut'
    }, 5.35);

    // =========================================================================
    // 6.60s – 9.60s : STAGE 05 (DISSOLVE) — HOVER & CONTINUOUS DISSOLUTION
    // Strip and platelets drift, dissolve and disappear continuously right up to 9.6s
    // =========================================================================
    tl.to(animObj, {
      stripY: 0.03,
      duration: 1.6,
      ease: 'sine.inOut'
    }, 6.6);

    tl.to(animObj, {
      stripRotZ: 0.02,
      duration: 2.8,
      ease: 'sine.inOut'
    }, 6.6);

    tl.to(animObj, {
      stripY: -0.02,
      duration: 1.6,
      ease: 'sine.inOut'
    }, 8.0);

    // Dissolution runs continuously from 6.8s all the way to 9.5s
    tl.to(animObj, {
      dissolveProgress: 1.0,
      duration: 2.7,
      ease: 'sine.inOut'
    }, 6.8);

    // Solid strip body dissolves smoothly into the cloud of platelets
    tl.to(animObj, {
      stripOpacity: 0.0,
      stripScale: 0.93,
      duration: 1.9,
      ease: 'sine.inOut'
    }, 7.2);

    // Single normalized progress value: progress = elapsed / 9.60s
    tl.to(animObj, {
      timelineProgress: 1.0,
      duration: 9.6,
      ease: 'none'
    }, 0.0);

    // IntersectionObserver: auto-start when visible, pause/reset cleanly when out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tl.play();
        } else {
          tl.pause(0);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="strips-section">
      {/* Subtle Atmospheric Background Glow behind packet */}
      <div className="strips-ambient-glow"></div>

      <div className="strips-content-frame">
        {/* 1. TOP BRANDING */}
        <header className="strips-top-brand">
          <span className="brand-eyebrow">ORAL ENERGY STRIP · 45MG CAFFEINE</span>
          <h2 className="brand-title">
            DEMONIC <span className="title-accent">FUEL</span>
          </h2>
          <p className="brand-tagline">No water. No can. No waiting.</p>
        </header>

        {/* 
          2. MAIN CINEMATIC COMPOSITION:
          3D Packet (Hero, slightly left of center) + Dynamic Editorial Typography (Right)
        */}
        <div className="strips-main-stage">
          {/* 3D Packet Canvas Stage */}
          <div className="packet-canvas-stage">
            <Canvas
              camera={{ position: [0.14, 0, 8.6], fov: 43 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', localClippingEnabled: true }}
              dpr={[1, 2]}
            >
              <ResponsiveCamera />
              {/* Soft, rich ambient illumination for pure matte diffuse red */}
              <ambientLight intensity={1.15} />

              {/* Gentle directional key light (soft shadows, no hot glossy spots) */}
              <directionalLight
                position={[4.0, 5.5, 5.0]}
                intensity={1.05}
                color="#fff6f0"
                castShadow
              />

              {/* Soft fill light from upper left */}
              <directionalLight
                position={[-3.5, 3.5, 3.0]}
                intensity={0.45}
                color="#ffe8e8"
              />

              {/* Gentle crimson bounce light */}
              <pointLight
                position={[-4.0, 2.0, 2.5]}
                color="#ff1234"
                intensity={1.2}
                distance={12}
              />

              {/* Crisp oral strip accent */}
              <pointLight
                position={[2.5, -2, 3.5]}
                color="#38bdf8"
                intensity={0.35}
                distance={10}
              />

              {/* Very low environment reflection to eliminate all glossy glare */}
              <Environment preset="studio" environmentIntensity={0.05} />

              <Suspense fallback={null}>
                <CigaretteBox animRef={animRef} />
                <PouchModel animRef={animRef} />
              </Suspense>
            </Canvas>
          </div>

          {/* 
            DYNAMIC EDITORIAL STORYTELLING:
            Floating cinematic typography directly on the background (no cards/borders)
          */}
          <div className="editorial-story-panel">
            {STAGES.map((stage, idx) => {
              const isActive = idx === stageIndex;
              const isPrev = idx === (stageIndex === 0 ? STAGES.length - 1 : stageIndex - 1);

              return (
                <div
                  key={stage.id}
                  className={`editorial-content-block ${isActive ? 'is-active' : ''} ${isPrev ? 'is-prev' : ''}`}
                >
                  {/* Eyebrow / Stage indicator */}
                  <div className="editorial-eyebrow">
                    <span className="eyebrow-line"></span>
                    <span>{stage.eyebrow}</span>
                  </div>

                  {/* Large Editorial Headline */}
                  <h3 className="editorial-headline">
                    {stage.headline.split('\n').map((line, i) => (
                      <span key={i} className="headline-line">
                        {line}
                      </span>
                    ))}
                  </h3>

                  {/* Short Supporting Paragraph */}
                  <p className="editorial-description">
                    {stage.description.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < stage.description.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>

                  {/* Supporting Metadata */}
                  <div className="editorial-meta-row">
                    <span className="editorial-meta-item">{stage.meta}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </section>
  );
};

export default DemonicStrips;
