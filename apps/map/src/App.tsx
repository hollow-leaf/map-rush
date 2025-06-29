import { useRef, useState, useCallback, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import './App.css'
import MapComponent from './components/map/MapComponent'
import Navbar from './components/Navbar'
import BabylonScene from './components/BabylonScene';
import Joystick from './components/Joystick';
import ModelSelector from './components/ModelSelector'; // Import ModelSelector

import MagicProvider from './components/magic/MagicProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from '@/components/magic/Login'
import Dashboard from '@/components/magic/Dashboard'
import MagicDashboardRedirect from '@/components/magic/MagicDashboardRedirect'

function App() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null); // Default to no specific model (or your placeholder)
  const [token, setToken] = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('token') ?? '')
  }, [setToken])

  const handleModelSelect = (modelUrl: string | null) => {
    setSelectedModelUrl(modelUrl);
  };

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
    <MagicProvider>
      <ToastContainer />
      {import.meta.env.VITE_MAGIC_API_KEY ? (
        token.length > 0 ? (
          // <Dashboard token={token} setToken={setToken} />
          <div className="flex flex-col h-[100vh] w-[100vw] overflow-hidden">
            <Navbar token={token} setToken={setToken} />
            <div className="flex-grow relative"> {/* Map container takes full space */}
              <MapComponent onMapReady={handleMapReady} />
              <ModelSelector onSelectModel={handleModelSelect} currentModelUrl={selectedModelUrl} />

              {/* Babylon Scene as a centered overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[250px] z-[5]">
                <BabylonScene modelUrl={selectedModelUrl} />
              </div>

              {/* Joystick Overlay */}
              <div className="absolute bottom-[60px] left-[60px] z-[10]">
                <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} size={120} stickSize={60} />
              </div>
            </div>
          </div>
        ) : (
          <Login token={token} setToken={setToken} />
        )
      ) : (
        <MagicDashboardRedirect />
      )}
    </MagicProvider>
  )
}

export default App