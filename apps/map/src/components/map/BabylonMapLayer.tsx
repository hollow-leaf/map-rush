import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { CustomLayerInterface, Map as MaplibreMap } from 'maplibre-gl';
import { BabylonGame } from '../../lib/BabylonGame';
import { Matrix, Vector3, HemisphericLight, Tools, Scene } from '@babylonjs/core';

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

    async onAdd(map: MaplibreMap, gl: WebGLRenderingContext) {
        this.map = map;
        const mapCanvas = map.getCanvas();
        this.babylonGame = new BabylonGame();
        
        // Initialize BabylonGame, but don't start its own render loop
        this.babylonGame.initialize(mapCanvas, false); 
        
        // Add a light if not already present (BabylonGame adds one, this is illustrative)
        // if (this.babylonGame.getScene()) {
        //   new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.babylonGame.getScene()!);
        // }

        try {
            // Load the 3D model
            await this.babylonGame.loadModel('https://maplibre.org/maplibre-gl-js/docs/assets/low_poly_truck/scene.gltf');
            console.log("Babylon model loaded successfully by BabylonLayer.");

            // Setup keyboard controls after model is loaded
            this.babylonGame.setupKeyboardControls();

        } catch (error) {
            console.error("Error loading model in BabylonLayer:", error);
        }
    }

    render(gl: WebGLRenderingContext, matrix: number[]) {
        if (!this.babylonGame || !this.babylonGame.getScene() || !this.babylonGame.getEngine() || !this.babylonGame.getCarModel()) {
            // console.warn("Babylon components not ready for rendering or model not loaded.");
            if (this.map) this.map.triggerRepaint(); // Still trigger repaint to keep map responsive
            return;
        }

        const scene = this.babylonGame.getScene() as Scene; // scene is now guaranteed by the check
        const engine = this.babylonGame.getEngine()!; // engine is now guaranteed

        if (scene.activeCamera) {
            // Create MapLibre matrix from array
            const maplibreMatrix = Matrix.FromArray(matrix);
            
            // Update Babylon camera
            // The MapLibre example uses freezeProjectionMatrix.
            // It implies that MapLibre controls the projection and view matrices.
            scene.activeCamera.freezeProjectionMatrix(maplibreMatrix);

            // Render the Babylon scene
            this.babylonGame.renderScene();
        } else {
            // console.warn("Babylon scene has no active camera.");
        }
        
        if (this.map) {
            this.map.triggerRepaint(); // Ensure MapLibre GL JS continues its render loop.
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
  map: MaplibreMap | null; // Accept null initially
}

const BabylonMapController: React.FC<BabylonMapControllerProps> = ({ map }) => {
  const babylonLayerRef = useRef<BabylonLayerImpl | null>(null);
  const babylonGameInstanceRef = useRef<BabylonGame | null>(null);
  const [modelPosition, setModelPosition] = useState<{ lng: number, lat: number, babylonX: number, babylonZ: number } | null>(null);
  const [cameraView, setCameraView] = useState<'ground' | 'sky'>('sky'); // Default to 'sky' view
  const [isLoading, setIsLoading] = useState(true); // For loading indicator

  // Effect to add and remove the Babylon layer
  useEffect(() => {
    if (map && !babylonLayerRef.current) {
      console.log("Map instance available. Adding BabylonLayer.");
      const layer = new BabylonLayerImpl('babylon-custom-layer');
      babylonLayerRef.current = layer;
      map.addLayer(layer);
      
      // Store the babylonGame instance once it's created in onAdd
      // This requires a bit of a workaround or direct access if onAdd is synchronous enough
      // For now, we'll assume onAdd completes and sets babylonGame on the layer instance
      // A better approach might be for onAdd to return the game instance or use a callback
      
      // Attempt to get game instance after a short delay or via a callback if possible
      // For simplicity, directly accessing after addLayer. onAdd is async due to loadModel.
      // We need a way to get the babylonGame instance to the React component.
      // Modify BabylonLayerImpl to store babylonGame instance and provide a getter or make it public.
      
      // Polling for babylonGame instance (simple way, can be improved with promises/callbacks)
      const intervalId = setInterval(() => {
        if (babylonLayerRef.current?.babylonGame) {
          babylonGameInstanceRef.current = babylonLayerRef.current.babylonGame;
          setIsLoading(false); // Model loading is part of onAdd, so consider it loaded here
          console.log("BabylonGame instance captured in React component.");
          
          // Setup position update callback
          babylonGameInstanceRef.current.onCarMoved = (pos, isSprinting) => {
            // TODO: Coordinate transformation needed here
            // For now, just display Babylon coords and dummy LngLat
            setModelPosition({ lng: -74.006, lat: 40.7128, babylonX: pos.x, babylonZ: pos.z });
          };
          clearInterval(intervalId);
        }
      }, 100);


      return () => {
        console.log("Cleaning up BabylonMapController: Removing layer.");
        clearInterval(intervalId);
        if (map && babylonLayerRef.current && map.getLayer(babylonLayerRef.current.id)) {
          map.removeLayer(babylonLayerRef.current.id);
          // onRemove on the layer instance should be called by map.removeLayer
        }
        babylonLayerRef.current = null; // Clear the ref
        babylonGameInstanceRef.current = null;
      };
    }
  }, [map]); // Rerun if map instance changes

  const handleSetCameraView = (view: 'sky' | 'ground') => {
    setCameraView(view);
    if (babylonGameInstanceRef.current) {
      babylonGameInstanceRef.current.setCameraViewType(view);
    } else {
      console.warn("BabylonGame instance not available to set camera view.");
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (babylonGameInstanceRef.current) {
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
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 text-xl" // No rounded-b for this one to merge visually
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
