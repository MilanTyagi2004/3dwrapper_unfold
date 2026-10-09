/**
 * EmailCollect.jsx
 * Demonic Fuel — Luxury American Express Black Card Founder Pass & Allocation
 *
 * Tech Stack:
 * - React (useState, useRef, useEffect, useCallback)
 * - Framer Motion (framer-motion)
 * - QR Code Canvas (qrcode.react via QRCodeCanvas)
 * - Typography: Meursault VF (brand headline/logo) & Barlow Condensed (editorial tech font) & Amador Font (decorative)
 * - High-res Canvas 2D Exporters: 4X Ultra-HD Card (2080x1312) & 9:16 Instagram Story (1080x1920)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import LiquidHeadline from '../LiquidHeadline'
import { supabase } from '../../lib/supabase'
import './EmailCollect.css'

/* ── Constants & Helpers ───────────────────────────────── */

const SITE_URL = 'https://demonicfuel.com'

// 8 Curated brand taglines deterministically assigned from email
const TAGLINES = [
  "ENERGY ISN'T CONSUMED. IT'S UNLEASHED.",
  "BORN FROM OBSESSION. BUILT WITHOUT COMPROMISE.",
  "THE ALTER EGO DOESN'T SLEEP.",
  "ORDINARY IS THE ENEMY.",
  "FUELLED BY WHAT OTHERS FEAR.",
  "WHERE DISCIPLINE MEETS POSSESSION.",
  "NOT FOR THE FAINT. FOR THE RELENTLESS.",
  "BEYOND THE THRESHOLD. BEYOND THE LIMIT."
]

// 5 Sequenced verification checkpoints (~1.8s total)
const VERIFY_STEPS = [
  'VALIDATING CREDENTIALS...',
  'SCANNING IDENTITY MATRIX...',
  'ASSIGNING FOUNDER ALLOCATION...',
  'ENCRYPTING MEMBER CIPHER...',
  'ACCESS GRANTED.'
]

// Generate a unique high-status Member Pass ID for every submission
function generateMemberId() {
  const num = Math.floor(1000 + Math.random() * 9000)
  const letters = ['X', 'Z', 'V', 'K', 'R', 'M', 'A', 'B', 'C', 'D']
  const letter = letters[Math.floor(Math.random() * letters.length)]
  const suffix = Math.floor(1 + Math.random() * 9)
  return `DF-${num}-${letter}${suffix}`
}

// Assign a curated brand tagline for the card
function pickTagline() {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
}

// Helper: Canvas Rounded Rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/* ── Main Component ────────────────────────────────────── */

