import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import mapboxgl from 'mapbox-gl'

// Define a TypeScript interface for the custom layer
interface CustomLayer {
  id: string
  type: 'custom'
  renderingMode: '3d'
  camera: THREE.Camera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  onAdd: (map: any, gl: any) => void
  render: (gl: any, matrix: number[]) => void
}

/**
 * Add a 3D model to a Mapbox map as a custom layer.
 * @param map - The Mapbox GL map instance
 * @param lng - Longitude for the model position
 * @param lat - Latitude for the model position
 * @param modelUrl - The URL to the .glb/.gltf model
 * @param layerId - Optional custom layer id (default: 'custom-3d-model')
 */
export function loadCarModelToMap(
  map: mapboxgl.Map,
  lng: number,
  lat: number,
  modelUrl: string,
  layerId: string = 'custom-3d-model'
) {
  const customLayer: CustomLayer = {
    id: layerId,
    type: 'custom',
    renderingMode: '3d',
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: map.getCanvas().getContext('webgl')!,
    }),
    onAdd: function (map: any, gl: any) {
      this.renderer.autoClear = false
      // Load the 3D model
      const loader = new GLTFLoader()
      console.log('Loading model from:', modelUrl)
      loader.load(
        modelUrl,
        (gltf) => {
          console.log('Model loaded successfully:', gltf)
          // Convert lng/lat to mercator coordinates
          const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, 0)
          // Position the camera at the mercator coordinates
          this.camera.position.set(mercator.x, mercator.y, mercator.z)
          // Position the model slightly in front of the camera
          gltf.scene.position.set(mercator.x + 0.1, mercator.y, mercator.z)
          gltf.scene.scale.set(1000000, 1000000, 1000000)
          this.scene.add(gltf.scene)
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%')
        },
        (error) => {
          console.error('Error loading model:', error)
        }
      )
    },
    render: function (gl: any, matrix: number[]) {
      const m = new THREE.Matrix4().fromArray(matrix)
      this.camera.projectionMatrix = m
      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
      map.triggerRepaint()
    },
  }
  map.addLayer(customLayer)
} 