import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import DemonicStrips from './components/DemonicStrips'
import EmailCollect from './components/founder card/EmailCollect'
import FaqSection from './components/FaqSection'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import NotFound from './components/NotFound'
import './App.css'

function isHomeRoute() {
  const path = window.location.pathname.toLowerCase()
  return path === '/' || path === ''
}

function App() {
  const [isHome, setIsHome] = useState(isHomeRoute)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsHome(isHomeRoute())
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  if (!isHome) {
    return <NotFound />
  }

  return (
    <div className="app-container">
      <CustomCursor />
      <Navbar />
      <HeroSection />
      <div className="below-hero-wrapper">
        <DemonicStrips />
        <EmailCollect />
        <FaqSection />
        <Footer />
      </div>
    </div>
  )
}

export default App

