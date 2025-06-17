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
  const modelAltitude = 0
  const modelRotate = [Math.PI / 2, 0, 0]

  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    { lng, lat },
    modelAltitude
  )

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  }

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

      // Add directional lights
      const directionalLight1 = new THREE.DirectionalLight(0xffffff)
      directionalLight1.position.set(0, -70, 100).normalize()
      this.scene.add(directionalLight1)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff)
      directionalLight2.position.set(0, 70, 100).normalize()
      this.scene.add(directionalLight2)

      // Load the 3D model
      const loader = new GLTFLoader()
      console.log('Loading model from:', modelUrl)
      loader.load(
        modelUrl,
        (gltf) => {
          console.log('Model loaded successfully:', gltf)
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
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      )
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      )
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      )

      const m = new THREE.Matrix4().fromArray(matrix)
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)

      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      map.triggerRepaint()
    },
  }
  map.addLayer(customLayer)
} 