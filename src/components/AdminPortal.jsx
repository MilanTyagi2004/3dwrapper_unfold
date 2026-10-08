import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import './AdminPortal.css';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const ADMIN_PASSKEY = env.VITE_ADMIN_PASSKEY || 'DEMONIC2026';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'newsletter'
  const [founderPasses, setFounderPasses] = useState([]);
  const [newsletterSubs, setNewsletterSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Check if authenticated in current browser session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('df_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Founder Passes
      const { data: passesData, error: passesErr } = await supabase
        .from('founder_passes')
        .select('*')
        .order('created_at', { ascending: false });

      if (passesErr) {
        console.error('Error fetching founder passes:', passesErr);
      } else {
        setFounderPasses(passesData || []);
      }

      // 2. Fetch Newsletter
      const { data: newsData, error: newsErr } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (newsErr) {
        console.error('Error fetching newsletter:', newsErr);
      } else {
        setNewsletterSubs(newsData || []);
      }
    } catch (err) {
      console.error('Supabase query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passkeyInput.trim() === ADMIN_PASSKEY) {
      setIsAuthenticated(true);
      setAuthError(false);
      sessionStorage.setItem('df_admin_auth', 'true');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('df_admin_auth');
    setIsAuthenticated(false);
    setPasskeyInput('');
  };

  // Filtered passes
  const filteredPasses = useMemo(() => {
    if (!searchQuery.trim()) return founderPasses;
    const q = searchQuery.toLowerCase();
    return founderPasses.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.member_id && p.member_id.toLowerCase().includes(q)) ||
        (p.tagline && p.tagline.toLowerCase().includes(q))
    );
  }, [founderPasses, searchQuery]);

  // Filtered newsletter
  const filteredNewsletter = useMemo(() => {
    if (!searchQuery.trim()) return newsletterSubs;
    const q = searchQuery.toLowerCase();
    return newsletterSubs.filter((n) => n.email && n.email.toLowerCase().includes(q));
  }, [newsletterSubs, searchQuery]);

  // Export to Excel / CSV with UTF-8 BOM
  const exportToExcelCSV = (type = 'passes') => {
    let rows = [];
    let headers = [];
    let fileName = '';

    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'passes') {
      fileName = `demonic_fuel_founder_passes_${timestamp}.csv`;
      headers = [
        'PASS ID',
        'FULL NAME',
        'EMAIL ADDRESS',
        'PHONE NUMBER',
        'ASSIGNED MOTTO',
        'REGISTRATION DATE (UTC)',
      ];
      rows = founderPasses.map((p) => [
        `"${p.member_id || ''}"`,
        `"${p.name || ''}"`,
        `"${p.email || ''}"`,
        `"${p.phone || ''}"`,
        `"${(p.tagline || '').replace(/"/g, '""')}"`,
        `"${p.created_at ? new Date(p.created_at).toLocaleString() : ''}"`,
      ]);
    } else if (type === 'newsletter') {
      fileName = `demonic_fuel_newsletter_${timestamp}.csv`;
      headers = ['EMAIL ADDRESS', 'SUBSCRIPTION DATE (UTC)'];
      rows = newsletterSubs.map((n) => [
        `"${n.email || ''}"`,
        `"${n.created_at ? new Date(n.created_at).toLocaleString() : ''}"`,
      ]);
    } else if (type === 'all') {
      fileName = `demonic_fuel_all_leads_${timestamp}.csv`;
      headers = [
        'CATEGORY',
        'PASS ID',
        'FULL NAME',
        'EMAIL ADDRESS',
        'PHONE NUMBER',
        'ASSIGNED MOTTO',
        'DATE',
      ];
      const pRows = founderPasses.map((p) => [
        '"FOUNDER PASS"',
        `"${p.member_id || ''}"`,
        `"${p.name || ''}"`,
        `"${p.email || ''}"`,
        `"${p.phone || ''}"`,
        `"${(p.tagline || '').replace(/"/g, '""')}"`,
        `"${p.created_at ? new Date(p.created_at).toLocaleString() : ''}"`,
      ]);
      const nRows = newsletterSubs.map((n) => [
        '"NEWSLETTER"',
        '""',
        '""',
        `"${n.email || ''}"`,
        '""',
        '""',
        `"${n.created_at ? new Date(n.created_at).toLocaleString() : ''}"`,
      ]);
      rows = [...pRows, ...nRows];
    }

    if (rows.length === 0) {
      alert('No records available to export.');
      return;
    }

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Back to main site
  const goHome = () => {
    window.location.href = '/';
  };

  /* ── 1. Passkey Gate Screen ── */
  if (!isAuthenticated) {
    return (
      <div className="ap-gate">
        <div className="ap-gate__vignette" />
        <div className="ap-gate__scanlines" />

        <div className="ap-gate__panel">
          <div className="ap-gate__emblem-wrap">
            <img
              src="/assets/brand/demonic_primary_red.png"
              alt="Demonic Fuel"
              className="ap-gate__emblem"
            />
          </div>

          <div className="ap-gate__badge">FACILITY 06 // CLASSIFIED ACCESS</div>
          <h2 className="ap-gate__title">DATA CONSOLE</h2>
          <p className="ap-gate__desc">
            Authorized personnel only. Enter executive passkey to access live allocations and Excel exports.
          </p>

          <form onSubmit={handleLogin} className="ap-gate__form">
            <input
              type="password"
              placeholder="ENTER PASSKEY"
              value={passkeyInput}
              onChange={(e) => {
                setPasskeyInput(e.target.value);
                if (authError) setAuthError(false);
              }}
              className={`ap-gate__input ${authError ? 'is-error' : ''}`}
              autoFocus
            />

            {authError && (
              <span className="ap-gate__error-msg">
                ⚠ INVALID CIPHER // ACCESS DENIED
              </span>
            )}

            <button type="submit" className="ap-gate__btn">
              <span>AUTHENTICATE</span>
              <span>→</span>
            </button>
          </form>

          <div className="ap-gate__footer">
            <button type="button" onClick={goHome} className="ap-gate__back-btn">
              ← RETURN TO MAINFRAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. Authenticated Dashboard Screen ── */
  return (
    <div className="ap-dash">
      <div className="ap-dash__vignette" />
      <div className="ap-dash__scanlines" />

      {/* Top Bar Header */}
      <header className="ap-header">
        <div className="ap-header__brand" onClick={goHome} role="button" tabIndex={0}>
          <img
            src="/assets/brand/demonic_primary_red.png"
            alt="Demonic Fuel"
            className="ap-header__logo"
          />
          <div className="ap-header__title-group">
            <h1 className="ap-header__title">DEMONIC FUEL</h1>
            <span className="ap-header__sub">EXECUTIVE EXPORT SUITE // FACILITY 06</span>
          </div>
        </div>

        <div className="ap-header__actions">
          <button
            type="button"
            className="ap-btn ap-btn--refresh"
            onClick={fetchData}
            title="Fetch latest entries from Supabase"
          >
            <span className="ap-btn__icon">⟳</span>
            <span>SYNC DATA</span>
          </button>

          <button
            type="button"
            className="ap-btn ap-btn--excel"
            onClick={() => exportToExcelCSV(activeTab)}
          >
            <span className="ap-btn__icon">⬇</span>
            <span>
              EXPORT {activeTab === 'passes' ? 'ALLOCATIONS' : 'NEWSLETTER'} (.CSV)
            </span>
          </button>

          <button
            type="button"
            className="ap-btn ap-btn--ghost"
            onClick={() => exportToExcelCSV('all')}
          >
            <span>EXPORT ALL LEADS</span>
          </button>

          <button
            type="button"
            className="ap-btn ap-btn--logout"
            onClick={handleLogout}
            title="Lock Console"
          >
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="ap-container">
        {/* KPI Metrics Cards */}
        <section className="ap-metrics">
          <div className="ap-metric-card">
            <span className="ap-metric-card__label">FOUNDER PASSES</span>
            <div className="ap-metric-card__value">{founderPasses.length}</div>
            <span className="ap-metric-card__hint">Exclusive Black Card Allocations</span>
          </div>

          <div className="ap-metric-card">
            <span className="ap-metric-card__label">NEWSLETTER LEADS</span>
            <div className="ap-metric-card__value">{newsletterSubs.length}</div>
            <span className="ap-metric-card__hint">Subscribers from Site Footer</span>
          </div>

          <div className="ap-metric-card">
            <span className="ap-metric-card__label">TOTAL DATABASE RECORDS</span>
            <div className="ap-metric-card__value">
              {founderPasses.length + newsletterSubs.length}
            </div>
            <span className="ap-metric-card__hint">Combined Contact Assets</span>
          </div>

          <div className="ap-metric-card ap-metric-card--status">
            <span className="ap-metric-card__label">MAINFRAME STATUS</span>
            <div className="ap-metric-card__status-row">
              <span className="ap-status-dot" />
              <span className="ap-status-text">SUPABASE LIVE</span>
            </div>
            <span className="ap-metric-card__hint">Real-Time Sync Protocol</span>
          </div>
        </section>

        {/* Controls Bar: Tabs & Search */}
        <div className="ap-controls">
          <div className="ap-tabs">
            <button
              type="button"
              className={`ap-tab ${activeTab === 'passes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('passes')}
            >
              <span>FOUNDER ALLOCATIONS</span>
              <span className="ap-tab__count">{founderPasses.length}</span>
            </button>

            <button
              type="button"
              className={`ap-tab ${activeTab === 'newsletter' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('newsletter')}
            >
              <span>NEWSLETTER SUBSCRIBERS</span>
              <span className="ap-tab__count">{newsletterSubs.length}</span>
            </button>
          </div>

          <div className="ap-search">
            <span className="ap-search__icon">⌕</span>
            <input
              type="text"
              placeholder={
                activeTab === 'passes'
                  ? 'Search by name, email, phone, ID...'
                  : 'Search subscribers by email...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ap-search__input"
            />
            {searchQuery && (
              <button
                type="button"
                className="ap-search__clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Data Table Section */}
        <section className="ap-table-wrap">
          {loading ? (
            <div className="ap-loading">
              <span className="ap-loading__spinner" />
              <span className="ap-loading__text">FETCHING SECURE DATA RECORDS...</span>
            </div>
          ) : activeTab === 'passes' ? (
            /* Tab 1: Founder Passes Table */
            filteredPasses.length === 0 ? (
              <div className="ap-empty">
                <span className="ap-empty__icon">∅</span>
                <span className="ap-empty__title">NO ALLOCATIONS FOUND</span>
                <span className="ap-empty__desc">
                  {searchQuery
                    ? 'No records matched your search query.'
                    : 'Submissions from the Founder Pass card will appear here automatically.'}
                </span>
              </div>
            ) : (
              <div className="ap-table-scroll">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>PASS ID</th>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>PHONE</th>
                      <th>ASSIGNED MOTTO</th>
                      <th>REGISTERED</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPasses.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="ap-td--idx">{idx + 1}</td>
                        <td className="ap-td--pass">
                          <span className="ap-badge-pass">{item.member_id || 'N/A'}</span>
                        </td>
                        <td className="ap-td--name">{item.name || 'ANONYMOUS'}</td>
                        <td className="ap-td--email">
                          <span className="ap-text-selectable">{item.email}</span>
                        </td>
                        <td className="ap-td--phone">
                          {item.phone ? (
                            <span className="ap-text-phone">{item.phone}</span>
                          ) : (
                            <span className="ap-text-muted">—</span>
                          )}
                        </td>
                        <td className="ap-td--motto" title={item.tagline}>
                          {item.tagline || '—'}
                        </td>
                        <td className="ap-td--date">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="ap-td--action" style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="ap-copy-btn"
                            onClick={() => copyToClipboard(item.email, item.id || idx)}
                            title="Copy email to clipboard"
                          >
                            {copiedId === (item.id || idx) ? '✓ COPIED' : 'COPY'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Tab 2: Newsletter Subscribers Table */
            filteredNewsletter.length === 0 ? (
              <div className="ap-empty">
                <span className="ap-empty__icon">∅</span>
                <span className="ap-empty__title">NO SUBSCRIBERS FOUND</span>
                <span className="ap-empty__desc">
                  {searchQuery
                    ? 'No subscribers matched your search query.'
                    : 'Submissions from the footer newsletter form will appear here.'}
                </span>
              </div>
            ) : (
              <div className="ap-table-scroll">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>EMAIL ADDRESS</th>
                      <th>SUBSCRIBED DATE</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNewsletter.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="ap-td--idx">{idx + 1}</td>
                        <td className="ap-td--email">
                          <span className="ap-text-selectable">{item.email}</span>
                        </td>
                        <td className="ap-td--date">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="ap-td--action" style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="ap-copy-btn"
                            onClick={() => copyToClipboard(item.email, item.id || idx)}
                            title="Copy email"
                          >
                            {copiedId === (item.id || idx) ? '✓ COPIED' : 'COPY'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>

        {/* Footer Info */}
        <footer className="ap-footer-bar">
          <span className="ap-footer-left">
            DEMONIC FUEL // ENCRYPTED EXPORT INTERFACE // 2026
          </span>
          <button type="button" onClick={goHome} className="ap-footer-link">
            ← RETURN TO WEBSITE
          </button>
        </footer>
      </main>
    </div>
  );
}
