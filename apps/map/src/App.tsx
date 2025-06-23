import { useRef, useState, useCallback, useEffect } from 'react'; // Added useEffect
import maplibregl from 'maplibre-gl';
import './App.css'
import MapComponent from './components/map/MapComponent'
import Navbar from './components/Navbar'
import BabylonScene from './components/BabylonScene';
import Joystick from './components/Joystick'; // Import Joystick

function App() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  const handleMapReady = (map: maplibregl.Map) => {
    mapRef.current = map;
  };

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickData({ x, y });
  }, []);

  const handleJoystickEnd = useCallback(() => {
    setJoystickData({ x: 0, y: 0 });
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || (joystickData.x === 0 && joystickData.y === 0)) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    const panSpeed = 5; // Adjust this value to change panning speed

    let isPanning = true;

    const panMap = () => {
      if (!isPanning || !mapRef.current) return;

      const currentCenter = map.getCenter();
      const newLng = currentCenter.lng + joystickData.x * panSpeed * 0.01; // Adjust multiplier for desired sensitivity
      const newLat = currentCenter.lat + joystickData.y * panSpeed * 0.01; // Adjust multiplier for desired sensitivity

      map.setCenter([newLng, newLat]);

      if (isPanning) {
        animationFrameRef.current = requestAnimationFrame(panMap);
      }
    };

    if (joystickData.x !== 0 || joystickData.y !== 0) {
      animationFrameRef.current = requestAnimationFrame(panMap);
    }

    return () => {
      isPanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [joystickData, mapRef]);


  return (
    <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
      <Navbar />
      <div className="flex-grow relative"> {/* Map container takes full space */}
        <MapComponent onMapReady={handleMapReady} />

        {/* Babylon Scene as a centered overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px', // Or a percentage
          height: '250px', // Or a percentage
          zIndex: 5, // Higher than map, lower than joystick/navbar if they overlay it
          // border: '2px solid red', // For debugging layout
        }}>
          <BabylonScene />
        </div>

        {/* Joystick Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '60px', // Adjusted for potentially larger joystick
          left: '60px',  // Adjusted
          zIndex: 10, // Highest z-index
        }}>
          <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} size={120} stickSize={60} />
        </div>
      </div>
    </div>
  )
}

export default App