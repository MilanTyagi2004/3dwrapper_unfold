/**
 * OutlierAccessPass.jsx
 * §06 Digital Outlier / Founder Access Pass
 *
 * Flow:
 *   1. Form (Full Name, Email, Instagram Handle) + Queue Counter
 *   2. Cinematic Verification Sequence (Scanning line, identity verify, batch alloc)
 *   3. 3D Tiltable Holographic Physical Dossier Pass
 *   4. Client-side 1080×1920 HD Instagram Story PNG Exporter
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './OutlierAccessPass.css'

// Deterministic allocation number generator based on name + email
function generateAllocationId(name, email) {
  const str = `${name.trim()}-${email.trim()}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const num = Math.abs(hash % 900) + 100 // 100 to 999
  return `DF / 26 / 0${num}`
}

function getFormattedDate() {
  const now = new Date()
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[now.getMonth()]} ${now.getFullYear()} // ALLOCATION ACTIVE`
}

export default function OutlierAccessPass() {
  // State machine: 'form' | 'verifying' | 'granted'
  const [phase, setPhase] = useState('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [allocId, setAllocId] = useState('')
  const [verifyStep, setVerifyStep] = useState(0)
  const [exporting, setExporting] = useState(false)

  // 3D Card Tilt Refs
  const cardRef = useRef(null)
  const sheenRef = useRef(null)
  const tiltRafRef = useRef(null)
  const mouseTilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  const VERIFY_MESSAGES = [
    'VERIFYING IDENTITY & CREDENTIALS...',
    'CALCULATING PRODUCTION RUN BATCH...',
    'GENERATING SECURITY CIPHER...',
    'AUTHENTICATING OUTLIER STATUS...',
    'ACCESS GRANTED // FOUNDER TIER 01',
  ]

  // Form submission & verification sequence
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    const id = generateAllocationId(fullName, email)
    setAllocId(id)
    setPhase('verifying')
    setVerifyStep(0)

    // Step through verification sequence smoothly (~1.2s total)
    const timers = [
      setTimeout(() => setVerifyStep(1), 300),
      setTimeout(() => setVerifyStep(2), 650),
      setTimeout(() => setVerifyStep(3), 950),
      setTimeout(() => setVerifyStep(4), 1250),
      setTimeout(() => setPhase('granted'), 1600),
    ]

    return () => timers.forEach(clearTimeout)
  }

  // Reset to claim another
  const handleReset = () => {
    setPhase('form')
    setVerifyStep(0)
  }

  // 3D Mouse Parallax & Holographic Sheen
  useEffect(() => {
    if (phase !== 'granted') return

    const tick = () => {
      tiltRafRef.current = requestAnimationFrame(tick)
      const m = mouseTilt.current
      m.x += (m.tx - m.x) * 0.08
      m.y += (m.ty - m.y) * 0.08

      const card = cardRef.current
      const sheen = sheenRef.current
      if (card) {
        card.style.transform = `perspective(1000px) rotateY(${m.x * 12}deg) rotateX(${m.y * -10}deg) scale3d(1, 1, 1)`
      }
      if (sheen) {
        const sheenX = (m.x + 1) * 50
        const sheenY = (m.y + 1) * 50
        sheen.style.background = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 254, 225, 0.22) 0%, rgba(234, 9, 23, 0.15) 30%, transparent 70%)`
      }
    }

    tiltRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(tiltRafRef.current)
  }, [phase])

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    mouseTilt.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    mouseTilt.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2
  }

  const handleMouseLeave = () => {
    mouseTilt.current.tx = 0
    mouseTilt.current.ty = 0
  }

  // High-Resolution 1080 × 1920 Instagram Story PNG Exporter
  const handleExportStory = useCallback(() => {
    if (exporting) return
    setExporting(true)

    const W = 1080
    const H = 1920
    const exp = document.createElement('canvas')
    exp.width = W
    exp.height = H
    const ctx = exp.getContext('2d')

    document.fonts.ready.then(() => {
      // 1. Background Void & Radial Glows
      ctx.fillStyle = '#070605'
      ctx.fillRect(0, 0, W, H)

      // Top Red Ambient Glow
      const topGlow = ctx.createRadialGradient(W * 0.5, H * 0.25, 50, W * 0.5, H * 0.25, W * 0.7)
      topGlow.addColorStop(0, 'rgba(234, 9, 23, 0.22)')
      topGlow.addColorStop(0.5, 'rgba(143, 5, 12, 0.08)')
      topGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = topGlow
      ctx.fillRect(0, 0, W, H)

      // Center Card Backdrop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 60
      ctx.shadowOffsetY = 30

      // Card Dimensions on Story Canvas
      const cardX = 90
      const cardY = 280
      const cardW = 900
      const cardH = 1360

      // Card Base - Dark Red Felt Texture / Obsidian
      const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
      cardGrad.addColorStop(0, '#150809')
      cardGrad.addColorStop(0.45, '#0d0707')
      cardGrad.addColorStop(1, '#1b090a')
      ctx.fillStyle = cardGrad
      ctx.fillRect(cardX, cardY, cardW, cardH)

      // Reset Shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Card Border - Dual Layer
      ctx.strokeStyle = 'rgba(255, 254, 225, 0.15)'
      ctx.lineWidth = 3
      ctx.strokeRect(cardX, cardY, cardW, cardH)

      ctx.strokeStyle = 'rgba(234, 9, 23, 0.6)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(cardX + 16, cardY + 16, cardW - 32, cardH - 32)

      // Subtle Red Accent Lines
      ctx.fillStyle = '#EA0917'
      ctx.fillRect(cardX + 40, cardY + 140, cardW - 80, 4)
      ctx.fillRect(cardX + 40, cardY + cardH - 180, cardW - 80, 2)

      // 2. Header Content
      ctx.textAlign = 'center'
      ctx.fillStyle = '#EA0917'
      ctx.font = '700 28px "Barlow Condensed", sans-serif'
      ctx.fillText('DEMONIC FUEL // FIRST BATCH ALLOCATION', W / 2, cardY + 80)

      ctx.fillStyle = 'rgba(255, 254, 225, 0.6)'
      ctx.font = '600 22px "Barlow Condensed", sans-serif'
      ctx.fillText('OFFICIAL DIGITAL DOSSIER • SECURE ARTIFACT', W / 2, cardY + 115)

      // 3. Brand Title
      ctx.fillStyle = '#FFFEE1'
      ctx.font = '900 68px "Cinzel", Georgia, serif'
      ctx.fillText('OUTLIER ACCESS', W / 2, cardY + 260)

      ctx.fillStyle = '#EA0917'
      ctx.font = '700 26px "Barlow Condensed", sans-serif'
      ctx.fillText('TIER 01 // FOUNDING POSSESSED', W / 2, cardY + 310)

      // 4. Member Name Box
      const boxY = cardY + 380
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(cardX + 60, boxY, cardW - 120, 200)
      ctx.strokeStyle = 'rgba(255, 254, 225, 0.1)'
      ctx.lineWidth = 1
      ctx.strokeRect(cardX + 60, boxY, cardW - 120, 200)

      ctx.fillStyle = 'rgba(255, 254, 225, 0.5)'
      ctx.font = '700 20px "Barlow Condensed", sans-serif'
      ctx.fillText('OFFICIALLY ISSUED TO', W / 2, boxY + 45)

      // Clean, uppercase Member Name
      ctx.fillStyle = '#FFFEE1'
      const nameFontSize = fullName.length > 18 ? 44 : 54
      ctx.font = `900 ${nameFontSize}px "Cinzel", Georgia, serif`
      ctx.fillText(fullName.toUpperCase().trim(), W / 2, boxY + 115)

      if (instagram.trim()) {
        const cleanIg = instagram.startsWith('@') ? instagram : `@${instagram}`
        ctx.fillStyle = '#EA0917'
        ctx.font = '600 24px "Barlow Condensed", sans-serif'
        ctx.fillText(cleanIg.toUpperCase(), W / 2, boxY + 165)
      } else {
        ctx.fillStyle = 'rgba(255, 254, 225, 0.4)'
        ctx.font = '600 20px "Barlow Condensed", sans-serif'
        ctx.fillText('SUBLINGUAL SACRAMENT PASS', W / 2, boxY + 165)
      }

      // 5. Allocation Serial Box
      const serialY = cardY + 630
      ctx.fillStyle = 'rgba(234, 9, 23, 0.08)'
      ctx.fillRect(cardX + 60, serialY, cardW - 120, 150)
      ctx.strokeStyle = 'rgba(234, 9, 23, 0.3)'
      ctx.strokeRect(cardX + 60, serialY, cardW - 120, 150)

      ctx.fillStyle = 'rgba(255, 254, 225, 0.6)'
      ctx.font = '700 22px "Barlow Condensed", sans-serif'
      ctx.fillText('ALLOCATION SERIAL NUMBER', W / 2, serialY + 45)

      ctx.fillStyle = '#EA0917'
      ctx.font = '900 58px "Cinzel", monospace'
      ctx.fillText(allocId, W / 2, serialY + 110)

      // 6. Specs & Delivery Truth
      const specsY = cardY + 830
      ctx.textAlign = 'left'
      const leftX = cardX + 80

      const specs = [
        ['FORMAT', 'SUBLINGUAL DISSOLVABLE STRIP'],
        ['WATER REQUIRED', '0.0 mL // DIRECT ABSORPTION'],
        ['SUGAR CONTENT', '0.0g // ZERO WEAKNESS'],
        ['DISPATCH PRIORITY', 'WAVE 01 • INDIA LAUNCH'],
      ]

      specs.forEach(([k, v], idx) => {
        const rowY = specsY + idx * 55
        ctx.fillStyle = 'rgba(255, 254, 225, 0.5)'
        ctx.font = '700 22px "Barlow Condensed", sans-serif'
        ctx.fillText(k, leftX, rowY)

        ctx.textAlign = 'right'
        ctx.fillStyle = idx === 3 ? '#EA0917' : '#FFFEE1'
        ctx.font = '700 22px "Barlow Condensed", sans-serif'
        ctx.fillText(v, cardX + cardW - 80, rowY)
        ctx.textAlign = 'left'

        ctx.strokeStyle = 'rgba(255, 254, 225, 0.05)'
        ctx.beginPath()
        ctx.moveTo(leftX, rowY + 15)
        ctx.lineTo(cardX + cardW - 80, rowY + 15)
        ctx.stroke()
      })

      // 7. Barcode Simulation at Bottom of Card
      const barcodeY = cardY + cardH - 140
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255, 254, 225, 0.8)'
      // Generate vertical bar pattern
      let barX = cardX + 120
      const barEnd = cardX + cardW - 120
      let seed = 42
      while (barX < barEnd) {
        seed = (seed * 9301 + 49297) % 233280
        const barWidth = (seed % 4) + 2
        const space = (seed % 3) + 3
        ctx.fillRect(barX, barcodeY, barWidth, 45)
        barX += barWidth + space
      }

      ctx.fillStyle = 'rgba(255, 254, 225, 0.5)'
      ctx.font = '600 18px "Barlow Condensed", sans-serif'
      ctx.fillText(`SECURITY IDENTIFIER: ${allocId} // DEMONICFUEL.COM`, W / 2, barcodeY + 75)

      // 8. Story Top & Bottom Outer Badges
      ctx.fillStyle = '#EA0917'
      ctx.font = '900 32px "Cinzel", Georgia, serif'
      ctx.fillText('DEMONIC FUEL', W / 2, 160)

      ctx.fillStyle = 'rgba(255, 254, 225, 0.4)'
      ctx.font = '600 20px "Barlow Condensed", sans-serif'
      ctx.fillText('FOR THE POSSESSED • EST. 2026', W / 2, 200)

      ctx.fillStyle = '#FFFEE1'
      ctx.font = '700 26px "Barlow Condensed", sans-serif'
      ctx.fillText('CLAIM YOUR ALLOCATION → DEMONICFUEL.COM', W / 2, H - 120)

      ctx.fillStyle = 'rgba(255, 254, 225, 0.3)'
      ctx.font = '600 18px "Barlow Condensed", sans-serif'
      ctx.fillText('SCREENSHOT / SHARE TO INSTAGRAM STORY', W / 2, H - 80)

      // 9. Download Trigger
      const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outlier'
      const a = document.createElement('a')
      a.href = exp.toDataURL('image/png')
      a.download = `demonic-fuel-founder-${cleanName}.png`
      a.click()
      setExporting(false)
    })
  }, [fullName, allocId, instagram, exporting])

  return (
    <div className="outlier-pass">
      <AnimatePresence mode="wait">
        {/* ── PHASE 1: FORM ────────────────────────────────────────── */}
        {phase === 'form' && (
          <motion.div
            key="pass-form"
            className="outlier-pass__form-box"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="outlier-pass__queue-badge">
              <span className="outlier-pass__dot-pulse" />
              <span className="tech-label" style={{ color: 'var(--devil-red)' }}>
                LIMITED RUN // ALLOCATION #482 OF 1,000 ACTIVE
              </span>
            </div>

            <h3 className="serif-headline outlier-pass__form-title">
              CLAIM YOUR FOUNDER ALLOCATION
            </h3>
            <p className="outlier-pass__form-desc">
              The first batch of the sublingual sacrament is strictly allocated. 
              Enter your details to generate your verified digital Outlier Pass.
            </p>

            <form onSubmit={handleSubmit} className="outlier-pass__form">
              <div className="outlier-pass__input-field">
                <label className="tech-label">01 // FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="E.G. MILAN TYAGI"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="outlier-pass__input"
                  autoComplete="name"
                />
              </div>

              <div className="outlier-pass__input-field">
                <label className="tech-label">02 // EMAIL ADDRESS *</label>
                <input
                  type="email"
                  required
                  placeholder="USER@DOMINION.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="outlier-pass__input"
                  autoComplete="email"
                />
              </div>

              <div className="outlier-pass__input-field">
                <label className="tech-label">03 // INSTAGRAM HANDLE (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="@YOURHANDLE"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="outlier-pass__input"
                  autoComplete="off"
                />
              </div>

              <motion.button
                type="submit"
                className="outlier-pass__submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>CLAIM MY ALLOCATION</span>
                <span>→</span>
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* ── PHASE 2: CINEMATIC VERIFICATION ──────────────────────── */}
        {phase === 'verifying' && (
          <motion.div
            key="pass-verifying"
            className="outlier-pass__verify-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="outlier-pass__scan-container">
              <div className="outlier-pass__scan-line" />
              <div className="outlier-pass__scan-glow" />
              
              <div className="outlier-pass__scan-content">
                <span className="outlier-pass__scan-emblem">❖</span>
                <span className="tech-label" style={{ color: 'var(--devil-red)', fontSize: '0.78rem' }}>
                  SECURITY CLEARANCE PROTOCOL
                </span>
                
                <h4 className="serif-headline outlier-pass__scan-message">
                  {VERIFY_MESSAGES[verifyStep]}
                </h4>

                <div className="outlier-pass__scan-bar">
                  <motion.div
                    className="outlier-pass__scan-progress"
                    animate={{ width: `${(verifyStep + 1) * 20}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PHASE 3: GRANTED // 3D DIGITAL OUTLIER PASS ──────────── */}
        {phase === 'granted' && (
          <motion.div
            key="pass-granted"
            className="outlier-pass__granted-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Acknowledgment Header */}
            <div className="outlier-pass__ack">
              <div className="outlier-pass__ack-header">
                <span className="outlier-pass__ack-icon">❖</span>
                <div>
                  <span className="tech-label" style={{ color: 'var(--devil-red)' }}>
                    SACRAMENT LOCKED // PRIORITY DISPATCH
                  </span>
                  <p className="outlier-pass__ack-email">
                    Allocated to <strong>{email.toUpperCase()}</strong> • Batch Serial: <strong>{allocId}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* 3D Tiltable Physical Dossier Card */}
            <div
              className="outlier-pass__card-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div ref={cardRef} className="outlier-pass__card">
                {/* Holographic dynamic sheen */}
                <div ref={sheenRef} className="outlier-pass__card-sheen" />

                {/* Card Top Brand Info */}
                <div className="outlier-pass__card-top">
                  <div>
                    <span className="serif-headline outlier-pass__card-brand">DEMONIC FUEL</span>
                    <span className="outlier-pass__card-edition">OUTLIER DOSSIER // PASS 2026</span>
                  </div>
                  
                  {/* Silver Foil Emblem Badge */}
                  <div className="outlier-pass__seal-badge">
                    <img
                      src="/assets/brand/logo_silver_foil_badge.png"
                      alt="Silver Foil Demonic Emblem"
                      className="outlier-pass__seal-img"
                    />
                  </div>
                </div>

                <div className="outlier-pass__card-divider" />

                {/* Dynamic Member Info */}
                <div className="outlier-pass__card-body">
                  <div className="outlier-pass__card-row">
                    <span className="tech-label">MEMBER NAME</span>
                    <strong className="serif-headline outlier-pass__card-name">
                      {fullName.toUpperCase()}
                    </strong>
                    {instagram && (
                      <span className="outlier-pass__card-ig">
                        {instagram.startsWith('@') ? instagram : `@${instagram}`}
                      </span>
                    )}
                  </div>

                  <div className="outlier-pass__card-grid">
                    <div>
                      <span className="tech-label">ALLOCATION ID</span>
                      <strong className="outlier-pass__card-val outlier-pass__card-val--red">
                        {allocId}
                      </strong>
                    </div>
                    <div>
                      <span className="tech-label">MEMBERSHIP TIER</span>
                      <strong className="outlier-pass__card-val">
                        TIER 01 // FOUNDER
                      </strong>
                    </div>
                  </div>

                  <div className="outlier-pass__card-grid">
                    <div>
                      <span className="tech-label">SACRAMENT FORMAT</span>
                      <strong className="outlier-pass__card-val">
                        SUBLINGUAL STRIP
                      </strong>
                    </div>
                    <div>
                      <span className="tech-label">DISPATCH STATUS</span>
                      <strong className="outlier-pass__card-val outlier-pass__card-val--active">
                        QUEUE CONFIRMED
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Barcode */}
                <div className="outlier-pass__card-bottom">
                  <div className="outlier-pass__barcode">
                    {[...Array(32)].map((_, i) => (
                      <span
                        key={i}
                        className="outlier-pass__bar"
                        style={{
                          width: `${(i % 3) + 1.5}px`,
                          marginRight: `${(i % 2) + 1.5}px`,
                          opacity: 0.6 + (i % 4) * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <div className="outlier-pass__date-stamp">
                    <span className="tech-label">{getFormattedDate()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: Instagram Story Export + Reset */}
            <div className="outlier-pass__actions">
              <motion.button
                className="outlier-pass__export-btn"
                onClick={handleExportStory}
                disabled={exporting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {exporting ? (
                  <>
                    <span className="outlier-pass__spinner" />
                    <span>RENDERING 1080 × 1920 ASSET...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>DOWNLOAD INSTAGRAM STORY PASS</span>
                  </>
                )}
              </motion.button>

              <button onClick={handleReset} className="outlier-pass__reset-btn">
                <span>RESET / CLAIM FOR ANOTHER OUTLIER</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
