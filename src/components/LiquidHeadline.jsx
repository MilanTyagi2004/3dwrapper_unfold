import React, { useRef, useEffect, useMemo } from 'react';
import './LiquidHeadline.css';

/**
 * LiquidHeadline.jsx
 * Realistic Water / Liquid Displacement Interaction for Large Typography
 * 
 * Features:
 * - Fluid radial displacement field around cursor (falloff: 0-160px)
 * - Exact 3-tier falloff (<40px strong, 40-100px medium, 100-160px subtle, >160px none)
 * - Displacement vector: radially AWAY from cursor
 * - Surface tension spring-damper physics with fluid viscosity
 * - Subtle rotational swirl & buoyancy scale distortion (2-8px displacement, max ±2.5° rot, 1.03 scale)
 * - Direct GPU DOM transforms via requestAnimationFrame (Zero React state updates)
 * - Continuous responsiveness with shared global coordinates
 * - Complete touch/mobile disabling
 */

// Shared global mouse position tracker across all headline instances
const globalMouse = {
  x: -9999,
  y: -9999,
  active: false
};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'mousemove',
    (e) => {
      globalMouse.x = e.clientX;
      globalMouse.y = e.clientY;
      globalMouse.active = true;
    },
    { passive: true }
  );

  window.addEventListener(
    'mouseleave',
    () => {
      globalMouse.active = false;
      globalMouse.x = -9999;
      globalMouse.y = -9999;
    },
    { passive: true }
  );
}

function getLiquidFalloff(dist) {
  if (dist >= 160) return 0;
  if (dist <= 0) return 1;

  // Exact 3-zone smooth falloff:
  // < 40px: strong displacement (1.0 down to ~0.72)
  // 40px–100px: medium displacement (~0.72 down to ~0.22)
  // 100px–160px: very subtle displacement (~0.22 down to 0.0)
  // > 160px: no displacement (0.0)
  if (dist < 40) {
    const t = dist / 40;
    return 1.0 - 0.28 * (t * t);
  } else if (dist < 100) {
    const t = (dist - 40) / 60;
    const ease = t * t * (3 - 2 * t);
    return 0.72 - 0.50 * ease;
  } else {
    const t = (dist - 100) / 60;
    const remain = 1 - t;
    return 0.22 * (remain * remain);
  }
}

