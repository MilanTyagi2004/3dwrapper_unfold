import React from 'react';
import CustomCursor from './CustomCursor';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="demonic-404-wrapper">
      <CustomCursor />
      <div className="demonic-404-card">
        {/* Brand Logo centered at top */}
        <div className="demonic-404-emblem-wrap">
          <img
            src="/assets/brand/demonic_eye_red_cream.png"
            alt="Demonic Fuel Emblem"
            className="demonic-404-emblem"
          />
        </div>

        {/* Status Badge below logo */}
        <div className="demonic-404-badge">
          <span className="demonic-404-dot" />
          <span>ERROR 404 // NOT FOUND</span>
        </div>

        {/* 404 Headline */}
        <div className="demonic-404-code">
          4<span>0</span>4
        </div>

        <h1 className="demonic-404-title">SECTOR TERMINATED</h1>
        
        <p className="demonic-404-desc">
          The requested route does not exist or has been permanently decommissioned.
        </p>

        {/* CTA */}
        <a href="/" className="demonic-404-btn">
          <span>RETURN TO HOMEPAGE</span>
          <span aria-hidden="true">→</span>
        </a>

        {/* Minimal Footer Stamp */}
        <div className="demonic-404-foot">
          DEMONIC FUEL // SYSTEM DEFENSE PROTOCOL
        </div>
      </div>
    </div>
  );
}
