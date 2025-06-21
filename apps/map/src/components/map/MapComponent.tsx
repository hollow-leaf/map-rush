import { useRef, useEffect } from 'react'; // Added useState
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import BabylonLayerImpl from './BabylonMapLayer'; // Default import

export default function MapComponent({ onMapReady }: { onMapReady: (map: maplibregl.Map) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const babylonLayerRef = useRef<BabylonLayerImpl | null>(null); // To hold the instance of our layer

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-74.006, 40.7128], // New York City
      zoom: 15,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
    });

    mapRef.current.on('load', () => {
      if (!mapRef.current) return;

      const layerId = 'babylon-custom-layer';
      const modelConfigIdx = 0; // Use the first model config from customLayerConfig.ts
      const babylonCustomLayer = new BabylonLayerImpl(layerId, modelConfigIdx);
      babylonLayerRef.current = babylonCustomLayer; // Store the instance if needed

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