export default function LiquidHeadline({
  headline,
  isActive = true,
  className = 'editorial-headline',
  as: Tag = 'h3'
}) {
  const containerRef = useRef(null);
  const charRefs = useRef([]);
  const localCoordsRef = useRef([]); // Cached relative center of each character
  const physicsRef = useRef([]);     // Current state: { x, y, vx, vy, rot, vrot, scale, vscale }

  const isSleepingRef = useRef(false);
  const rafId = useRef(null);

  // Pre-parse headline into lines, words, and characters with continuous global indexing
  const parsed = useMemo(() => {
    let globalIdx = 0;
    const lines = headline.split('\n').map((lineText) => {
      const words = lineText.split(/\s+/).filter(Boolean).map((wordText) => {
        const chars = wordText.split('').map((c) => ({
          char: c,
          globalIdx: globalIdx++
        }));
        return { chars };
      });
      return { words };
    });

    return { lines, totalChars: globalIdx };
  }, [headline]);

  // Measure and cache character positions relative to untransformed container
  const measureCoords = () => {
    if (!containerRef.current) return;

    // Temporarily clear inline transforms so getBoundingClientRect returns true rest coordinates
    const savedTransforms = charRefs.current.map((el) => (el ? el.style.transform : ''));
    charRefs.current.forEach((el) => {
      if (el) el.style.transform = '';
    });

    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 && containerRect.height === 0) {
      // Element is hidden or not laid out yet
      return;
    }

    localCoordsRef.current = [];
    charRefs.current.forEach((el, idx) => {
      if (!el) {
        localCoordsRef.current[idx] = { x: 0, y: 0 };
        return;
      }
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - containerRect.left;
      const cy = rect.top + rect.height / 2 - containerRect.top;
      localCoordsRef.current[idx] = { x: cx, y: cy };
    });

    // Restore any active transforms
    charRefs.current.forEach((el, idx) => {
      if (el && savedTransforms[idx]) el.style.transform = savedTransforms[idx];
    });
  };

  useEffect(() => {
    // Disable on touch/mobile devices
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    if (isTouch) return;

    if (!isActive) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      charRefs.current.forEach((el) => {
        if (el) el.style.transform = '';
      });
      isSleepingRef.current = true;
      return;
    }

    // Reset physics arrays
    physicsRef.current = Array.from({ length: parsed.totalChars }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      vrot: 0,
      scale: 1,
      vscale: 0
    }));

    // Multi-stage measurements to adapt to CSS entrance animations & web font layout
    measureCoords();
    const t1 = setTimeout(measureCoords, 40);
    const t2 = setTimeout(measureCoords, 250);
    const t3 = setTimeout(measureCoords, 600);

    if (document.fonts) {
      document.fonts.ready.then(measureCoords).catch(() => {});
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        measureCoords();
      });
      ro.observe(containerRef.current);
    }

    const wakeUp = () => {
      if (isSleepingRef.current) {
        isSleepingRef.current = false;
        rafId.current = requestAnimationFrame(animateLoop);
      }
    };

    const handleMouseMove = () => {
      wakeUp();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', wakeUp, { passive: true });
    window.addEventListener('resize', measureCoords, { passive: true });

    // Physics constants
    const RADIUS = 160;   // Influence field radius in px
    const MAX_DISP = 7.5; // Max displacement in px (within 2-8px requested range)

    const animateLoop = () => {
      if (!isActive || !containerRef.current) {
        isSleepingRef.current = true;
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const cursorX = globalMouse.x;
      const cursorY = globalMouse.y;
      const isCursorActive = globalMouse.active;

      // Lazy measure if not yet captured
      if (localCoordsRef.current.length < parsed.totalChars) {
        measureCoords();
      }

      // Quick bounding box check: if cursor is far from heading, skip force calculation
      const inProximity =
        isCursorActive &&
        cursorX >= containerRect.left - RADIUS &&
        cursorX <= containerRect.right + RADIUS &&
        cursorY >= containerRect.top - RADIUS &&
        cursorY <= containerRect.bottom + RADIUS;

      let anyMotion = false;

      for (let i = 0; i < parsed.totalChars; i++) {
        const domEl = charRefs.current[i];
        if (!domEl) continue;

        const coords = localCoordsRef.current[i];
        if (!coords) continue;

        const state = physicsRef.current[i];
        if (!state) continue;

        // Global untransformed center of this character
        const charX = containerRect.left + coords.x;
        const charY = containerRect.top + coords.y;

        let targetX = 0;
        let targetY = 0;
        let targetRot = 0;
        let targetScale = 1.0;
        let force = 0;

        if (inProximity) {
          const dx = charX - cursorX;
          const dy = charY - cursorY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < RADIUS && dist > 0.001) {
            force = getLiquidFalloff(dist);

            // Unit direction vector away from cursor
            const nx = dx / dist;
            const ny = dy / dist;

            // Radial liquid displacement
            targetX = nx * MAX_DISP * force;
            targetY = ny * MAX_DISP * force;

            // Subtle liquid rotational swirl (tangential/shear effect)
            targetRot = (nx * 1.6 - ny * 1.2) * force * 1.5;

            // Subtle buoyancy pulse
            targetScale = 1.0 + 0.03 * force;
          }
        }

        // Fluid spring-damper dynamics
        const isPushing = force > 0.02;
        const stiffness = isPushing ? 0.12 : 0.055;
        const damping = isPushing ? 0.82 : 0.78;

        // Position X spring
        const fx = (targetX - state.x) * stiffness;
        state.vx = (state.vx + fx) * damping;
        state.x += state.vx;

        // Position Y spring
        const fy = (targetY - state.y) * stiffness;
        state.vy = (state.vy + fy) * damping;
        state.y += state.vy;

        // Rotation spring
        const fRot = (targetRot - state.rot) * stiffness;
        state.vrot = (state.vrot + fRot) * damping;
        state.rot += state.vrot;

        // Scale spring
        const fScale = (targetScale - state.scale) * stiffness;
        state.vscale = (state.vscale + fScale) * damping;
        state.scale += state.vscale;

        // Sleep test for this character
        const isResting =
          targetX === 0 &&
          targetY === 0 &&
          Math.abs(state.x) < 0.015 &&
          Math.abs(state.y) < 0.015 &&
          Math.abs(state.vx) < 0.015 &&
          Math.abs(state.vy) < 0.015;

        if (isResting) {
          state.x = 0;
          state.y = 0;
          state.vx = 0;
          state.vy = 0;
          state.rot = 0;
          state.scale = 1;
          domEl.style.transform = '';
        } else {
          anyMotion = true;
          // Apply hardware-accelerated GPU direct transform
          domEl.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rot.toFixed(2)}deg) scale(${state.scale.toFixed(3)})`;
        }
      }

      // If all characters have settled and cursor is stationary outside, put loop to sleep
      if (!anyMotion && !inProximity) {
        isSleepingRef.current = true;
      } else {
        rafId.current = requestAnimationFrame(animateLoop);
      }
    };

    isSleepingRef.current = false;
    rafId.current = requestAnimationFrame(animateLoop);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', wakeUp);
      window.removeEventListener('resize', measureCoords);
      charRefs.current.forEach((el) => {
        if (el) el.style.transform = '';
      });
    };
  }, [isActive, parsed]);

  return (
    <Tag ref={containerRef} className={`${className} liquid-headline-container`}>
      {parsed.lines.map((line, lIdx) => (
        <span key={lIdx} className="headline-line">
          {line.words.map((word, wIdx) => (
            <React.Fragment key={wIdx}>
              <span className="liquid-word">
                {word.chars.map((item) => (
                  <span
                    key={item.globalIdx}
                    ref={(el) => (charRefs.current[item.globalIdx] = el)}
                    className="liquid-char"
                  >
                    {item.char}
                  </span>
                ))}
              </span>
              {wIdx < line.words.length - 1 && (
                <span className="liquid-space" aria-hidden="true">
                  &nbsp;
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}
