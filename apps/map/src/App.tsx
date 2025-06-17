import { useRef, useEffect } from 'react'
import './App.css'
import MapComponent from './components/map/MapComponent'
import GameController from './components/game/GameController'
import Navbar from './components/Navbar'

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const handleMapReady = (map: mapboxgl.Map) => {
    mapRef.current = map
  }

  return (
    <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
      <Navbar />
      <div className="flex-grow">
        <MapComponent onMapReady={handleMapReady} />
        {mapRef.current && <GameController map={mapRef.current} />}
      </div>
    </div>
  )
}

export default App