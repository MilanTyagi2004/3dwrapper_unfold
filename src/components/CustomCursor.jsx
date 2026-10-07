import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    // Disable completely on mobile / touch devices
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    if (isTouch) return;

    let mouseX = -100;
    let mouseY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;

    let dotX = -100;
    let dotY = -100;

    let ringX = -100;
    let ringY = -100;

    let trailX = -100;
    let trailY = -100;

    let smoothSpeed = 0;
    let isVisible = false;
    let isInitialized = false;
    let isInteractive = false;

    let rafId = null;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isInitialized) {
        dotX = mouseX;
        dotY = mouseY;
        ringX = mouseX;
        ringY = mouseY;
        trailX = mouseX;
        trailY = mouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        isInitialized = true;
      }

      isVisible = true;

      // Check if hovering over interactive elements for reactive cursor swell
      const target = e.target;
      if (
        target &&
        (target.closest('a, button, input, select, textarea, [role="button"], .ec__card-stage, .ec__card, .hero__cta, .hero__hotspot') ||
          window.getComputedStyle(target).cursor === 'pointer' ||
          window.getComputedStyle(target).cursor === 'grab')
      ) {
        isInteractive = true;
      } else {
        isInteractive = false;
      }
    };

    const onMouseEnter = () => {
      isVisible = true;
    };

    const onMouseLeave = () => {
      isVisible = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);

    // Inertia physics factors
    const LERP_DOT = 0.88;   // Immediate follow for crisp center indicator
    const LERP_RING = 0.26;  // Delicate fluid inertia for main ring
    const LERP_TRAIL = 0.14; // Trailing fluid lag for atmospheric glow

    const animate = () => {
      if (isInitialized) {
        // Calculate instantaneous speed
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;

        const instantSpeed = Math.sqrt(dx * dx + dy * dy);
        smoothSpeed += (instantSpeed - smoothSpeed) * 0.14;

        // Smooth position updates with inertia
        dotX += (mouseX - dotX) * LERP_DOT;
        dotY += (mouseY - dotY) * LERP_DOT;

        ringX += (mouseX - ringX) * LERP_RING;
        ringY += (mouseY - ringY) * LERP_RING;

        trailX += (mouseX - trailX) * LERP_TRAIL;
        trailY += (mouseY - trailY) * LERP_TRAIL;

        // Dynamic trail opacity: always active atmospheric aura (min 0.38, blooms up to 0.82)
        const motionFactor = Math.min(1, smoothSpeed / 10);
        const trailOpacity = isVisible ? (0.38 + motionFactor * 0.44) : 0;
        const ringOpacity = isVisible ? (0.72 + motionFactor * 0.24) : 0;
        const baseOpacity = isVisible ? 1 : 0;

        // Scale adjustments: interactive expansion & motion stretch
        const ringScale = isInteractive ? 1.45 : (1 + motionFactor * 0.15);
        const trailScale = isInteractive ? 1.35 : (1 + motionFactor * 0.35);

        // Direct hardware-accelerated DOM transforms
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
          dotRef.current.style.opacity = `${baseOpacity}`;
        }

        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${ringScale})`;
          ringRef.current.style.opacity = `${ringOpacity}`;
          if (isInteractive) {
            ringRef.current.classList.add('custom-cursor__ring--interactive');
          } else {
            ringRef.current.classList.remove('custom-cursor__ring--interactive');
          }
        }

        if (trailRef.current) {
          trailRef.current.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) scale(${trailScale})`;
          trailRef.current.style.opacity = `${trailOpacity}`;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div className="custom-cursor-root" aria-hidden="true">
      {/* Persistent atmospheric trail glow */}
      <div ref={trailRef} className="custom-cursor__trail" />
      {/* Inertial delicate ring */}
      <div ref={ringRef} className="custom-cursor__ring" />
      {/* Crisp point indicator */}
      <div ref={dotRef} className="custom-cursor__dot" />
    </div>
  );
}
