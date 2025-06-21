import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { CustomLayerInterface, Map as MaplibreMap } from 'maplibre-gl';
import { BabylonGame } from '../../lib/BabylonGame';
import { Matrix, Vector3, Scene } from '@babylonjs/core'; // Removed HemisphericLight, Tools

// Define the structure for the BabylonLayer to hold the game instance
interface BabylonLayerType extends CustomLayerInterface {
    babylonGame?: BabylonGame;
    map?: MaplibreMap; // Keep a reference to the map
}

class BabylonLayerImpl implements BabylonLayerType {
    id: string;
    type: 'custom';
    renderingMode: '3d' | '2d';
    public babylonGame?: BabylonGame;
    public map?: MaplibreMap;

    constructor(id: string = 'babylon-layer') {
        this.id = id;
        this.type = 'custom';
        this.renderingMode = '3d';
    }

    async onAdd(map: MaplibreMap, _gl: WebGLRenderingContext) { // gl context not directly used by BabylonGame initialize
        this.map = map;
        const mapCanvas = map.getCanvas();
        this.babylonGame = new BabylonGame();
        
        // Initialize BabylonGame, but don't start its own render loop
        this.babylonGame.initialize(mapCanvas, false); 
        
        try {
            // Load the 3D model using the new method in BabylonGame
            await this.babylonGame.loadCarModelAndSetup('https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf');
            console.log("Babylon model loaded and setup successfully by BabylonLayer.");

            // Setup keyboard controls after model is loaded
            this.babylonGame.setupKeyboardControls();

        } catch (error) {
            console.error("Error loading model in BabylonLayer:", error);
        }
    }

    render(_gl: WebGLRenderingContext, matrix: number[]) { // gl context not directly used
        if (!this.babylonGame || !this.babylonGame.getSceneInstance() || !this.babylonGame.getEngineInstance() || !this.babylonGame.getCarModel()) {
            if (this.map) this.map.triggerRepaint();
            return;
        }

        const scene = this.babylonGame.getSceneInstance() as Scene; // scene is now guaranteed
        // const engine = this.babylonGame.getEngineInstance()!; // engine is guaranteed but not directly used here after refactor

        // The active camera is now managed within BabylonCamera, accessed via babylonGame
        const activeCamera = this.babylonGame.babylonCamera?.getActiveCamera();

        if (activeCamera) {
            const maplibreMatrix = Matrix.FromArray(matrix);
            activeCamera.freezeProjectionMatrix(maplibreMatrix);
            this.babylonGame.renderScene();
        }
        
        if (this.map) {
            this.map.triggerRepaint();
        }
    }

    onRemove() {
        if (this.babylonGame) {
            this.babylonGame.dispose();
            this.babylonGame = undefined;
        }
        console.log("BabylonLayer removed and babylonGame disposed.");
    }
}

interface BabylonMapControllerProps {
  map: MaplibreMap | null; 
}

