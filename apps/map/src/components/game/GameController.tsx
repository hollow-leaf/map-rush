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

  // Effect to load the model once
  useEffect(() => {
    if (map && !modelLayerRef.current) {
      console.log('Attempting to load model...');
      const layer = loadCarModelToMap(
        map,
        modelPositionRef.current.lng,
        modelPositionRef.current.lat,
        '/assets/chicken.glb'
      );
      
      if (layer) {
        modelLayerRef.current = layer;
        // Wait for the model to be loaded
        layer.onAdd(map, map.getCanvas().getContext('webgl')!).then(() => {
          console.log('Model loaded successfully');
          setIsModelLoaded(true);
        }).catch((error: Error) => {
          console.error('Failed to load model:', error);
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

  return (
    <>
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-50">
        <p>Speed: {isSprinting ? 'Sprinting' : 'Normal'}</p>
        <p className="text-xs">Lng: {modelPositionRef.current.lng.toFixed(4)}</p>
        <p className="text-xs">Lat: {modelPositionRef.current.lat.toFixed(4)}</p>
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