export default function EmailCollect() {
  const [phase, setPhase] = useState('form') // 'form' | 'verifying' | 'card'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [memberId, setMemberId] = useState('')
  const [tagline, setTagline] = useState('')
  const [verifyIdx, setVerifyIdx] = useState(0)

  const [errorMessage, setErrorMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  // Card reference for canvas rendering
  const canvasCardRef = useRef(null)

  // 3D tilt and specular physics refs
  const tiltRef = useRef(null)
  const rafRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0, px: 50, py: 50 })

  /* ── Form Submit: Transition to Cinematic Verification ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !phone.trim() || isChecking) return
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.trim()

    setIsChecking(true)

    // 1. Check if email already registered in Supabase
    try {
      const { data: existing, error: checkErr } = await supabase
        .from('founder_passes')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1)

      if (existing && existing.length > 0) {
        setIsChecking(false)
        setErrorMessage('ACCESS PASS ALREADY ISSUED // THIS EMAIL IS ALREADY REGISTERED')
        return
      }
    } catch (err) {
      console.warn('[Supabase] Duplicate pre-check note:', err)
    }

    const displayName = (name.trim() || cleanEmail.split('@')[0]).toUpperCase()
    const generatedId = generateMemberId()
    const assignedTagline = pickTagline()

    // 2. Insert record into Supabase
    try {
      const { error } = await supabase.from('founder_passes').insert([
        {
          name: displayName,
          email: cleanEmail,
          phone: cleanPhone || null,
          member_id: generatedId,
          tagline: assignedTagline,
        }
      ])
      if (error) {
        if (
          error.code === '23505' ||
          error.message?.toLowerCase().includes('duplicate') ||
          error.message?.toLowerCase().includes('unique')
        ) {
          setIsChecking(false)
          setErrorMessage('ACCESS PASS ALREADY ISSUED // THIS EMAIL IS ALREADY REGISTERED')
          return
        }
        console.warn('[Supabase] Note on founder pass save:', error.message)
      }
    } catch (err) {
      console.warn('[Supabase] Error during submission:', err)
    }

    setIsChecking(false)
    setName(displayName)
    setMemberId(generatedId)
    setTagline(assignedTagline)
    setPhase('verifying')
    setVerifyIdx(0)
  }

  /* ── Cinematic Verification Stepped Sequencer (~1.8s total) ── */
  useEffect(() => {
    if (phase !== 'verifying') return

    const timers = [
      setTimeout(() => setVerifyIdx(1), 350),
      setTimeout(() => setVerifyIdx(2), 700),
      setTimeout(() => setVerifyIdx(3), 1050),
      setTimeout(() => setVerifyIdx(4), 1400),
      setTimeout(() => setPhase('card'), 1850),
    ]

    return () => timers.forEach(clearTimeout)
  }, [phase])

  /* ── 3D Tilt Physics & Dynamic Specular Sheen Tracking ── */
  useEffect(() => {
    if (phase !== 'card' || !tiltRef.current) return

    const stageEl = tiltRef.current
    let isHovering = false

    function onMouseMove(e) {
      const rect = stageEl.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height

      // Target rotation angles (bounded to smooth luxury feel)
      mouse.current.x = (nx - 0.5) * 22
      mouse.current.y = (ny - 0.5) * -22
      mouse.current.px = Math.round(nx * 100)
      mouse.current.py = Math.round(ny * 100)
      isHovering = true
    }

    function onMouseLeave() {
      mouse.current.x = 0
      mouse.current.y = 0
      mouse.current.px = 50
      mouse.current.py = 50
      isHovering = false
    }

    function tick() {
      // Smooth lerp easing
      mouse.current.tx += (mouse.current.x - mouse.current.tx) * 0.085
      mouse.current.ty += (mouse.current.y - mouse.current.ty) * 0.085

      stageEl.style.transform = `perspective(1000px) rotateY(${mouse.current.tx.toFixed(2)}deg) rotateX(${mouse.current.ty.toFixed(2)}deg)`

      const cardEl = stageEl.querySelector('.ec__card')
      if (cardEl) {
        cardEl.style.setProperty('--mouse-x', `${mouse.current.px}%`)
        cardEl.style.setProperty('--mouse-y', `${mouse.current.py}%`)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    stageEl.addEventListener('mousemove', onMouseMove)
    stageEl.addEventListener('mouseleave', onMouseLeave)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      stageEl.removeEventListener('mousemove', onMouseMove)
      stageEl.removeEventListener('mouseleave', onMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  /* ── Master Canvas 2D Renderer (Shared by Ultra-HD & Instagram Story) ── */
  const renderCardToCanvas = useCallback(async (ctx, baseW, baseH, cardEl, scale = 1) => {
    const s = scale
    const cw = baseW * s
    const ch = baseH * s

    // Ensure custom brand fonts (Meursault VF, Barlow Condensed, Amador Font) are fully loaded
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready
      try {
        await Promise.all([
          document.fonts.load(`700 ${Math.round(29.6 * s)}px "Meursault VF"`),
          document.fonts.load(`700 ${Math.round(18.5 * s)}px "Meursault VF"`),
          document.fonts.load(`800 ${Math.round(20 * s)}px "Barlow Condensed"`),
          document.fonts.load(`700 ${Math.round(12 * s)}px "Barlow Condensed"`),
          document.fonts.load(`700 ${Math.round(11 * s)}px "Barlow Condensed"`),
          document.fonts.load(`700 ${Math.round(10 * s)}px "Barlow Condensed"`),
          document.fonts.load(`600 ${Math.round(12.5 * s)}px "Barlow Condensed"`),
        ])
      } catch {
        /* proceed if font loading promise settles */
      }
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 1. Brushed Titanium Base Plate with Rounded Corners
    ctx.save()
    roundRect(ctx, 0, 0, cw, ch, 18 * s)
    ctx.clip()

    let bgLoaded = false
    try {
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.src = '/assets/brand/brushed_titanium_card_bg.png'
      await new Promise((res, rej) => {
        bgImg.onload = res
        bgImg.onerror = rej
        setTimeout(rej, 1500)
      })
      ctx.drawImage(bgImg, 0, 0, cw, ch)
      bgLoaded = true
    } catch {
      // High-grade fallback: Stealth black brushed titanium gradient
      const bgGrad = ctx.createLinearGradient(0, 0, cw * 1.15, ch * 1.15)
      bgGrad.addColorStop(0, '#16181c')
      bgGrad.addColorStop(0.2, '#0f1013')
      bgGrad.addColorStop(0.42, '#14161a')
      bgGrad.addColorStop(0.6, '#0b0c0e')
      bgGrad.addColorStop(0.8, '#101215')
      bgGrad.addColorStop(1, '#050607')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, cw, ch)

      // Fine brushed hairline grain fallback
      for (let j = 0; j < ch; j += 1.5 * s) {
        ctx.fillStyle = (j / s) % 3 === 0 ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.09)'
        ctx.fillRect(0, j, cw, 0.75 * s)
      }
    }

    // Directional specular sheen reflection
    const sheen = ctx.createLinearGradient(0, 0, cw, ch)
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.06)')
    sheen.addColorStop(0.28, 'transparent')
    sheen.addColorStop(0.48, 'rgba(255, 255, 255, 0.09)')
    sheen.addColorStop(0.62, 'transparent')
    sheen.addColorStop(0.88, 'rgba(255, 255, 255, 0.04)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, cw, ch)
    ctx.restore()

    // 2. Dual-Tone Antique Gold / Dark Bronze Metallic Border (2px Bezel)
    ctx.save()
    const goldGrad = ctx.createLinearGradient(0, 0, cw, ch)
    goldGrad.addColorStop(0, '#f5dc9e')
    goldGrad.addColorStop(0.12, '#cba458')
    goldGrad.addColorStop(0.28, '#59441f')
    goldGrad.addColorStop(0.46, '#151109')
    goldGrad.addColorStop(0.60, '#2b2212')
    goldGrad.addColorStop(0.76, '#96773a')
    goldGrad.addColorStop(0.88, '#e5c479')
    goldGrad.addColorStop(1, '#1e180d')

    ctx.strokeStyle = goldGrad
    ctx.lineWidth = 2 * s
    roundRect(ctx, 1 * s, 1 * s, cw - 2 * s, ch - 2 * s, 17 * s)
    ctx.stroke()

    // Inner subtle dark containment hairline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.lineWidth = 1 * s
    roundRect(ctx, 2.5 * s, 2.5 * s, cw - 5 * s, ch - 5 * s, 15.5 * s)
    ctx.stroke()
    ctx.restore()

    // 3. Top Heading: "DEMONIC FUEL" — 3D Sculpted Chrome Relief
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const titleY = 58 * s
    const titleFontSize = Math.round(29.6 * s)
    ctx.font = `700 ${titleFontSize}px "Meursault VF"`

    // Deep physical drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 5 * s
    ctx.shadowOffsetY = 2.5 * s

    // Chrome metallic fill
    const titleGrad = ctx.createLinearGradient(cw / 2, (58 - 30) * s, cw / 2, 58 * s)
    titleGrad.addColorStop(0, '#ffffff')
    titleGrad.addColorStop(0.20, '#f2f5fa')
    titleGrad.addColorStop(0.50, '#9ca5b5')
    titleGrad.addColorStop(0.53, '#5c6373')
    titleGrad.addColorStop(0.80, '#cdd4e0')
    titleGrad.addColorStop(1, '#ffffff')
    ctx.fillStyle = titleGrad
    ctx.fillText('DEMONIC FUEL', cw / 2, titleY)

    // Specular catchlight rim stroke
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
    ctx.lineWidth = 0.6 * s
    ctx.strokeText('DEMONIC FUEL', cw / 2, titleY)
    ctx.restore()

    // 4. Middle Row Left: Metallic EMV Smart Chip
    try {
      const chipImg = new Image()
      chipImg.crossOrigin = 'anonymous'
      chipImg.src = '/assets/brand/demonic_emv_chip.png'
      await new Promise((res, rej) => {
        chipImg.onload = res
        chipImg.onerror = rej
        setTimeout(rej, 1200)
      })
      const chipSize = 58 * s
      const chipX = 40 * s
      const chipY = 118 * s
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 12 * s
      ctx.shadowOffsetY = 5 * s
      ctx.drawImage(chipImg, chipX, chipY, chipSize, chipSize)
      ctx.restore()
    } catch {
      /* proceed */
    }

    // 5. Middle Row Center: 3D Sculpted Silver Oval Medallion
    try {
      const medImg = new Image()
      medImg.crossOrigin = 'anonymous'
      medImg.src = '/assets/brand/demonic_silver_medallion_oval.png'
      await new Promise((res, rej) => {
        medImg.onload = res
        medImg.onerror = rej
        setTimeout(rej, 1200)
      })
      const medW = 136 * s
      const medH = 162 * s
      const medX = (cw - medW) / 2
      const medY = 82 * s
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
      ctx.shadowBlur = 24 * s
      ctx.shadowOffsetY = 8 * s
      ctx.drawImage(medImg, medX, medY, medW, medH)
      ctx.restore()
    } catch {
      /* proceed */
    }

    // 6. Middle Row Right: Crimson QR Code + Motto Subtitle
    const qrSize = 98 * s
    const qrX = cw - (36 + 98) * s
    const qrY = 112 * s

    try {
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = '/assets/brand/qr_standalone_crimson.png'
      await new Promise((res, rej) => {
        qrImg.onload = res
        qrImg.onerror = rej
        setTimeout(rej, 1200)
      })
      ctx.save()
      ctx.shadowColor = 'rgba(234, 9, 23, 0.5)'
      ctx.shadowBlur = 12 * s
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      ctx.restore()
    } catch {
      const qrCanvas = cardEl ? cardEl.querySelector('canvas') : null
      if (qrCanvas) {
        ctx.save()
        ctx.shadowColor = 'rgba(234, 9, 23, 0.5)'
        ctx.shadowBlur = 12 * s
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)
        ctx.restore()
      }
    }

    // Subtitle below QR: "SCAN AT YOUR OWN RISK"
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#ff1e32'
    ctx.font = `700 ${Math.round(10 * s)}px "Barlow Condensed"`
    ctx.shadowColor = 'rgba(255, 30, 50, 0.55)'
    ctx.shadowBlur = 4 * s
    ctx.fillText('SCAN AT YOUR OWN RISK', qrX + qrSize / 2, qrY + qrSize + 16 * s)
    ctx.restore()

    // 7. Bottom Row: PASS NO. & Name (Left), EST. 2026 (Center), FOR THE OBSESSED (Right)
    ctx.save()
    ctx.textBaseline = 'alphabetic'

    // "PASS NO."
    ctx.fillStyle = '#b8c2d1'
    ctx.font = `700 ${Math.round(12 * s)}px "Barlow Condensed"`
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 3 * s
    ctx.fillText('PASS NO.', 40 * s, ch - 56 * s)

    // Member ID (e.g. "DF-8994-C")
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${Math.round(20 * s)}px "Barlow Condensed"`
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 4 * s
    ctx.shadowOffsetY = 1.5 * s
    ctx.fillText(memberId, 40 * s, ch - 34 * s)

    // Member Name in Uppercase
    ctx.fillStyle = '#cfd6e2'
    ctx.font = `600 ${Math.round(12.5 * s)}px "Barlow Condensed"`
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
    ctx.shadowBlur = 2 * s
    ctx.fillText((name || '').toUpperCase(), 40 * s, ch - 18 * s)

    // Bottom Center: Crimson "EST. 2026"
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff2035'
    ctx.font = `700 ${Math.round(18.5 * s)}px "Meursault VF"`
    ctx.shadowColor = 'rgba(255, 32, 53, 0.6)'
    ctx.shadowBlur = 5 * s
    ctx.fillText('EST. 2026', cw / 2, ch - 20 * s)

    // Bottom Right: "FOR THE OBSESSED"
    ctx.textAlign = 'right'
    ctx.fillStyle = '#cbd3df'
    ctx.font = `700 ${Math.round(11 * s)}px "Barlow Condensed"`
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 3 * s
    ctx.fillText('FOR THE OBSESSED', cw - 36 * s, ch - 20 * s)
    ctx.restore()
  }, [memberId, name])

  /* ── Export 1: Ultra-HD 4K Card PNG (2080 × 1312 px, 300+ DPI) ── */
  const downloadCard = useCallback(async () => {
    if (!canvasCardRef.current) return

    const card = canvasCardRef.current
    const scale = 4
    const baseW = 520
    const baseH = 328
    const cw = baseW * scale
    const ch = baseH * scale

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')

    // Solid obsidian background (eliminates any checkerboard transparency)
    ctx.fillStyle = '#0a0a0d'
    ctx.fillRect(0, 0, cw, ch)

    await renderCardToCanvas(ctx, baseW, baseH, card, scale)

    const link = document.createElement('a')
    link.download = `demonic-fuel-founder-card-${memberId || 'pass'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [memberId, renderCardToCanvas])

  /* ── Export 2: Instagram Story Vertical Asset (1080 × 1920 px) ── */
  const downloadStory = useCallback(async () => {
    if (!canvasCardRef.current) return

    const card = canvasCardRef.current
    const sw = 1080
    const sh = 1920

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')

    // 1. Deep Obsidian Velvet Studio Base
    ctx.fillStyle = '#08080a'
    ctx.fillRect(0, 0, sw, sh)

    // 2. Dramatic Overhead Studio Spotlight Cone
    const spotGlow = ctx.createRadialGradient(sw / 2, 280, 0, sw / 2, 750, 1000)
    spotGlow.addColorStop(0, 'rgba(85, 90, 105, 0.32)')
    spotGlow.addColorStop(0.35, 'rgba(30, 32, 40, 0.16)')
    spotGlow.addColorStop(0.7, 'rgba(234, 9, 23, 0.06)')
    spotGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = spotGlow
    ctx.fillRect(0, 0, sw, sh)

    // 3. Cinematic Film Grain Texture
    ctx.save()
    ctx.globalAlpha = 0.035
    for (let i = 0; i < 10000; i++) {
      const gx = Math.random() * sw
      const gy = Math.random() * sh
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
      ctx.fillRect(gx, gy, 1.2, 1.2)
    }
    ctx.restore()

    // 4. Top Branding Section
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(234, 9, 23, 0.9)'
    ctx.font = '700 16px "Barlow Condensed"'
    ctx.letterSpacing = '8px'
    ctx.fillText('FOUNDER PASS ALLOCATION', sw / 2, 420)

    const lineGrad = ctx.createLinearGradient(sw * 0.28, 0, sw * 0.72, 0)
    lineGrad.addColorStop(0, 'transparent')
    lineGrad.addColorStop(0.5, 'rgba(234, 9, 23, 0.75)')
    lineGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = lineGrad
    ctx.fillRect(sw * 0.28, 442, sw * 0.44, 1.5)
    ctx.restore()

    // 5. Render Framed 3D Card Presentation
    const cardW = 520
    const cardH = 328
    const cardScale = 1.75
    const cardCanvas = document.createElement('canvas')
    cardCanvas.width = cardW * 4
    cardCanvas.height = cardH * 4
    const cardCtx = cardCanvas.getContext('2d')

    await renderCardToCanvas(cardCtx, cardW, cardH, card, 4)

    const renderW = cardW * cardScale
    const renderH = cardH * cardScale
    const cardX = (sw - renderW) / 2
    const cardY = 510

    // Tray Cutout Deep Shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 90
    ctx.shadowOffsetY = 36
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    roundRect(ctx, cardX, cardY, renderW, renderH, 18 * cardScale)
    ctx.fill()
    ctx.restore()

    // Draw High-Res Card
    ctx.drawImage(cardCanvas, cardX, cardY, renderW, renderH)

    // 6. Bottom Branding Section
    const bottomLineY = cardY + renderH + 65
    ctx.fillStyle = lineGrad
    ctx.fillRect(sw * 0.28, bottomLineY, sw * 0.44, 1.5)

    ctx.save()
    ctx.textAlign = 'center'
    const brandGrad = ctx.createLinearGradient(0, bottomLineY + 45, 0, bottomLineY + 95)
    brandGrad.addColorStop(0, '#ffffff')
    brandGrad.addColorStop(0.6, '#d0d4de')
    brandGrad.addColorStop(1, '#8e95a2')
    ctx.fillStyle = brandGrad
    ctx.font = '700 46px "Meursault VF"'
    ctx.letterSpacing = '12px'
    ctx.fillText('DEMONIC FUEL', sw / 2, bottomLineY + 85)

    ctx.fillStyle = 'rgba(234, 9, 23, 0.9)'
    ctx.font = '700 15px "Barlow Condensed"'
    ctx.letterSpacing = '8px'
    ctx.fillText('FOR THE OBSESSED', sw / 2, bottomLineY + 125)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.font = '600 13px "Barlow Condensed"'
    ctx.letterSpacing = '6px'
    ctx.fillText('DEMONICFUEL.COM', sw / 2, bottomLineY + 165)
    ctx.restore()

    // Trigger Download
    const link = document.createElement('a')
    link.download = `demonic-fuel-story-${memberId || 'founder'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [memberId, renderCardToCanvas])

  /* ── Reset to Form Phase ── */
  const handleReset = () => {
    setPhase('form')
    setName('')
    setEmail('')
    setPhone('')
    setMemberId('')
    setTagline('')
    setVerifyIdx(0)
  }

  return (
    <section id="founder-pass" className="ec">
      {/* Living atmospheric ambient glow */}
      <div className="ec__ambient" />

      <div className="ec__inner">
        {/* Section Header */}
        <div className="ec__header">
          <LiquidHeadline
            headline="Summon Your Obsession"
            as="h2"
            className="ec__gothic-title"
            isActive={true}
          />
          <LiquidHeadline
            headline="CLAIM YOUR CULT CARD"
            as="h3"
            className="ec__headline"
            isActive={true}
          />
          <p className="ec__desc">
            Join to get exclusive access to inner-circle
          </p>
        </div>

        {/* ───── Phase 1: Input Form ───── */}
        <AnimatePresence mode="wait">
          {phase === 'form' && (
            <motion.form
              key="form"
              className="ec__form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45 }}
            >
              <div className="ec__form-grid">
                <div className="ec__field">
                  <label className="ec__label">01 // NAME</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ec__input"
                    autoComplete="name"
                  />
                </div>
                <div className="ec__field">
                  <label className="ec__label">02 // EMAIL *</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="ec__input"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="ec__field ec__field--full">
                  <label className="ec__label">
                    03 // PHONE *
                  </label>
                  <input
                    type="tel"
                    placeholder="WE WON'T SPAM YOU"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="ec__input"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* Duplicate Email / Error Alert Badge */}
              {errorMessage && (
                <div className="ec__error-badge">
                  <span className="ec__error-icon">⚠</span>
                  <span className="ec__error-text">{errorMessage}</span>
                </div>
              )}

              <button type="submit" className="ec__submit-btn" disabled={isChecking}>
                <span className="ec__submit-text">
                  {isChecking ? 'VERIFYING CREDENTIALS...' : 'JOIN THE CULT'}
                </span>
                <span className="ec__submit-arrow">→</span>
              </button>

              <p className="ec__disclaimer">
                ❖ NO SPAM. NO SIGNAL.
              </p>
            </motion.form>
          )}

          {/* ───── Phase 2: Cinematic Verification ───── */}
          {phase === 'verifying' && (
            <motion.div
              key="verify"
              className="ec__verify-wrap"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
            >
              <div className="ec__verify-terminal">
                {/* Neon scanning laser line */}
                <div className="ec__scan-laser" />

                <div className="ec__verify-header">
                  <span className="ec__verify-badge">ENCRYPTION ENGINE // ACTIVE</span>
                </div>

                <div className="ec__verify-list">
                  {VERIFY_STEPS.map((stepMsg, i) => (
                    <motion.div
                      key={i}
                      className={`ec__verify-item ${i <= verifyIdx ? 'is-active' : ''} ${i === verifyIdx ? 'is-current' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: i <= verifyIdx ? 1 : 0.18, x: 0 }}
                      transition={{ duration: 0.28, delay: i * 0.04 }}
                    >
                      <span className="ec__verify-indicator" />
                      <span className="ec__verify-text">{stepMsg}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── Phase 3: Generated 3D Founder Card ───── */}
          {phase === 'card' && (
            <motion.div
              key="card"
              className="ec__card-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Luxury Presentation Tray with Studio Spotlight */}
              <div className="ec__unboxing-tray">
                <div className="ec__tray-spotlight" />

                {/* 3D Tilt Physics Stage */}
                <div className="ec__card-stage" ref={tiltRef}>
                  <div className="ec__card" ref={canvasCardRef}>
                    {/* Dynamic Cursor-Following Specular Sheen */}
                    <div className="ec__card-sheen" />

                    {/* Dual-Tone Metallic 2px Antique Gold / Dark Bronze Border */}
                    <div className="ec__card-border" />

                    {/* Stealth Hairline Brushed Titanium Texture */}
                    <div className="ec__card-brushed-grain" />

                    {/* 1. TOP HEADER: 3D Chrome Embossed DEMONIC FUEL */}
                    <div className="ec__card-header">
                      <h4 className="ec__card-title-embossed">DEMONIC FUEL</h4>
                    </div>

                    {/* 2. MIDDLE ROW: Chip (Left) + Medallion (Center) + QR (Right) */}
                    <div className="ec__card-middle">
                      {/* Left: Metallic EMV Smart Chip */}
                      <div className="ec__card-chip-wrap">
                        <img
                          src="/assets/brand/demonic_emv_chip.png"
                          alt="EMV Chip"
                          className="ec__card-chip-img"
                        />
                      </div>

                      {/* Center: 3D Sculpted Silver Oval Medallion */}
                      <div className="ec__card-medallion-wrap">
                        <img
                          src="/assets/brand/demonic_silver_medallion_oval.png"
                          alt="Demonic Silver Seal"
                          className="ec__card-medallion-img"
                        />
                      </div>

                      {/* Right: Crimson QR Code + Motto */}
                      <div className="ec__card-qr-block">
                        <div className="ec__card-qr-wrap">
                          <QRCodeCanvas
                            value={SITE_URL}
                            size={98}
                            bgColor="transparent"
                            fgColor="#ea0917"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <span className="ec__card-qr-motto">SCAN AT YOUR OWN RISK</span>
                      </div>
                    </div>

                    {/* 3. BOTTOM ROW: PASS NO. & Name (Left) + EST. 2026 (Center) + FOR THE OBSESSED (Right) */}
                    <div className="ec__card-bottom">
                      <div className="ec__card-pass-block">
                        <span className="ec__card-pass-label">PASS NO.</span>
                        <span className="ec__card-pass-number">{memberId}</span>
                        <span className="ec__card-member-name">{(name || '').toUpperCase()}</span>
                      </div>

                      <div className="ec__card-est-block">
                        <span className="ec__card-est-text">EST. 2026</span>
                      </div>

                      <div className="ec__card-risk-block">
                        <span className="ec__card-risk-text">FOR THE OBSESSED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Motto Badge */}
              {tagline && (
                <div className="ec__tagline-reveal">
                  <span className="ec__tagline-pre">ASSIGNED MOTTO //</span>
                  <span className="ec__tagline-quote">"{tagline}"</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="ec__card-actions">
                <button
                  type="button"
                  className="ec__download-btn"
                  onClick={downloadCard}
                  title="Download 4X Ultra-HD 300+ DPI PNG"
                >
                  <span className="ec__btn-label">DOWNLOAD CARD</span>
                  <span className="ec__btn-symbol">↓</span>
                </button>

                <button
                  type="button"
                  className="ec__reset-btn"
                  onClick={handleReset}
                  title="Generate another Founder Pass"
                >
                  GENERATE ANOTHER
                </button>
              </div>

              <p className="ec__card-note">
                ❖ Scan the crimson QR code with any mobile device to immediately activate your allocation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
