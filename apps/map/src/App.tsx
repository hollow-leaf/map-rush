import { useRef, useState } from 'react' // Changed from mapboxgl to maplibregl
import maplibregl from 'maplibre-gl'; // Added import for maplibregl
import './App.css'
import MapComponent from './components/map/MapComponent'
import BabylonMapController from './components/map/BabylonMapLayer' // Updated import
import Navbar from './components/Navbar'

function App() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const handleMapReady = (map: maplibregl.Map) => {
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
        {isMapReady && mapRef.current && <BabylonMapController map={mapRef.current} />} 
      </div>
    </div>
  )
}

export default App