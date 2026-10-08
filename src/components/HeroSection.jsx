import React, { useState, useRef, useEffect } from 'react';
import './HeroSection.css';

export default function HeroSection() {
  const [awakenedSide, setAwakenedSide] = useState(null); // 'left' | 'right' | null
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const heroRef = useRef(null);
  const idleVideoRef = useRef(null);
  const leftAwakenVideoRef = useRef(null);
  const rightAwakenVideoRef = useRef(null);

  const resetTimeoutRef = useRef(null);

  const isInViewRef = useRef(true);
  const awakenedSideRef = useRef(null);
  const isMutedRef = useRef(true);
  const hasUserUnlockedRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Unmute and play ambient audio with volume
  const unmuteAndPlay = () => {
    isMutedRef.current = false;
    setIsMuted(false);

    if (idleVideoRef.current) {
      idleVideoRef.current.muted = awakenedSideRef.current !== null;
      idleVideoRef.current.volume = 0.85;
      idleVideoRef.current.play().catch(() => {});
    }

    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.muted = awakenedSideRef.current !== 'left';
      leftAwakenVideoRef.current.volume = 0.9;
    }
    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.muted = awakenedSideRef.current !== 'right';
      rightAwakenVideoRef.current.volume = 0.9;
    }
  };

  // Mute audio completely
  const muteAudio = () => {
    isMutedRef.current = true;
    setIsMuted(true);

    if (idleVideoRef.current) {
      idleVideoRef.current.muted = true;
    }
    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.muted = true;
    }
    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.muted = true;
    }
  };

  useEffect(() => {
    awakenedSideRef.current = awakenedSide;
    if (!isMutedRef.current && isInViewRef.current) {
      if (idleVideoRef.current) idleVideoRef.current.muted = awakenedSide !== null;
      if (leftAwakenVideoRef.current) leftAwakenVideoRef.current.muted = awakenedSide !== 'left';
      if (rightAwakenVideoRef.current) rightAwakenVideoRef.current.muted = awakenedSide !== 'right';
    }
  }, [awakenedSide]);

  useEffect(() => {
    // 1. GUARANTEED IMMEDIATE AUTOPLAY:
    if (idleVideoRef.current) {
      idleVideoRef.current.defaultMuted = true;
      idleVideoRef.current.muted = true;
      idleVideoRef.current.play().catch(() => {});
    }

    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.currentTime = 0;
      leftAwakenVideoRef.current.defaultMuted = true;
      leftAwakenVideoRef.current.muted = true;
    }

    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.currentTime = 0;
      rightAwakenVideoRef.current.defaultMuted = true;
      rightAwakenVideoRef.current.muted = true;
    }

    // 2. Safe check: Test if browser permits unmuted audio on cold load
    const testColdAutoplay = () => {
      if (!idleVideoRef.current) return;
      idleVideoRef.current.muted = false;
      idleVideoRef.current.volume = 0.85;
      const p = idleVideoRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          hasUserUnlockedRef.current = true;
          isMutedRef.current = false;
          setIsMuted(false);
        }).catch(() => {
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

    // 3. Global listener: Unmute on first user gesture anywhere on page
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

    // 4. Viewport IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const inView = Boolean(entry.isIntersecting && entry.intersectionRatio > 0.05);
        isInViewRef.current = inView;

        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
          return;
        }

        if (!inView) {
          muteAudio();
        } else {
          unmuteAndPlay();
        }
      },
      { threshold: [0, 0.05, 0.2] }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    // 5. Tab visibility change
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
    };
  }, []);

  // Infinite seamless loop fix
  useEffect(() => {
    const video = idleVideoRef.current;
    if (!video) return;

    let animationFrameId;

    const enforceSeamlessLoop = () => {
      if (video.duration && !video.paused) {
        // Skip the last 0.85 seconds to bypass the baked-in black frames from the video cutter
        if (video.duration - video.currentTime <= 0.85) {
          video.currentTime = 0.05; // instantly snap back to start
        }
      }
      animationFrameId = requestAnimationFrame(enforceSeamlessLoop);
    };

    const handlePlay = () => {
      cancelAnimationFrame(animationFrameId);
      enforceSeamlessLoop();
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (!video.paused) {
      enforceSeamlessLoop();
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleWorkerEnter = (side, e) => {
    // Fix for Mobile/iOS: Touch devices fire pointerenter BEFORE click, but pointerenter lacks 
    // user-gesture permissions to play unmuted video. This caused the video to fail playing 
    // but state to update, breaking the subsequent click. We ignore touch hover and rely on click.
    if (e && e.type === 'pointerenter' && e.pointerType !== 'mouse') return;

    setIsHovered(true);
    hasUserUnlockedRef.current = true;
    
    // If a side is already awakened, ignore
    if (awakenedSide || !leftAwakenVideoRef.current || !rightAwakenVideoRef.current) return;

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    // Mute idle audio so awaken video plays cleanly
    if (idleVideoRef.current) {
      idleVideoRef.current.muted = true;
    }

    const targetVideo = side === 'left' ? leftAwakenVideoRef.current : rightAwakenVideoRef.current;
    
    targetVideo.muted = false;
    targetVideo.volume = 0.9;

    const playPromise = targetVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAwakenedSide(side);
          isMutedRef.current = false;
          setIsMuted(false);
        })
        .catch(() => {
          // Fallback if browser still blocks audio: play muted to prevent UI freeze
          targetVideo.muted = true;
          targetVideo.play().catch(()=>{});
          setAwakenedSide(side);
        });
    }
  };

  const handleWorkerLeave = () => {
    setIsHovered(false);
  };

  const handleAwakenEnded = () => {
    setAwakenedSide(null);

    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.muted = true;
    }
    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.muted = true;
    }
    if (idleVideoRef.current) {
      idleVideoRef.current.muted = isMutedRef.current;
    }

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      if (leftAwakenVideoRef.current) leftAwakenVideoRef.current.currentTime = 0;
      if (rightAwakenVideoRef.current) rightAwakenVideoRef.current.currentTime = 0;
    }, 350);
  };

  const scrollToStrips = (e) => {
    e.preventDefault();
    document.getElementById('strips')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section" id="hero" ref={heroRef}>
      {/* Background Video */}
      <div className="hero__video-container">
        <video
          ref={idleVideoRef}
          src="/assets/brand/hero_bg_video.mp4"
          className="hero__video hero__video--idle"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* Awaken Video: Left Worker */}
        <video
          ref={leftAwakenVideoRef}
          src="/assets/brand/left_worker.mp4"
          className={`hero__video hero__video--awaken ${awakenedSide === 'left' ? 'hero__video--active' : ''}`}
          muted={awakenedSide !== 'left' || isMuted}
          playsInline
          preload="auto"
          onEnded={handleAwakenEnded}
        />

        {/* Awaken Video: Right Worker */}
        <video
          ref={rightAwakenVideoRef}
          src="/assets/brand/right_worker.mp4"
          className={`hero__video hero__video--awaken ${awakenedSide === 'right' ? 'hero__video--active' : ''}`}
          muted={awakenedSide !== 'right' || isMuted}
          playsInline
          preload="auto"
          onEnded={handleAwakenEnded}
        />
      </div>

      {/* Atmospheric Cinematic Overlays */}
      <div className="hero__vignette" />
      <div className="hero__scanlines" />

      {/* Targeted Demon Worker Hotspots (Invisible Interactive Areas) */}
      <div
        className="hero__hotspot hero__hotspot--left"
        onPointerEnter={(e) => handleWorkerEnter('left', e)}
        onPointerLeave={handleWorkerLeave}
        onClick={(e) => handleWorkerEnter('left', e)}
        role="button"
        tabIndex={0}
        aria-label="Interact with Left Demon Worker"
      />
      <div
        className="hero__hotspot hero__hotspot--right"
        onPointerEnter={(e) => handleWorkerEnter('right', e)}
        onPointerLeave={handleWorkerLeave}
        onClick={(e) => handleWorkerEnter('right', e)}
        role="button"
        tabIndex={0}
        aria-label="Interact with Right Demon Worker"
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
