import { useEffect, useRef, useState } from 'react';
import mapboxgl, { CustomLayerInterface } from 'mapbox-gl'; // Import CustomLayerInterface
import { BabylonGame } from '../../lib/BabylonGame';
// import { loadBabylonModel } from '../map/loadBabylonModel'; // This function might be simplified or its role changed

interface GameControllerProps {
  map: mapboxgl.Map;
}

const GameController = ({ map }: GameControllerProps) => {
  const modelPositionRef = useRef({ lng: -74.006, lat: 40.7128 }); // Initial position, will be updated by Babylon
  const initialLngLatRef = useRef({ lng: -74.0060, lat: 40.7128 }); // Default starting point on map
  const babylonGameRef = useRef<BabylonGame | null>(null);
  const [isSprinting, setIsSprinting] = useState(false); // State for sprint status
  // const animationFrameIdRef = useRef<number | null>(null); // Will be removed as onCarMoved handles updates
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [cameraView, setCameraView] = useState<'ground' | 'sky'>('sky');

  useEffect(() => {
    if (map && !babylonGameRef.current) {
      setIsLoadingModel(true);
      const game = new BabylonGame();
      babylonGameRef.current = game;

      // Assign the onCarMoved callback
      game.onCarMoved = (currentBabylonPosition, isSprintingUpdate) => {
        setIsSprinting(isSprintingUpdate);

        if (!map || !babylonGameRef.current) return;

        const babylonOrigin = babylonGameRef.current.getBabylonOrigin();
        if (!babylonOrigin) return;

        const worldScale = 1.0; // Should match BabylonGame's worldScale or be passed from there.

        const displacementInBabylonUnits = currentBabylonPosition.subtract(babylonOrigin);

        const metersPerDegreeLat = 111111;
        const metersPerDegreeLng = 111111 * Math.cos(initialLngLatRef.current.lat * Math.PI / 180);

        // Assuming Babylon world +Z is North, and +X is East for map alignment.
        // This needs to be verified against the actual setup.
        const newLat = initialLngLatRef.current.lat + (displacementInBabylonUnits.z * worldScale) / metersPerDegreeLat;
        const newLng = initialLngLatRef.current.lng + (displacementInBabylonUnits.x * worldScale) / metersPerDegreeLng;
        
        map.setCenter([newLng, newLat]);
        modelPositionRef.current = {lng: newLng, lat: newLat}; // Update UI ref

        const carRotationQuaternion = babylonGameRef.current.getCarRotationQuaternion();
        if (carRotationQuaternion) {
            const eulerAngles = carRotationQuaternion.toEulerAngles();
            const yawDegrees = eulerAngles.y * 180 / Math.PI;
            // Assuming Babylon's 0 yaw (car facing +Z) is North.
            // Mapbox bearing: 0 is North, positive is clockwise.
            // If Babylon's positive rotation (around Y) is counter-clockwise, then negative is needed.
            map.setBearing(-yawDegrees); 
        }
      };

      const mapCanvas = map.getCanvas();
      game.initialize(mapCanvas, false); // Pass false to prevent auto render loop
      game.runBasicChecks(); // Initial checks

      game.loadModel('https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf')
        .then(() => {
          setIsModelLoaded(true);
          setIsLoadingModel(false);
          console.log('SUCCESS: Babylon model loaded successfully (checked in GameController).');
          if (babylonGameRef.current && babylonGameRef.current.getCarModel()) {
              console.log(`  - Car model name: ${babylonGameRef.current.getCarModel()?.name}`);
          } else {
              console.error('FAILURE: Car model is null after loading promise resolved.');
          }
        })
        .catch(error => {
          console.error('Error loading Babylon model:', error);
          setIsLoadingModel(false);
        });

      game.setupKeyboardControls();

      if (!map.getLayer('babylon-custom-layer')) {
        const customLayer: CustomLayerInterface = { // Use Mapbox's CustomLayerInterface
          id: 'babylon-custom-layer',
          type: 'custom',
          renderingMode: '3d',
          onAdd: (mapInstance, gl) => {
            // Babylon engine already initialized with map's canvas
          },
          render: (gl, matrix) => {
            if (babylonGameRef.current && babylonGameRef.current.getScene() && babylonGameRef.current.getEngine()) {
              const scene = babylonGameRef.current.getScene();
              const engine = babylonGameRef.current.getEngine();
              
              // Note: True camera synchronization is complex.
              // mapboxgl.MercatorCoordinate.fromLngLat({lng, lat}, altitude)
              // And then applying to Babylon camera.
              // For now, Babylon's camera is independent.
              // We ensure Babylon renders its scene.
              // The engine.runRenderLoop in BabylonGame handles continuous rendering.
              // This render callback might be for explicit sync points or if Mapbox needs to drive.
              // If babylonGame.engine.runRenderLoop is active, this explicit scene.render might be redundant
              // or could cause issues if not handled carefully.
              // However, Mapbox custom layers expect a render function.
              // Let's ensure we're not causing double rendering if Babylon has its own loop.
              // The runRenderLoop in BabylonGame should be the primary render driver.
              // This render function here is more of a Mapbox requirement.
              // We might only need to trigger a repaint if the map itself needs to update based on babylon changes.
              engine.wipeCaches(true); // Good for state management, as suggested
              scene.render(true, false); // Explicitly render the scene here
              
              map.triggerRepaint(); // Ensure Mapbox updates if its state changes or needs to redraw
            }
          },
          onRemove: () => {
            babylonGameRef.current?.dispose();
            babylonGameRef.current = null;
          }
        };
        map.addLayer(customLayer, 'waterway-label'); // Example: insert before labels
      }
    }

    // Original useEffect return was for cleaning up the Three.js model layer
    // The cleanup for Babylon is in onRemove of the custom layer
    return () => {
        // If the component unmounts before the layer is removed by map interaction
        if (babylonGameRef.current) {
            // Check if layer exists and remove it, which should trigger onRemove
            if (map && map.getLayer('babylon-custom-layer')) {
                map.removeLayer('babylon-custom-layer');
            } else {
                // If layer wasn't added or already removed, dispose directly
                babylonGameRef.current.dispose();
                babylonGameRef.current = null;
            }
        }
    };
  }, [map]); 

  // The useEffect for gameLoop that previously updated modelPositionRef for UI (and potentially map center)
  // is now replaced by the logic within game.onCarMoved.
  // If any other per-frame updates are needed in GameController, a separate useEffect/gameLoop can be used,
  // but for map centering and model position display, onCarMoved is the new driver.

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    // Keyboard controls are now handled by BabylonGame.
    // This function could be adapted to send commands to BabylonGame if UI buttons are still desired.
    // e.g., babylonGameRef.current?.moveCar(direction);
    // For now, direct modelPositionRef manipulation is removed as Babylon is the source of truth.
    // modelPositionRef.current.lat += speed; // Old logic
    console.log(`UI button ${direction} clicked. Implement babylonGameRef.current.moveCar(direction) if needed.`);
    // map.setCenter([modelPositionRef.current.lng, modelPositionRef.current.lat]); // Old logic
  };

  const setMapView = (view: 'ground' | 'sky') => {
    setCameraView(view); // This updates the local state for button styling

    if (babylonGameRef.current) {
        babylonGameRef.current.setCameraViewType(view);
    }

    // The existing Mapbox map.easeTo logic can remain if you want Mapbox's 2D map
    // to also change its pitch/zoom, or it can be removed if Babylon view is primary.
    // For now, let's assume the Babylon camera is the primary 3D view control.
    // The Mapbox camera settings here might conflict or be redundant if the primary
    // interaction is meant to be through the Babylon view.
    // We will keep it for now, but it might need adjustment based on desired behavior.
    
    let cameraOptions: Partial<mapboxgl.CameraOptions & mapboxgl.AnimationOptions>;
    // Get current center from modelPositionRef which should be updated by Babylon's car
    const currentCenter: [number, number] = [modelPositionRef.current.lng, modelPositionRef.current.lat];

    if (view === 'sky') {
      cameraOptions = {
        pitch: 45, // Mapbox pitch
        zoom: 15,  // Mapbox zoom
        center: currentCenter,
        duration: 1000,
      };
    } else { // ground
      cameraOptions = {
        pitch: 70, // Mapbox pitch
        zoom: 18,  // Mapbox zoom (closer for ground view)
        center: currentCenter,
        duration: 1000,
      };
    }
    map.easeTo(cameraOptions);
  };

  return (
    <>
      {isLoadingModel && <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow z-50">Loading 3D Model...</p>}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-50">
        <p>Status: {isSprinting ? 'Sprinting' : 'Normal Speed'}</p>
        <p className="text-xs">Lng: {modelPositionRef.current.lng.toFixed(4)} (Mapbox)</p>
        <p className="text-xs">Lat: {modelPositionRef.current.lat.toFixed(4)} (Mapbox)</p>
        {babylonGameRef.current?.getCarPosition() && (
          <>
            <p className="text-xs">Babylon X: {babylonGameRef.current.getCarPosition()?.x.toFixed(2)}</p>
            <p className="text-xs">Babylon Z: {babylonGameRef.current.getCarPosition()?.z.toFixed(2)}</p>
          </>
        )}
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