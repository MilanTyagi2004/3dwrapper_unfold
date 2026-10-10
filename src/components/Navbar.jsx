import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`nav navbar ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        {/* Brand Logo & Signature Icon */}
        <a 
          href="#strips" 
          className="nav__brand" 
          onClick={(e) => scrollToSection(e, 'strips')}
          aria-label="Demonic Fuel Home"
        >
          <img 
            src="/assets/brand/demonic_eye_red_cream.png" 
            alt="Demonic Fuel Official Emblem" 
            className="nav__icon"
          />
          <div className="nav__title-group">
            <span className="nav__title">DEMONIC FUEL</span>
            <span className="nav__tagline">EST. 2026 // FOR THE OBSESSED</span>
          </div>
        </a>

        {/* Minimal Editorial Navigation Links */}
        <div className="nav__links nav-links">
          <a 
            href="#strips" 
            className="nav__link" 
            onClick={(e) => scrollToSection(e, 'strips')}
          >
            <span className="nav__num">01</span>
            <span className="nav__label">OUR PRODUCT</span>
          </a>
          <a 
            href="#faq" 
            className="nav__link" 
            onClick={(e) => scrollToSection(e, 'faq')}
          >
            <span className="nav__num">02</span>
            <span className="nav__label">FAQ</span>
          </a>
          <a 
            href="#founder-pass" 
            className="nav__link" 
            onClick={(e) => scrollToSection(e, 'founder-pass')}
          >
            <span className="nav__num">03</span>
            <span className="nav__label">EARLY ACCESS</span>
          </a>
        </div>

        {/* Status Badge & Minimal CTA */}
        <div className="nav__action">
          <div className="nav__status">
            <span className="nav__status-dot" />
            <span className="nav__status-text">BATCH 001 // ACTIVE</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
