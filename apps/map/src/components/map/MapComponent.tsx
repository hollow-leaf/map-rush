import { useRef, useEffect } from 'react';
import maplibregl, { LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import BabylonLayerImpl from './BabylonMapLayer';
import { useMapStore, updateStoreFromMap } from '../../store/mapStore';

export default function MapComponent({ onMapReady }: { onMapReady: (map: maplibregl.Map) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const babylonLayerRef = useRef<BabylonLayerImpl | null>(null);

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

  // Get state and setters from Zustand store
  const { center, zoom, pitch, bearing, setMapState } = useMapStore();

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: center, // Use store value
      zoom: zoom,     // Use store value
      pitch: pitch,   // Use store value
      bearing: bearing, // Use store value
      antialias: true,
    });
    mapRef.current = map;

    map.on('load', () => {
      if (!mapRef.current) return;

      const layerId = 'babylon-custom-layer';
      const modelConfigIdx = 0;
      const babylonCustomLayer = new BabylonLayerImpl(layerId, modelConfigIdx);
      babylonLayerRef.current = babylonCustomLayer;

      mapRef.current.addLayer(babylonCustomLayer);
      console.log("Babylon custom layer added to map.");

      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      mapRef.current.addSource('openmaptiles', {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
      });
      mapRef.current.setMaxPitch(85)
      mapRef.current.addLayer(
        {
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          filter: ['!=', ['get', 'hide_3d'], true],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'render_height'],
              0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
            ],
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              11, 0, 16, ['get', 'render_height']
            ],
            'fill-extrusion-base': [
              'case', ['>=', ['get', 'zoom'], 16],
              ['get', 'render_min_height'], 0
            ]
          }
        },
        labelLayerId
      );

      // Update store when map interaction ends
      map.on('moveend', () => updateStoreFromMap(map));
      map.on('zoomend', () => updateStoreFromMap(map));
      map.on('pitchend', () => updateStoreFromMap(map));
      map.on('rotateend', () => updateStoreFromMap(map));

      if (onMapReady) {
        onMapReady(map);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [MAPTILER_KEY, onMapReady]); // Corrected dependency array

  // Effect to update map when store changes (e.g. from keyboard controls or external state change)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    // Only call map methods if the values actually differ, to prevent potential loops
    // and unnecessary map operations.
    const currentMapCenter = map.getCenter().toArray() as [number, number];
    if (center[0] !== currentMapCenter[0] || center[1] !== currentMapCenter[1]) {
      map.setCenter(center);
    }
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
    if (map.getPitch() !== pitch) {
      map.setPitch(pitch);
    }
    if (map.getBearing() !== bearing) {
      map.setBearing(bearing);
    }
  }, [center, zoom, pitch, bearing]);


  // Keyboard controls update the Zustand store
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const turnSpeed = 5; // degrees
      const moveSpeed = 0.00015; // Adjusted for a slightly faster feel
      const currentStoreState = useMapStore.getState();
      let newCenter: LngLatLike = currentStoreState.center;
      let newBearing = currentStoreState.bearing;

      switch (event.key) {
        case 'ArrowLeft':
          newBearing = currentStoreState.bearing - turnSpeed;
          break;
        case 'ArrowRight':
          newBearing = currentStoreState.bearing + turnSpeed;
          break;
        case 'ArrowUp': {
          const rad = currentStoreState.bearing * (Math.PI / 180);
          const lng = (currentStoreState.center as [number,number])[0] + moveSpeed * Math.sin(rad);
          const lat = (currentStoreState.center as [number,number])[1] + moveSpeed * Math.cos(rad);
          newCenter = [lng, lat];
          break;
        }
        case 'ArrowDown': {
          const rad = currentStoreState.bearing * (Math.PI / 180);
          const lng = (currentStoreState.center as [number,number])[0] - moveSpeed * Math.sin(rad);
          const lat = (currentStoreState.center as [number,number])[1] - moveSpeed * Math.cos(rad);
          newCenter = [lng, lat];
          break;
        }
        default:
          return; // No relevant key pressed
      }
      
      // Update the store
      setMapState({ center: newCenter, bearing: newBearing });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setMapState]); // setMapState is stable, so this effect runs once

  return (
    <div ref={mapContainer} className="w-full h-full" tabIndex={0} />
  );
}