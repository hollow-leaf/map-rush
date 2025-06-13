import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Read Mapbox access token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export default function MapComponent() {
  // Ref for the map container
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return
    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
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
      // Add 3D buildings
      mapRef.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ["get", "height"],
            'fill-extrusion-base': ["get", "min_height"],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      )
    })
    // Clean up on unmount
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
} 