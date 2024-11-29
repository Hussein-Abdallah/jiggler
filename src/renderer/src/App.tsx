import React, { useState, useCallback } from 'react'
import './App.css'

interface Window {
  electron: {
    startJiggling: (interval: number) => void
    stopJiggling: () => void
  }
}

declare const window: Window

function App(): React.ReactElement {
  const [isJiggling, setIsJiggling] = useState(false)
  const [interval, setInterval] = useState(60)

  const handleToggle = useCallback((): void => {
    if (isJiggling) {
      window.electron.stopJiggling()
    } else {
      window.electron.startJiggling(interval)
    }
    setIsJiggling(!isJiggling)
  }, [isJiggling, interval])

  const handleIntervalChange = useCallback((newInterval: number): void => {
    setInterval(newInterval)
    if (isJiggling) {
      window.electron.startJiggling(newInterval)
    }
  }, [isJiggling])

  return (
    <div className="container">
      <h1>Mouse Jiggler</h1>
      <button 
        className={`toggle-button ${isJiggling ? 'active' : ''}`} 
        onClick={handleToggle}
      >
        {isJiggling ? 'Stop Jiggling' : 'Start Jiggling'}
      </button>

      <div className="interval-section">
        <h3>Interval</h3>
        {[30, 60, 120, 300].map((seconds) => (
          <div key={seconds} className="interval-option">
            <input
              type="radio"
              id={`${seconds}sec`}
              name="interval"
              value={seconds}
              checked={interval === seconds}
              onChange={() => handleIntervalChange(seconds)}
            />
            <label htmlFor={`${seconds}sec`}>{seconds} seconds</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
