import { useRef, useEffect, useState } from 'react'
import './App.css'
import MapComponent from './components/map/MapComponent'
import GameController from './components/game/GameController'
import Navbar from './components/Navbar'

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const handleMapReady = (map: mapboxgl.Map) => {
    mapRef.current = map
    // Wait for the map to be fully loaded
    map.on('load', () => {
      setIsMapReady(true)
    })
  }

  return (
    <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
      <Navbar />
      <div className="flex-grow relative">
        <MapComponent onMapReady={handleMapReady} />
        {isMapReady && mapRef.current && <GameController map={mapRef.current} />}
      </div>
    </div>
  )
}

export default App