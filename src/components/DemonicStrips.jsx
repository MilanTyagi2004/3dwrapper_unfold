import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import gsap from 'gsap';
import { PouchModel } from './Packet3D';
import './DemonicStrips.css';

// Responsive Camera Controller: Centers 3D model horizontally and frames it compactly on mobile
function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isMobile = size.width <= 840;
    if (isMobile) {
      camera.position.set(0, 0.08, 6.0);
      camera.lookAt(0, 0.08, 0);
    } else {
      camera.position.set(0.22, 0, 6.3);
      camera.lookAt(0.22, 0, 0);
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
}

// Exact 6-Second Cinematic Storytelling Stages
const STAGES = [
  {
    id: 'peel',
    eyebrow: '01 — READY',
    headline: 'Energy,\nwithout the\nritual.',
    description: '45mg natural caffeine in a thin oral strip.\nNo can. No water. No waiting.',
    meta: '45 MG CAFFEINE · ZERO SUGAR'
  },
  {
    id: 'taste',
    eyebrow: '02 — EMERGE',
    headline: 'Mint hits.\nEnergy follows.',
    description: 'The oral strip glides out into focus\nas the packet fades away.',
    meta: 'FAST DISSOLVE · SHARP MINT'
  },
  {
    id: 'drop',
    eyebrow: '03 — VANISH',
    headline: 'Nothing to carry.\nEverything to gain.',
    description: 'The pack disappears.\nThe energy stays.',
    meta: 'ZERO WATER · POCKET READY'
  },
  {
    id: 'dissolve',
    eyebrow: '04 — DISSOLVE',
    headline: 'Gone in seconds.',
    description: 'The strip dissolves slowly into the moment,\nleaving only pure focus behind.',
    meta: 'FAST ABSORPTION · NO WASTE'
  }
];

