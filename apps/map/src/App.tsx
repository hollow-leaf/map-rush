import { useRef, useState } from 'react' 
import maplibregl from 'maplibre-gl'; 
import './App.css'
import MapComponent from './components/map/MapComponent'
import Navbar from './components/Navbar'

function App() {
  const mapRef = useRef<maplibregl.Map | null>(null)

  const handleMapReady = (map: maplibregl.Map) => {
    mapRef.current = map
  }

  return (
    <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
      <Navbar />
      <div className="flex-grow relative">
        <MapComponent onMapReady={handleMapReady} />
      </div>
    </div>
  )
}

export default App