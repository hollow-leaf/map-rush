import { useRef, useEffect } from 'react'
import maplibregl , { Map as MaplibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders'
import { BabylonLayerImpl } from './BabylonMapLayer';

interface CustomLayerWithBabylonResources extends maplibregl.CustomLayerInterface {
    babylonScene?: BABYLON.Scene;
    babylonCamera?: BABYLON.Camera;
    babylonEngine?: BABYLON.Engine;
}

interface BabylonMapControllerProps {
  map: MaplibreMap | null; 
}


export default function MapComponent( { onMapReady }: { onMapReady: (map: maplibregl.Map) => void } ) {
  // Ref for the map container
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY // Use MapTiler key for vector tiles
  const babylonEngineInstanceRef = useRef<BABYLON.Engine | null>(null);
      // To store references to scene and camera for cleanup and render logic
  const babylonResourcesRef = useRef<{ scene?: BABYLON.Scene, camera?: BABYLON.Camera }>({});

  const babylonLayerRef = useRef<BabylonLayerImpl | null>(null);
  const babylonLayer = new BabylonLayerImpl('babylon-custom-layer');
  
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return
    // Initialize the map
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [ -74.006, 40.7128 ], // New York City
      zoom: 15,
      pitch: 60, // Tilt the map for 3D effect
      bearing: -17.6,
      antialias: true
    })
    // Add 3D buildings layer when the map loads
    mapRef.current.on('load', () => {
      if (!mapRef.current) return
      const layers = mapRef.current.getStyle().layers
      // Find the label layer to insert 3D buildings below it
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id
      mapRef.current.addSource('openmaptiles', {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`, // Use a public vector tile source
      })
      mapRef.current.addLayer(babylonLayer)
      // Add 3D buildings
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
                      'interpolate',
                      ['linear'],
                      ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                  ],
                  'fill-extrusion-height': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15,
                      0,
                      16,
                      ['get', 'render_height']
                  ],
                  'fill-extrusion-base': ['case',
                      ['>=', ['get', 'zoom'], 16],
                      ['get', 'render_min_height'], 0
                  ]
          }
        },
        labelLayerId
      )
    })
    // Notify parent component that map is ready
    if (onMapReady && mapRef.current) {
      onMapReady(mapRef.current)
    }
    // Clean up on unmount
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [MAPTILER_KEY, onMapReady])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
} 