const DemonicStrips = () => {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);
  const lastStageRef = useRef(0);

  // High-performance shared mutable ref (zero React state overhead during 60/120Hz animation)
  const animRef = useRef({
    peel: 0,
    packetCrumple: 0,
    packetOpacity: 1,
    packetY: 0,
    packetZ: 0,
    packetRotX: 0,
    packetRotZ: 0,
    stripX: 0.0,
    stripY: 0.45,
    stripZ: -0.015,
    stripRotX: 0,
    stripRotY: 0,
    stripRotZ: 0,
    stripOpacity: 1,
    stripScale: 1,
    dissolveProgress: 0,
    timelineProgress: 0
  });

  // React state updated ONLY when active stage changes (4 times per 6s loop)
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // Shared continuous animation object driven by GSAP
    const animObj = {
      peel: 0,
      packetCrumple: 0,
      packetOpacity: 1,
      packetY: 0,
      packetZ: 0,
      packetRotX: 0,
      packetRotZ: 0,
      stripX: 0.0,
      stripY: 0.45,
      stripZ: -0.015,
      stripRotX: 0,
      stripRotY: 0,
      stripRotZ: 0,
      stripOpacity: 1,
      stripScale: 1,
      dissolveProgress: 0,
      timelineProgress: 0
    };

    // Master 6-Second Continuous Timeline with Overlapping Tracks
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.4,
      paused: false,
      onUpdate: () => {
        // Direct ref mutation for Three.js useFrame (zero React re-renders!)
        animRef.current = animObj;

        const time = tl.time();

        // Determine active stage based on exact 6-second timeline intervals
        let newStage = 0;
        if (time >= 4.2) newStage = 3;
        else if (time >= 2.8) newStage = 2;
        else if (time >= 1.3) newStage = 1;
        else newStage = 0;

        if (newStage !== lastStageRef.current) {
          lastStageRef.current = newStage;
          setStageIndex(newStage);
        }
      }
    });

    timelineRef.current = tl;

    // Explicit baseline state at t = 0 for seamless repeat loops and reverse scrubbing
    tl.set(animObj, {
      peel: 0,
      packetCrumple: 0,
      packetOpacity: 1,
      packetY: 0,
      packetZ: 0,
      packetRotX: 0,
      packetRotZ: 0,
      stripX: 0.0,
      stripY: 0.45,
      stripZ: -0.015,
      stripRotX: 0,
      stripRotY: 0,
      stripRotZ: 0,
      stripOpacity: 1,
      stripScale: 1,
      dissolveProgress: 0,
      timelineProgress: 0
    }, 0);

    // =========================================================================
    // 0.10s – 1.25s : STAGE 01 (READY) — DEEP TOP-HALF PEEL DOWN
    // The top flap rolls smoothly downward, unveiling the oral strip on its bed
    // =========================================================================
    tl.to(animObj, {
      peel: 1.0,
      duration: 1.15,
      ease: 'sine.inOut'
    }, 0.1);

    // =========================================================================
    // 1.30s – 2.80s : STAGE 02 (EMERGE) — STRIP GLIDES FORWARD & PACKET MELTS
    // Fully revealed strip floats gracefully forward into hero focus in front
    // =========================================================================
    // Packet melts into transparent nothingness:
    tl.to(animObj, {
      packetOpacity: 0.0,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 1.3);

    tl.to(animObj, {
      packetZ: -0.16,
      duration: 1.3,
      ease: 'sine.out'
    }, 1.3);

    // Strip glides forward into hero spotlight:
    tl.to(animObj, {
      stripZ: 0.44,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 1.3);

    tl.to(animObj, {
      stripY: 0.16,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 1.3);

    tl.to(animObj, {
      stripScale: 1.08,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 1.3);

    tl.to(animObj, {
      stripRotX: -0.05,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 1.3);

    // =========================================================================
    // 2.80s – 4.20s : STAGE 03 (VANISH) — HOVER IN SPOTLIGHT
    // Packet is completely gone. Strip floats serenely in mid-air in front.
    // =========================================================================
    tl.to(animObj, {
      stripY: 0.21,
      duration: 1.5,
      ease: 'sine.inOut'
    }, 2.7);

    tl.to(animObj, {
      stripRotZ: 0.02,
      duration: 3.2,
      ease: 'sine.inOut'
    }, 2.7);

    // =========================================================================
    // 4.20s – 6.00s : STAGE 04 (DISSOLVE) — CONTINUOUS DISSOLUTION TILL THE VERY LAST SECOND
    // Strip and platelets drift, dissolve and disappear continuously right up to 5.98s
    // =========================================================================
    tl.to(animObj, {
      stripY: 0.17,
      duration: 1.8,
      ease: 'sine.inOut'
    }, 4.2);

    // Dissolution runs continuously from 3.0s all the way to 5.98s (active till the very end!)
    tl.to(animObj, {
      dissolveProgress: 1.0,
      duration: 2.98,
      ease: 'sine.inOut'
    }, 3.0);

    // Solid strip body dissolves smoothly into the cloud of platelets
    tl.to(animObj, {
      stripOpacity: 0.0,
      stripScale: 0.93,
      duration: 2.1,
      ease: 'sine.inOut'
    }, 3.5);

    // Single normalized progress value: progress = elapsed / 6.00s
    tl.to(animObj, {
      timelineProgress: 1.0,
      duration: 6.0,
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
              camera={{ position: [0.22, 0, 6.3], fov: 35 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              dpr={[1, 2]}
            >
              <ResponsiveCamera />
              <ambientLight intensity={0.55} />

              <directionalLight
                position={[4, 6, 5]}
                intensity={1.2}
                castShadow
              />

              <pointLight
                position={[-4.5, 2, -1.5]}
                color="#ff003c"
                intensity={3.8}
                distance={12}
              />

              <pointLight
                position={[2.5, -2, 3.5]}
                color="#38bdf8"
                intensity={0.8}
                distance={10}
              />

              <Environment preset="studio" environmentIntensity={0.25} />

              <Suspense fallback={null}>
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
              const isPrev = idx === (stageIndex === 0 ? 3 : stageIndex - 1);

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
