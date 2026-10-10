import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import DemonicStrips from './components/DemonicStrips'
import EmailCollect from './components/founder card/EmailCollect'
import FaqSection from './components/FaqSection'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import AdminPortal from './components/AdminPortal'
import './App.css'

function checkIsAdminRoute() {
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  return (
    path.startsWith('/admin') ||
    path.startsWith('/export') ||
    path.startsWith('/portal') ||
    hash === '#admin' ||
    hash === '#export'
  )
}

function App() {
  const [isAdmin, setIsAdmin] = useState(checkIsAdminRoute)

  useEffect(() => {
    const onLocationChange = () => {
      setIsAdmin(checkIsAdminRoute())
    }
    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('hashchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
    }
  }, [])

  if (isAdmin) {
    return (
      <div className="app-container app-container--admin">
        <CustomCursor />
        <AdminPortal />
      </div>
    )
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
