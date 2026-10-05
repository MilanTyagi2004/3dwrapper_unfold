import React, { useState, useRef, useEffect } from 'react';
import './HeroSection.css';

export default function HeroSection() {
  const [isAwakened, setIsAwakened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const idleVideoRef = useRef(null);
  const awakenVideoRef = useRef(null);

  const resetTimeoutRef = useRef(null);
  const endHoldTimeoutRef = useRef(null);

  useEffect(() => {
    idleVideoRef.current?.play().catch(() => {});
    if (awakenVideoRef.current) {
      awakenVideoRef.current.currentTime = 0;
    }
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (endHoldTimeoutRef.current) clearTimeout(endHoldTimeoutRef.current);
    };
  }, []);

  const handleWorkerEnter = () => {
    setIsHovered(true);
    if (isAwakened || !awakenVideoRef.current) return;

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    if (endHoldTimeoutRef.current) clearTimeout(endHoldTimeoutRef.current);

    const playPromise = awakenVideoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsAwakened(true);
        })
        .catch(() => {});
    }
  };

  const handleWorkerLeave = () => {
    setIsHovered(false);
  };

  const handleAwakenEnded = () => {
    // Video has naturally returned the worker's gaze back down to the strips
    setIsAwakened(false);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      if (awakenVideoRef.current) {
        awakenVideoRef.current.currentTime = 0;
      }
    }, 800);
  };

  const scrollToStrips = (e) => {
    e.preventDefault();
    document.getElementById('strips')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section" id="hero">
      {/* Background Video Layer 1: Seamless Ping-Pong Idle Loop */}
      <div className="hero__video-container">
        <video
          ref={idleVideoRef}
          src="/assets/brand/demon_worker_idle.mp4?v=vivid_smooth"
          className="hero__video hero__video--idle"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* Background Video Layer 2: Natural Awaken & Return Sequence */}
        <video
          ref={awakenVideoRef}
          src="/assets/brand/demon_worker_awaken_pingpong.mp4?v=natural_return"
          className={`hero__video hero__video--awaken ${isAwakened ? 'hero__video--active' : ''}`}
          muted
          playsInline
          preload="auto"
          onEnded={handleAwakenEnded}
        />
      </div>

      {/* Atmospheric Cinematic Overlays */}
      <div className="hero__vignette" />
      <div className="hero__scanlines" />

      {/* Targeted Demon Worker Hotspot (Invisible Interactive Area) */}
      <div
        className="hero__hotspot"
        onMouseEnter={handleWorkerEnter}
        onMouseLeave={handleWorkerLeave}
        onClick={handleWorkerEnter}
        role="button"
        tabIndex={0}
        aria-label="Interact with Demon Worker"
      />

      {/* Editorial Content Overlay (Refined, Tech-Noir Aesthetic) */}
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          <span className="hero__badge-text">FACILITY 06 // BRED IN DARKNESS</span>
        </div>

        <h1 className="hero__title">
          DEMONIC FUEL
        </h1>

        <p className="hero__subtitle">
          Sublingual energy engineered in the shadows. Rapid mucosal absorption, zero crash, unholy potency.
        </p>

        <div className="hero__actions">
          <a href="#strips" className="hero__cta" onClick={scrollToStrips}>
            <span>INSPECT FORMULATION</span>
            <span className="hero__cta-arrow">↓</span>
          </a>
        </div>
      </div>

      {/* Minimal Bottom Scroll Cue */}
      <a href="#strips" className="hero__scroll-cue" onClick={scrollToStrips} aria-label="Scroll to explore">
        <span className="scroll-cue__text">ENTER RESEARCH CHAMBER</span>
        <div className="scroll-cue__line">
          <span className="scroll-cue__indicator" />
        </div>
      </a>
    </section>
  );
}