const BabylonMapController: React.FC<BabylonMapControllerProps> = ({ map }) => {
  const babylonLayerRef = useRef<BabylonLayerImpl | null>(null);
  const babylonGameInstanceRef = useRef<BabylonGame | null>(null); // Still useful for direct calls from UI
  const [modelPosition, setModelPosition] = useState<{ lng: number, lat: number, babylonX: number, babylonZ: number } | null>(null);
  const [cameraView, setCameraView] = useState<'ground' | 'sky'>('sky'); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (map && !babylonLayerRef.current) {
      console.log("Map instance available. Adding BabylonLayer.");
      const layer = new BabylonLayerImpl('babylon-custom-layer');
      babylonLayerRef.current = layer;
      
      // Asynchronously add layer and then try to get game instance.
      // onAdd is async, so babylonGame might not be immediately available.
      map.addLayer(layer);

      const setupGameLink = async () => {
        // Wait for babylonGame to be initialized within the layer
        // This polling mechanism is kept, but consider promises/callbacks from onAdd if possible in future refactor of layer itself
        let attempts = 0;
        const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)
        const intervalId = setInterval(async () => {
          attempts++;
          if (babylonLayerRef.current?.babylonGame && babylonLayerRef.current.babylonGame.getCarModel()) {
            babylonGameInstanceRef.current = babylonLayerRef.current.babylonGame;
            setIsLoading(false);
            console.log("BabylonGame instance (with model) captured in React component.");
            
            // Setup position update callback from the main BabylonGame instance
            babylonGameInstanceRef.current.onCarMoved = (pos, _isSprinting) => {
              // TODO: Coordinate transformation needed here
              setModelPosition({ lng: -74.006, lat: 40.7128, babylonX: pos.x, babylonZ: pos.z });
            };
            clearInterval(intervalId);
          } else if (babylonLayerRef.current?.babylonGame && !babylonLayerRef.current.babylonGame.getCarModel()) {
            // Game instance is there, but model not yet. This is normal during async load.
            // The isLoading state will remain true until model is confirmed.
            // console.log("BabylonGame instance captured, waiting for model...");
          } else if (attempts > maxAttempts) {
            console.error("Failed to capture BabylonGame instance after multiple attempts.");
            setIsLoading(false); // Stop loading indicator to prevent infinite loading state
            clearInterval(intervalId);
          }
        }, 100);
      };

      setupGameLink();

      return () => {
        console.log("Cleaning up BabylonMapController: Removing layer.");
        // clearInterval is handled by setupGameLink's scope if interval is still running
        if (map && babylonLayerRef.current && map.getLayer(babylonLayerRef.current.id)) {
          map.removeLayer(babylonLayerRef.current.id); 
        }
        babylonLayerRef.current = null; 
        babylonGameInstanceRef.current = null;
      };
    }
  }, [map]);

  const handleSetCameraView = (view: 'sky' | 'ground') => {
    setCameraView(view);
    if (babylonGameInstanceRef.current) {
      // Call new method on BabylonGame, which delegates to BabylonCamera
      babylonGameInstanceRef.current.setCameraViewType(view);
    } else {
      console.warn("BabylonGame instance not available to set camera view.");
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (babylonGameInstanceRef.current) {
      // Calls new methods on BabylonGame, which delegate to BabylonControls
      switch (direction) {
        case 'up':
          babylonGameInstanceRef.current.triggerMovement('forward');
          break;
        case 'down':
          babylonGameInstanceRef.current.triggerMovement('backward');
          break;
        case 'left':
          babylonGameInstanceRef.current.triggerRotation('left');
          break;
        case 'right':
          babylonGameInstanceRef.current.triggerRotation('right');
          break;
      }
    } else {
      console.warn("BabylonGame instance not available for UI move command.");
    }
  };

  return (
    <>
      {isLoading && (
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow z-50">
          Loading 3D Model & Babylon Scene...
        </p>
      )}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-50 text-xs">
        <p className="font-bold">Babylon Layer Control</p>
        {modelPosition ? (
          <>
            <p>Map Lng: {modelPosition.lng.toFixed(4)} (Placeholder)</p>
            <p>Map Lat: {modelPosition.lat.toFixed(4)} (Placeholder)</p>
            <p>Babylon X: {modelPosition.babylonX.toFixed(2)}</p>
            <p>Babylon Z: {modelPosition.babylonZ.toFixed(2)}</p>
          </>
        ) : (
          <p>Model position not yet available.</p>
        )}
      </div>
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-50">
        <button
          onClick={() => handleSetCameraView('sky')}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 text-xs rounded ${cameraView === 'sky' ? 'bg-blue-700' : ''}`}
        >
          Sky View (Babylon Cam)
        </button>
        <button
          onClick={() => handleSetCameraView('ground')}
          className={`bg-teal-500 hover:bg-teal-700 text-white font-bold py-1 px-2 text-xs rounded ${cameraView === 'ground' ? 'bg-teal-700' : ''}`}
        >
          Ground View (Babylon Cam)
        </button>
      </div>
      {/* Movement Control Buttons */}
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
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 text-xl" 
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

export default BabylonMapController;
