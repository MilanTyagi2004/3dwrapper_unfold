import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openSections, setOpenSections] = useState({
    explore: false,
    product: false,
    company: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail) {
      setSubmitted(true);

      // Asynchronously insert into Supabase newsletter_subscribers table
      try {
        const { error } = await supabase.from('newsletter_subscribers').insert([
          { email: cleanEmail }
        ]);
        if (error) {
          console.warn('[Supabase] Newsletter subscription note:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] Newsletter subscription error:', err);
      }

      setTimeout(() => {
        setEmail('');
        setSubmitted(false);
      }, 3500);
    }
  };

  return (
    <footer className="footer" id="footer">
      {/* ── Mountain Edge Decoration Overlay (Strictly Outer Edges, 10-15% opacity) ── */}
      <div className="footer__mountain-overlay" aria-hidden="true" />

      {/* ── Top Dividing Hairline with Center Glowing Mini-Emblem ── */}
      <div className="footer__top-hairline-wrap">
        <div className="footer__hairline-left" />
        <div className="footer__hairline-center">
          <img
            src="/assets/brand/demonic_primary_red.png"
            alt="Demonic Fuel Crest"
            className="footer__hairline-emblem"
          />
        </div>
        <div className="footer__hairline-right" />
      </div>

      <div className="footer__inner">
        {/* ── Main Content Grid: Brand | Explore | Product | Company | Join ── */}
        <div className="footer__content-grid">
          {/* Column 1: Brand Logo, Tagline & 3 Pillar Pills */}
          <div className="footer__col footer__col--brand">
            <div className="footer__brand-lockup">
              <img
                src="/assets/brand/demonic_primary_red.png"
                alt="Demonic Fuel Emblem"
                className="footer__brand-icon"
              />
              <div className="footer__brand-text">
                <span className="footer__brand-title">DEMONIC FUEL</span>
                <span className="footer__brand-sub">EST. 2026 // FOR THE OBSESSED</span>
              </div>
            </div>

            <p className="footer__brand-desc">
              Energy engineered in the shadows.<br />
              No water. No can. No waiting.
            </p>

            <div className="footer__pills-row">
              <span className="footer__pill">FOCUS</span>
              <span className="footer__pill">DISCIPLINE</span>
              <span className="footer__pill">CONTROL</span>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="footer__nav-group">
            {/* Column 2: EXPLORE */}
            <div className={`footer__col footer__col--links ${openSections.explore ? 'footer__col--open' : ''}`}>
              <button
                type="button"
                className="footer__accordion-trigger"
                onClick={() => toggleSection('explore')}
                aria-expanded={openSections.explore}
              >
                <div className="footer__accordion-title-wrap">
                  <span className="footer__accordion-num">01 //</span>
                  <h4 className="footer__nav-heading">EXPLORE</h4>
                </div>
                <span className="footer__accordion-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              <ul className="footer__nav-list">
                <li>
                  <a href="#strips" onClick={(e) => scrollTo(e, 'strips')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>THE RITUAL</span>
                  </a>
                </li>
                <li>
                  <a href="#strips" onClick={(e) => scrollTo(e, 'strips')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>THE STRIP</span>
                  </a>
                </li>
                <li>
                  <a href="#founder-pass" onClick={(e) => scrollTo(e, 'founder-pass')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>FOUNDER PASS</span>
                  </a>
                </li>
                <li>
                  <a href="#hero" onClick={scrollToTop} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>RESEARCH CHAMBER</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: PRODUCT */}
            <div className={`footer__col footer__col--links ${openSections.product ? 'footer__col--open' : ''}`}>
              <button
                type="button"
                className="footer__accordion-trigger"
                onClick={() => toggleSection('product')}
                aria-expanded={openSections.product}
              >
                <div className="footer__accordion-title-wrap">
                  <span className="footer__accordion-num">02 //</span>
                  <h4 className="footer__nav-heading">PRODUCT</h4>
                </div>
                <span className="footer__accordion-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              <ul className="footer__nav-list">
                <li>
                  <a href="#strips" onClick={(e) => scrollTo(e, 'strips')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>INGREDIENTS</span>
                  </a>
                </li>
                <li>
                  <a href="#strips" onClick={(e) => scrollTo(e, 'strips')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>SCIENCE</span>
                  </a>
                </li>
                <li>
                  <a href="#strips" onClick={(e) => scrollTo(e, 'strips')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>FAQ</span>
                  </a>
                </li>
                <li>
                  <a href="#founder-pass" onClick={(e) => scrollTo(e, 'founder-pass')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>REVIEWS</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: COMPANY */}
            <div className={`footer__col footer__col--links ${openSections.company ? 'footer__col--open' : ''}`}>
              <button
                type="button"
                className="footer__accordion-trigger"
                onClick={() => toggleSection('company')}
                aria-expanded={openSections.company}
              >
                <div className="footer__accordion-title-wrap">
                  <span className="footer__accordion-num">03 //</span>
                  <h4 className="footer__nav-heading">COMPANY</h4>
                </div>
                <span className="footer__accordion-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              <ul className="footer__nav-list">
                <li>
                  <a href="#hero" onClick={scrollToTop} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>OUR STORY</span>
                  </a>
                </li>
                <li>
                  <a href="#hero" onClick={scrollToTop} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>CAREERS</span>
                  </a>
                </li>
                <li>
                  <a href="#founder-pass" onClick={(e) => scrollTo(e, 'founder-pass')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>CONTACT</span>
                  </a>
                </li>
                <li>
                  <a href="#founder-pass" onClick={(e) => scrollTo(e, 'founder-pass')} className="footer__nav-link">
                    <span className="footer__link-marker" aria-hidden="true">›</span>
                    <span>LEGAL</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 5: JOIN THE OBSESSED (Newsletter) */}
          <div className="footer__col footer__col--newsletter">
            <h4 className="footer__nav-heading">JOIN THE OBSESSED</h4>
            <p className="footer__newsletter-desc">
              Get early access, drops and private transmissions.
            </p>

            <form onSubmit={handleSubmit} className="footer__newsletter-form">
              <input
                type="email"
                placeholder={submitted ? 'TRANSMISSION RECEIVED' : 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitted}
                className="footer__newsletter-input"
                required
              />
              <button
                type="submit"
                className={`footer__newsletter-btn ${submitted ? 'footer__newsletter-btn--success' : ''}`}
                aria-label="Submit email"
              >
                {submitted ? '✓' : '→'}
              </button>
            </form>

            <span className="footer__newsletter-note">
              NO SPAM. ONLY SIGNAL.
            </span>
          </div>
        </div>

        {/* ── Bottom Bar: Hairline Divider + Copyright + Socials + Back to Top ── */}
        <div className="footer__bottom-divider" />

        <div className="footer__bottom-bar">
          <div className="footer__bottom-legal">
            <span className="footer__legal-copy">
              © 2026 DEMONIC FUEL. ALL RIGHTS RESERVED.
            </span>
            <span className="footer__legal-tagline">
              FOR PEOPLE WHO REFUSE TO OPERATE ON AUTOPILOT.
            </span>
          </div>

          <div className="footer__bottom-actions">
            {/* Social Icons */}
            <div className="footer__socials">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/demonicfuel_"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-icon"
                aria-label="Demonic Fuel Instagram @demonicfuel_"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>

            {/* Separator Line */}
            <span className="footer__actions-sep" />

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="footer__back-top-btn"
              aria-label="Back to top"
            >
              <span>BACK TO TOP</span>
              <span className="footer__back-top-arrow">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
