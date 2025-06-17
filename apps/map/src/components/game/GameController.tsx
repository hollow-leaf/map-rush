import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { loadCarModelToMap } from '../map/loadCarModel';

// This should match the CustomLayerImplementation in loadCarModel.ts
interface CustomLayer {
  id: string;
  type: 'custom';
  renderingMode: '3d';
  modelTransform: { // No longer optional
    translateX: number;
    translateY: number;
    translateZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scale: number;
  };
  onAdd: (map: mapboxgl.Map, gl: WebGLRenderingContext) => Promise<void>;
  // If CustomLayerImplementation from loadCarModel.ts has other properties like
  // camera, scene, renderer, onAdd, render, they should be listed here too for consistency,
  // or this interface should be imported/shared. For now, only modelTransform is critical.
}

interface GameControllerProps {
  map: mapboxgl.Map;
}

const GameController = ({ map }: GameControllerProps) => {
  const modelPositionRef = useRef({ lng: -74.006, lat: 40.7128 }); // Initial position
  const modelLayerRef = useRef<ReturnType<typeof loadCarModelToMap>>(undefined); // Ref to store the custom layer
  const [speed, setSpeed] = useState(0.0001); // Normal speed
  const [isSprinting, setIsSprinting] = useState(false); // Sprint state
  const animationFrameIdRef = useRef<number | null>(null); // Ref to store animation frame id
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [cameraView, setCameraView] = useState<'ground' | 'sky'>('sky');

  // Effect to load the model once
  useEffect(() => {
    if (map && !modelLayerRef.current) {
      console.log('Attempting to load model...');
      setIsLoadingModel(true); // Set loading to true
      const layer = loadCarModelToMap(
        map,
        modelPositionRef.current.lng,
        modelPositionRef.current.lat,
        'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf'  // Using Mapbox example model
      );
      
      if (layer) {
        modelLayerRef.current = layer;
        // Wait for the model to be loaded
        layer.onAdd(map, map.painter.context.gl).then(() => {
          console.log('Model loaded successfully');
          setIsModelLoaded(true);
          setIsLoadingModel(false); // Set loading to false
        }).catch((error: Error) => {
          console.error('Failed to load model:', error);
          setIsLoadingModel(false); // Set loading to false
        });
      }
    }
  }, [map]);

  // Effect for animation loop
  useEffect(() => {
    if (!isModelLoaded) return;

    const animate = () => {
      if (map && modelLayerRef.current && modelLayerRef.current.modelTransform) {
        const newMercatorPosition = mapboxgl.MercatorCoordinate.fromLngLat(
          { lng: modelPositionRef.current.lng, lat: modelPositionRef.current.lat },
          0
        );
        modelLayerRef.current.modelTransform.translateX = newMercatorPosition.x;
        modelLayerRef.current.modelTransform.translateY = newMercatorPosition.y;
        map.triggerRepaint();
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [map, isModelLoaded]);


  useEffect(() => {
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          modelPositionRef.current.lat += speed
          break
        case 'ArrowDown':
          modelPositionRef.current.lat -= speed
          break
        case 'ArrowLeft':
          modelPositionRef.current.lng -= speed
          break
        case 'ArrowRight':
          modelPositionRef.current.lng += speed
          break
        case 'Shift': // Sprint key
          setIsSprinting(true)
          setSpeed(0.0003) // Faster speed
          break
      }
      // Update the map center to follow the model
      map.setCenter([modelPositionRef.current.lng, modelPositionRef.current.lat]);
      // No need to reload the model here, the animation loop will update its position
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsSprinting(false)
        setSpeed(0.0001) // Normal speed
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [map, speed]); // Keep speed in dependencies if it affects other logic not shown

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'up':
        modelPositionRef.current.lat += speed;
        break;
      case 'down':
        modelPositionRef.current.lat -= speed;
        break;
      case 'left':
        modelPositionRef.current.lng -= speed;
        break;
      case 'right':
        modelPositionRef.current.lng += speed;
        break;
    }
    map.setCenter([modelPositionRef.current.lng, modelPositionRef.current.lat]);
  };

  const setMapView = (view: 'ground' | 'sky') => {
    setCameraView(view);
    let cameraOptions: Partial<mapboxgl.CameraOptions & mapboxgl.AnimationOptions>;

    if (view === 'sky') {
      cameraOptions = {
        pitch: 45,
        zoom: 15, 
        center: [modelPositionRef.current.lng, modelPositionRef.current.lat],
        duration: 1000,
      };
    } else { 
      cameraOptions = {
        pitch: 70,
        zoom: 20,  
        center: [modelPositionRef.current.lng, modelPositionRef.current.lat],
        duration: 1000,
      };
    }
    map.easeTo(cameraOptions);
  };

  return (
    <>
      {isLoadingModel && <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow z-50">Loading 3D Model...</p>}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-50">
        <p>Speed: {isSprinting ? 'Sprinting' : 'Normal'}</p>
        <p className="text-xs">Lng: {modelPositionRef.current.lng.toFixed(4)}</p>
        <p className="text-xs">Lat: {modelPositionRef.current.lat.toFixed(4)}</p>
      </div>
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-50">
        <button
          onClick={() => setMapView('sky')}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${cameraView === 'sky' ? 'bg-blue-700' : ''}`}
        >
          Sky View
        </button>
        <button
          onClick={() => setMapView('ground')}
          className={`bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded ${cameraView === 'ground' ? 'bg-teal-700' : ''}`}
        >
          Ground View
        </button>
      </div>
      <div className="absolute bottom-8 right-8 flex flex-col items-center z-50">
        <button
          aria-label="Move Up"
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-t-lg text-xl"
          onClick={() => handleMove('up')}
        >
          ▲
        </button>
        <div className="flex">
          <button
            aria-label="Move Left"
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-l-lg text-xl"
            onClick={() => handleMove('left')}
          >
            ◄
          </button>
          <button
            aria-label="Move Down"
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-b-none text-xl" // No rounded-b for this one to merge with left/right
            onClick={() => handleMove('down')}
          >
            ▼
          </button>
          <button
            aria-label="Move Right"
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-r-lg text-xl"
            onClick={() => handleMove('right')}
          >
            ►
          </button>
        </div>
      </div>
    </>
  );
};

export default GameController;