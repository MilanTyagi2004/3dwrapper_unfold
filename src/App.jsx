import React from 'react'
import Navbar from './components/Navbar'
import DemonicStrips from './components/DemonicStrips'
import EmailCollect from './components/founder card/EmailCollect'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <DemonicStrips />
      <EmailCollect />
    </div>
  )
}

export default App
