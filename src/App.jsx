import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import DemonicStrips from './components/DemonicStrips'
import EmailCollect from './components/founder card/EmailCollect'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <HeroSection />
      <div className="below-hero-wrapper">
        <DemonicStrips />
        <EmailCollect />
      </div>
    </div>
  )
}

export default App
