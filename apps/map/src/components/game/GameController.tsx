import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { loadCarModelToMap } from '../map/loadCarModel'

interface GameControllerProps {
  map: mapboxgl.Map
}

const GameController = ({ map }: GameControllerProps) => {
  const modelPositionRef = useRef({ lng: -74.006, lat: 40.7128 }) // Initial position
  const [speed, setSpeed] = useState(0.0001) // Normal speed
  const [isSprinting, setIsSprinting] = useState(false) // Sprint state

  useEffect(() => {
    // Load the 3D model when the map is ready
    loadCarModelToMap(
      map,
      modelPositionRef.current.lng,
      modelPositionRef.current.lat,
      './assets/chicken.glb'
    )

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
      map.setCenter([modelPositionRef.current.lng, modelPositionRef.current.lat])
      // Reload the model at the new position
      loadCarModelToMap(
        map,
        modelPositionRef.current.lng,
        modelPositionRef.current.lat,
        './assets/chicken.glb'
      )
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
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [map, speed])

  return (
    <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
      <p>Speed: {isSprinting ? 'Sprinting' : 'Normal'}</p>
    </div>
  )
}

export default GameController 