import React, { useState, useRef, useEffect } from 'react';
import './HeroSection.css';

export default function HeroSection() {
  const [isAwakened, setIsAwakened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const heroRef = useRef(null);
  const idleVideoRef = useRef(null);
  const awakenVideoRef = useRef(null);

  const resetTimeoutRef = useRef(null);
  const endHoldTimeoutRef = useRef(null);

  const isInViewRef = useRef(true);
  const isAwakenedRef = useRef(false);
  const isMutedRef = useRef(true);
  const hasUserUnlockedRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Unmute and play ambient audio with volume
  const unmuteAndPlay = () => {
    isMutedRef.current = false;
    setIsMuted(false);

    if (idleVideoRef.current) {
      idleVideoRef.current.muted = isAwakenedRef.current;
      idleVideoRef.current.volume = 0.85;
      idleVideoRef.current.play().catch(() => {});
    }

    if (awakenVideoRef.current) {
      awakenVideoRef.current.muted = !isAwakenedRef.current;
      awakenVideoRef.current.volume = 0.9;
    }
  };

  // Mute audio completely
  const muteAudio = () => {
    isMutedRef.current = true;
    setIsMuted(true);

    if (idleVideoRef.current) {
      idleVideoRef.current.muted = true;
    }
    if (awakenVideoRef.current) {
      awakenVideoRef.current.muted = true;
    }
  };


  useEffect(() => {
    isAwakenedRef.current = isAwakened;
    if (!isMutedRef.current && isInViewRef.current) {
      if (idleVideoRef.current) idleVideoRef.current.muted = isAwakened;
      if (awakenVideoRef.current) awakenVideoRef.current.muted = !isAwakened;
    }
  }, [isAwakened]);

  useEffect(() => {
    // 1. GUARANTEED IMMEDIATE AUTOPLAY:
    // Start idle video strictly muted so all browsers instantly autoplay on load with ZERO click!
    if (idleVideoRef.current) {
      idleVideoRef.current.defaultMuted = true;
      idleVideoRef.current.muted = true;
      idleVideoRef.current.play().catch(() => {});
    }

    if (awakenVideoRef.current) {
      awakenVideoRef.current.currentTime = 0;
      awakenVideoRef.current.defaultMuted = true;
      awakenVideoRef.current.muted = true;
    }

    // 2. Safe check: Test if browser permits unmuted audio on cold load (e.g. MEI index allows it)
    const testColdAutoplay = () => {
      if (!idleVideoRef.current) return;
      idleVideoRef.current.muted = false;
      idleVideoRef.current.volume = 0.85;
      const p = idleVideoRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          // Browser permitted immediate sound!
          hasUserUnlockedRef.current = true;
          isMutedRef.current = false;
          setIsMuted(false);
        }).catch(() => {
          // Autoplay policy prevented sound: safely keep running muted so video NEVER freezes!
          if (idleVideoRef.current) {
            idleVideoRef.current.muted = true;
            idleVideoRef.current.play().catch(() => {});
          }
          isMutedRef.current = true;
          setIsMuted(true);
        });
      }
    };

    const idleEl = idleVideoRef.current;
    if (idleEl) {
      idleEl.addEventListener('playing', testColdAutoplay, { once: true });
    }

    // 3. Global listener: Unmute on first user gesture anywhere on page (click, tap, pointerdown, key)
    const interactionEvents = ['pointerdown', 'click', 'touchstart', 'keydown', 'mousedown'];
    const handleFirstInteraction = () => {
      hasUserUnlockedRef.current = true;
      if (isInViewRef.current) {
        unmuteAndPlay();
      }
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleFirstInteraction);
      });
    };

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleFirstInteraction, { passive: true });
    });

    // 4. Viewport IntersectionObserver: Automatically MUTE when scrolled away, UNMUTE when on screen!
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const inView = Boolean(entry.isIntersecting && entry.intersectionRatio > 0.05);
        isInViewRef.current = inView;

        // Skip on initial mount to avoid premature unmuted playback triggers
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
          return;
        }

        if (!inView) {
          muteAudio();
        } else {
          // Hero is on screen -> automatically play audio!
          unmuteAndPlay();
        }
      },
      { threshold: [0, 0.05, 0.2] }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    // 5. Tab visibility change: Mute when user leaves tab, unmute when returning
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        muteAudio();
      } else if (isInViewRef.current && hasUserUnlockedRef.current) {
        unmuteAndPlay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (idleEl) {
        idleEl.removeEventListener('playing', testColdAutoplay);
      }
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleFirstInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (endHoldTimeoutRef.current) clearTimeout(endHoldTimeoutRef.current);
    };
  }, []);

  const handleWorkerEnter = () => {
    setIsHovered(true);
    hasUserUnlockedRef.current = true;
    if (isAwakened || !awakenVideoRef.current) return;

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    if (endHoldTimeoutRef.current) clearTimeout(endHoldTimeoutRef.current);

    // Mute idle audio so awaken video plays cleanly
    if (idleVideoRef.current) {
      idleVideoRef.current.muted = true;
    }
    if (awakenVideoRef.current) {
      awakenVideoRef.current.muted = false;
      awakenVideoRef.current.volume = 0.9;
    }

    const playPromise = awakenVideoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsAwakened(true);
          isMutedRef.current = false;
          setIsMuted(false);
        })
        .catch(() => { });
    }
  };

  const handleWorkerLeave = () => {
    setIsHovered(false);
  };

  const handleAwakenEnded = () => {
    // Video has naturally returned the worker's gaze back down to the strips
    setIsAwakened(false);

    if (awakenVideoRef.current) {
      awakenVideoRef.current.muted = true;
    }
    if (idleVideoRef.current) {
      idleVideoRef.current.muted = isMutedRef.current;
    }

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
    <section className="hero-section" id="hero" ref={heroRef}>
      {/* Background Video Layer 1: Seamless Ping-Pong Idle Loop with Demonic Audio */}
      <div className="hero__video-container">
        <video
          ref={idleVideoRef}
          src="/assets/brand/demon_worker_idle.mp4?v=ambient_audio_v4"
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
          src="/assets/brand/demon_worker_awaken_pingpong.mp4?v=ambient_audio_v4"
          className={`hero__video hero__video--awaken ${isAwakened ? 'hero__video--active' : ''}`}
          muted={!isAwakened || isMuted}
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
