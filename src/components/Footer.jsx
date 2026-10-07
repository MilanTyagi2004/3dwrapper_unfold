import React, { useState } from 'react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
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

              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-icon"
                aria-label="Demonic Fuel on X"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-icon"
                aria-label="Demonic Fuel YouTube"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-icon"
                aria-label="Demonic Fuel Discord Community"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
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
