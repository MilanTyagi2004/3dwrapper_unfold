import React, { useState, useRef, useEffect } from 'react';
import './HeroSection.css';

export default function HeroSection() {
  const [awakenedSide, setAwakenedSide] = useState(null); // 'left' | 'right' | null
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const heroRef = useRef(null);
  const idleVideoARef = useRef(null);
  const idleVideoBRef = useRef(null);
  const leftAwakenVideoRef = useRef(null);
  const rightAwakenVideoRef = useRef(null);

  const [activeIdleLayer, setActiveIdleLayer] = useState('A'); // 'A' | 'B'
  const activeIdleLayerRef = useRef('A');
  const isCrossfadingRef = useRef(false);
  const [layers, setLayers] = useState({
    A: { opacity: 1, zIndex: 1, transition: 'none' },
    B: { opacity: 0, zIndex: 2, transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  });

  const resetTimeoutRef = useRef(null);
  const fadeIntervalsRef = useRef([]);

  const isInViewRef = useRef(true);
  const awakenedSideRef = useRef(null);
  const isMutedRef = useRef(true);
  const hasUserUnlockedRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Helper getters for active/inactive idle videos
  const getActiveIdleVideo = () => (activeIdleLayerRef.current === 'A' ? idleVideoARef.current : idleVideoBRef.current);
  const getInactiveIdleVideo = () => (activeIdleLayerRef.current === 'A' ? idleVideoBRef.current : idleVideoARef.current);
  const getAllIdleVideos = () => [idleVideoARef.current, idleVideoBRef.current].filter(Boolean);


  // Unmute and play ambient audio with volume
  const unmuteAndPlay = () => {
    fadeIntervalsRef.current.forEach(clearInterval);
    fadeIntervalsRef.current = [];

    isMutedRef.current = false;
    setIsMuted(false);

    const activeVid = getActiveIdleVideo();
    const inactiveVid = getInactiveIdleVideo();

    if (activeVid) {
      activeVid.muted = awakenedSideRef.current !== null;
      activeVid.volume = 0.85;
      activeVid.play().catch(() => {});
    }
    if (inactiveVid) {
      inactiveVid.muted = true;
    }

    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.muted = awakenedSideRef.current !== 'left';
      leftAwakenVideoRef.current.volume = 0.9;
      if (awakenedSideRef.current === 'left' && leftAwakenVideoRef.current.paused) leftAwakenVideoRef.current.play().catch(() => {});
    }
    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.muted = awakenedSideRef.current !== 'right';
      rightAwakenVideoRef.current.volume = 0.9;
      if (awakenedSideRef.current === 'right' && rightAwakenVideoRef.current.paused) rightAwakenVideoRef.current.play().catch(() => {});
    }
  };

  // Mute audio completely with a smooth fade out
  const muteAudio = () => {
    isMutedRef.current = true;
    setIsMuted(true);

    const fadeDuration = 800; // ms
    const fadeSteps = 20;
    const stepTime = fadeDuration / fadeSteps;

    [idleVideoARef.current, idleVideoBRef.current, leftAwakenVideoRef.current, rightAwakenVideoRef.current].forEach(video => {
      if (video && !video.muted && video.volume > 0) {
        const startVolume = video.volume;
        const volumeStep = startVolume / fadeSteps;
        let currentStep = 0;

        const interval = setInterval(() => {
          if (!video) {
            clearInterval(interval);
            return;
          }
          currentStep++;
          if (currentStep >= fadeSteps || !isMutedRef.current) {
            if (isMutedRef.current) {
              video.volume = 0;
              video.muted = true;
              if (!isInViewRef.current) video.pause();
            }
            clearInterval(interval);
          } else {
            video.volume = Math.max(0, startVolume - (volumeStep * currentStep));
          }
        }, stepTime);
        fadeIntervalsRef.current.push(interval);
      } else if (video) {
        video.muted = true;
        if (!isInViewRef.current) video.pause();
      }
    });
  };

  useEffect(() => {
    awakenedSideRef.current = awakenedSide;
    if (!isMutedRef.current && isInViewRef.current) {
      const activeVid = getActiveIdleVideo();
      const inactiveVid = getInactiveIdleVideo();
      if (activeVid) activeVid.muted = awakenedSide !== null;
      if (inactiveVid) inactiveVid.muted = true;

      if (leftAwakenVideoRef.current) leftAwakenVideoRef.current.muted = awakenedSide !== 'left';
      if (rightAwakenVideoRef.current) rightAwakenVideoRef.current.muted = awakenedSide !== 'right';
    }
  }, [awakenedSide]);

  useEffect(() => {
    // 1. GUARANTEED IMMEDIATE AUTOPLAY (Layer A starts immediately):
    if (idleVideoARef.current) {
      idleVideoARef.current.defaultMuted = true;
      idleVideoARef.current.muted = true;
      idleVideoARef.current.play().catch(() => {});
    }

    if (idleVideoBRef.current) {
      idleVideoBRef.current.defaultMuted = true;
      idleVideoBRef.current.muted = true;
      idleVideoBRef.current.currentTime = 0;
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
      const activeVid = idleVideoARef.current;
      if (!activeVid) return;
      activeVid.muted = false;
      activeVid.volume = 0.85;
      const p = activeVid.play();
      if (p !== undefined) {
        p.then(() => {
          hasUserUnlockedRef.current = true;
          isMutedRef.current = false;
          setIsMuted(false);
        }).catch(() => {
          if (activeVid) {
            activeVid.muted = true;
            activeVid.play().catch(() => {});
          }
          isMutedRef.current = true;
          setIsMuted(true);
        });
      }
    };

    const idleEl = idleVideoARef.current;
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
          if (!inView) {
            muteAudio();
            getAllIdleVideos().forEach(v => { if (!v.paused) v.pause(); });
          }
          return;
        }

        if (!inView) {
          muteAudio();
          getAllIdleVideos().forEach(v => { if (!v.paused) v.pause(); });
          if (leftAwakenVideoRef.current && !leftAwakenVideoRef.current.paused) {
            leftAwakenVideoRef.current.pause();
          }
          if (rightAwakenVideoRef.current && !rightAwakenVideoRef.current.paused) {
            rightAwakenVideoRef.current.pause();
          }
        } else {
          const activeVid = getActiveIdleVideo();
          if (activeVid && activeVid.paused) activeVid.play().catch(() => {});
          if (hasUserUnlockedRef.current && !isMutedRef.current) {
            unmuteAndPlay();
          }
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

  // Synchronize active layer ref
  useEffect(() => {
    activeIdleLayerRef.current = activeIdleLayer;
  }, [activeIdleLayer]);

  // Dual-Video Seamless Zero-Dip Stacking Engine
  // One video remains 100% solid while incoming video dissolves in ON TOP over 1.4s
  useEffect(() => {
    let animationFrameId;
    const CROSSFADE_TRIGGER_TIME = 1.9; // Trigger 1.9s before video ends (at ~8.1s)
    const FADE_DURATION_MS = 1400; // Ultra-smooth 1.4s cinematic melt

    const runSeamlessCrossfadeLoop = () => {
      const isLayerA = activeIdleLayerRef.current === 'A';
      const activeVid = isLayerA ? idleVideoARef.current : idleVideoBRef.current;
      const nextVid = isLayerA ? idleVideoBRef.current : idleVideoARef.current;

      if (activeVid && !activeVid.paused && activeVid.duration && !isCrossfadingRef.current && nextVid) {
        const timeLeft = activeVid.duration - activeVid.currentTime;

        if (timeLeft <= CROSSFADE_TRIGGER_TIME) {
          isCrossfadingRef.current = true;
          const nextLayerKey = isLayerA ? 'B' : 'A';
          const activeLayerKey = isLayerA ? 'A' : 'B';

          // 1. Start incoming video at 0.1 to guarantee a fully decoded active frame
          nextVid.currentTime = 0.1;
          nextVid.playbackRate = 1.0;

          if (!isMutedRef.current && awakenedSideRef.current === null) {
            nextVid.muted = false;
            nextVid.volume = 0;
          } else {
            nextVid.muted = true;
          }

          const playPromise = nextVid.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }

          // 2. Pre-roll 50ms before initiating visual dissolve, so incoming video is actively rolling frames
          setTimeout(() => {
            // STACK FADE: Next video dissolves smoothly in on TOP (zIndex: 2), while active video stays 100% solid (zIndex: 1)
            setLayers({
              [activeLayerKey]: { opacity: 1, zIndex: 1, transition: 'none' },
              [nextLayerKey]: { opacity: 1, zIndex: 2, transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)' },
            });

            // Audio crossfade
            if (!isMutedRef.current && awakenedSideRef.current === null) {
              const steps = 15;
              const stepTime = FADE_DURATION_MS / steps;
              let currentStep = 0;
              const audioInterval = setInterval(() => {
                currentStep++;
                const progress = Math.min(1, currentStep / steps);
                if (activeVid) activeVid.volume = Math.max(0, 0.85 * (1 - progress));
                if (nextVid) nextVid.volume = Math.min(0.85, 0.85 * progress);
                if (currentStep >= steps) clearInterval(audioInterval);
              }, stepTime);
            }

            // Once incoming video has completely covered the outgoing video, pause & clean up
            setTimeout(() => {
              if (activeVid) {
                activeVid.pause();
                activeVid.currentTime = 0.1;
                activeVid.muted = true;
                activeVid.volume = 0;
              }

              // Swap roles for next turn
              setLayers({
                [nextLayerKey]: { opacity: 1, zIndex: 1, transition: 'none' },
                [activeLayerKey]: { opacity: 0, zIndex: 2, transition: 'none' },
              });

              activeIdleLayerRef.current = nextLayerKey;
              setActiveIdleLayer(nextLayerKey);
              isCrossfadingRef.current = false;
            }, FADE_DURATION_MS + 60);
          }, 50);
        }
      }

      animationFrameId = requestAnimationFrame(runSeamlessCrossfadeLoop);
    };

    animationFrameId = requestAnimationFrame(runSeamlessCrossfadeLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleWorkerEnter = (side, e) => {
    // Fix for Mobile/iOS: Ignore touch hover
    if (e && e.type === 'pointerenter' && e.pointerType !== 'mouse') return;

    setIsHovered(true);
    hasUserUnlockedRef.current = true;
    
    if (awakenedSide || !leftAwakenVideoRef.current || !rightAwakenVideoRef.current) return;

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    // Mute idle audio and apply slow-mo to idle videos during worker awakening
    getAllIdleVideos().forEach(v => {
      v.muted = true;
      v.playbackRate = 0.4;
    });

    const targetVideo = side === 'left' ? leftAwakenVideoRef.current : rightAwakenVideoRef.current;
    
    targetVideo.muted = false;
    targetVideo.volume = 0.9;
    targetVideo.playbackRate = 0.6; // Start awaken video in slow motion too

    const playPromise = targetVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAwakenedSide(side);
          isMutedRef.current = false;
          setIsMuted(false);
          
          // Restore normal speed after the crossfade completes
          setTimeout(() => {
            if (targetVideo) targetVideo.playbackRate = 1.0;
            getAllIdleVideos().forEach(v => {
              v.playbackRate = 1.0;
            });
          }, 450);
        })
        .catch(() => {
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
    // If we've already started the end transition, do nothing
    if (awakenedSideRef.current === null) return;
    
    setAwakenedSide(null);

    // Apply slow-mo during the fade-out transition
    if (leftAwakenVideoRef.current) {
      leftAwakenVideoRef.current.muted = true;
      leftAwakenVideoRef.current.playbackRate = 0.5;
    }
    if (rightAwakenVideoRef.current) {
      rightAwakenVideoRef.current.muted = true;
      rightAwakenVideoRef.current.playbackRate = 0.5;
    }
    
    const activeVid = getActiveIdleVideo();
    if (activeVid) {
      activeVid.muted = isMutedRef.current;
      activeVid.playbackRate = 0.6; // Smoothly ease back into idle
    }

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      if (leftAwakenVideoRef.current) {
        leftAwakenVideoRef.current.currentTime = 0;
        leftAwakenVideoRef.current.playbackRate = 1.0;
      }
      if (rightAwakenVideoRef.current) {
        rightAwakenVideoRef.current.currentTime = 0;
        rightAwakenVideoRef.current.playbackRate = 1.0;
      }
      getAllIdleVideos().forEach(v => {
        v.playbackRate = 1.0;
      });
    }, 450);
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    // Trigger transition 0.4 seconds BEFORE the video physically ends.
    if (video.duration && video.duration - video.currentTime <= 0.4) {
      handleAwakenEnded();
    }
  };

  const scrollToStrips = (e) => {
    e.preventDefault();
    document.getElementById('strips')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section" id="hero" ref={heroRef}>
      {/* Background Video (Seamless Dual-Buffer Infinite Crossfade) */}
      <div className="hero__video-container">
        <video
          ref={idleVideoARef}
          src="/assets/brand/hero_bg_video.mp4"
          className="hero__video hero__video--idle"
          style={{
            opacity: layers.A.opacity,
            zIndex: layers.A.zIndex,
            transition: layers.A.transition,
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
        />

        <video
          ref={idleVideoBRef}
          src="/assets/brand/hero_bg_video.mp4"
          className="hero__video hero__video--idle"
          style={{
            opacity: layers.B.opacity,
            zIndex: layers.B.zIndex,
            transition: layers.B.transition,
          }}
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
          preload="none"
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Awaken Video: Right Worker */}
        <video
          ref={rightAwakenVideoRef}
          src="/assets/brand/right_worker.mp4"
          className={`hero__video hero__video--awaken ${awakenedSide === 'right' ? 'hero__video--active' : ''}`}
          muted={awakenedSide !== 'right' || isMuted}
          playsInline
          preload="none"
          onTimeUpdate={handleTimeUpdate}
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
          <span className="hero__badge-text">DF LABS // CAFFEINE REENGINEERED</span>
        </div>

        <h1 className="hero__title">
          DEMONIC FUEL
        </h1>

        <p className="hero__subtitle">
          Caffeine engineered for people who take their obsession seriously. Rapid absorption, zero crash, unreal obsession.
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
