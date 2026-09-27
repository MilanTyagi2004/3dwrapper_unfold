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
      camera.position.set(0, 0.06, 7.6);
      camera.lookAt(0, 0.06, 0);
      camera.fov = 40;
    } else {
      camera.position.set(0.14, 0.0, 7.8);
      camera.lookAt(0.14, 0, 0);
      camera.fov = 38;
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
  boxScale: 0.76,
  boxX: 0.0,
  boxY: 0.65,
  boxZ: 0.0,
  boxRotX: 0.08,
  boxRotY: -0.20,
  boxRotZ: 0.0,
  boxOpacity: 1.0,
  packetX: -0.03,
  packetY: -0.05,
  packetZ: 0.18,
  packetRotX: 0.08,
  packetRotY: -0.20,
  packetRotZ: 0.0,
  packetScale: 0.76,
  packetOpacity: 1.0,
  packetCrumple: 0,
  peel: 0,
  stripX: 0.0,
  stripY: 0.45,
  stripZ: -0.015,
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
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!timelineRef.current) return;
    if (isPlaying) {
      timelineRef.current.pause();
      setIsPlaying(false);
    } else {
      timelineRef.current.play();
      setIsPlaying(true);
    }
  };

  const jumpToStage = (time) => {
    if (!timelineRef.current) return;
    timelineRef.current.seek(time);
    timelineRef.current.pause();
    setIsPlaying(false);
  };

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
    // 0.00s – 1.00s : STAGE 01 (UNPACK) — PRISTINE CLOSED CIGARETTE BOX
    // The closed flip-top box stands proudly in the spotlight ("FOR THE OBSESSED")
    // =========================================================================

    // =========================================================================
    // 1.00s – 2.20s : STAGE 01 (UNPACK) — FLIP-TOP LID OPENS & BOX TILTS
    // The cigarette box lid flips open backwards (-123°), revealing 4 red packets inside!
    // =========================================================================
    tl.to(animObj, {
      boxOpen: 1.0,
      duration: 1.2,
      ease: 'back.out(1.2)'
    }, 1.0);

    tl.to(animObj, {
      boxRotY: -0.15,
      boxRotX: 0.12,
      duration: 1.2,
      ease: 'sine.inOut'
    }, 1.0);

    tl.to(animObj, {
      packetRotY: -0.15,
      packetRotX: 0.12,
      duration: 1.2,
      ease: 'sine.inOut'
    }, 1.0);

    // =========================================================================
    // 2.20s – 3.80s : STAGE 02 (DISPENSE) — HERO PACKET GLIDES OUT OF THE BOX
    // Front packet elevates up out of the collar, tilts forward, and floats to center stage!
    // =========================================================================
    // 1. Pouch slides smoothly up and forward out of the collar notch
    tl.to(animObj, {
      packetY: 0.65,
      packetZ: 0.38,
      duration: 0.85,
      ease: 'power2.out'
    }, 2.1);

    // 2. Pouch rotates to face camera directly
    tl.to(animObj, {
      packetX: 0.0,
      packetRotY: 0.0,
      packetRotX: -0.04,
      duration: 0.80,
      ease: 'sine.inOut'
    }, 2.45);

    // 3. Pouch glides gracefully into hero center position & expands to full hero scale
    tl.to(animObj, {
      packetY: 0.0,
      packetZ: 0.0,
      packetScale: 1.0,
      duration: 0.90,
      ease: 'power2.inOut'
    }, 2.65);

    // 4. Cigarette box glides back into atmospheric depth and fades away
    tl.to(animObj, {
      boxZ: -1.8,
      boxY: 0.25,
      boxOpacity: 0.0,
      duration: 1.1,
      ease: 'sine.inOut'
    }, 2.5);

    // =========================================================================
    // 3.80s – 5.20s : STAGE 03 (READY / PEEL) — DEEP TOP-HALF FOIL PEEL DOWN
    // The top flap rolls smoothly downward, unveiling the oral strip on its bed
    // =========================================================================
    tl.to(animObj, {
      peel: 1.0,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 3.8);

    // =========================================================================
    // 5.20s – 6.60s : STAGE 04 (EMERGE) — STRIP GLIDES FORWARD & PACKET MELTS
    // Fully revealed strip floats gracefully forward into hero focus in front
    // =========================================================================
    tl.to(animObj, {
      packetOpacity: 0.0,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 5.2);

    tl.to(animObj, {
      packetZ: -0.16,
      duration: 1.3,
      ease: 'sine.out'
    }, 5.2);

    // Strip glides forward into hero spotlight:
    tl.to(animObj, {
      stripZ: 0.44,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 5.2);

    tl.to(animObj, {
      stripY: 0.16,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 5.2);

    tl.to(animObj, {
      stripScale: 1.08,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 5.2);

    tl.to(animObj, {
      stripRotX: -0.05,
      duration: 1.35,
      ease: 'sine.inOut'
    }, 5.2);

    // =========================================================================
    // 6.60s – 9.60s : STAGE 05 (DISSOLVE) — HOVER & CONTINUOUS DISSOLUTION
    // Strip and platelets drift, dissolve and disappear continuously right up to 9.6s
    // =========================================================================
    tl.to(animObj, {
      stripY: 0.21,
      duration: 1.6,
      ease: 'sine.inOut'
    }, 6.6);

    tl.to(animObj, {
      stripRotZ: 0.02,
      duration: 2.8,
      ease: 'sine.inOut'
    }, 6.6);

    tl.to(animObj, {
      stripY: 0.17,
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
              camera={{ position: [0.14, 0, 7.8], fov: 38 }}
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

        {/* 3. INTERACTIVE CINEMATIC TIMELINE CONTROLS */}
        <footer className="strips-interactive-controls">
          <button
            type="button"
            className="control-play-toggle"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="4" width="4" height="16" rx="1" />
                <rect x="15" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4l15 8-15 8V4z" />
              </svg>
            )}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <div className="control-stage-pills">
            {STAGES.map((s, idx) => {
              const isActive = idx === stageIndex;
              const seekTimes = [0.0, 2.2, 3.9, 5.3, 6.8];
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`stage-pill-button ${isActive ? 'is-active' : ''}`}
                  onClick={() => jumpToStage(seekTimes[idx])}
                >
                  <span className="pill-dot"></span>
                  <span className="pill-label">{s.eyebrow}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </div>
    </section>
  );
};

export default DemonicStrips;
