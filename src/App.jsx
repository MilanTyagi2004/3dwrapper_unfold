import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import DemonicStrips from './components/DemonicStrips'
import EmailCollect from './components/founder card/EmailCollect'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <CustomCursor />
      <Navbar />
      <HeroSection />
      <div className="below-hero-wrapper">
        <DemonicStrips />
        <EmailCollect />
        <Footer />
      </div>
    </div>
  )
}

export default App
