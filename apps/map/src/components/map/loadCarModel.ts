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

// Define a TypeScript interface for the custom layer implementation
interface CustomLayerImplementation extends CustomLayer {
  modelTransform: {
    translateX: number;
    translateY: number;
    translateZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scale: number;
  };
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
): CustomLayerImplementation | undefined {
  // Check if the layer already exists
  if (map.getLayer(layerId)) {
    return map.getLayer(layerId) as CustomLayerImplementation // Return existing layer
  }

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

  // Define the custom layer
  const customLayer: CustomLayerImplementation = {
    id: layerId,
    type: 'custom',
    renderingMode: '3d',
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: map.getCanvas().getContext('webgl')!,
    }),
    modelTransform: modelTransform, // Assign modelTransform here
    onAdd: function (map: any, gl: any) {
      this.renderer.autoClear = false;

      // Add directional lights if they haven't been added yet
      if (this.scene.children.filter(c => c.type === 'DirectionalLight').length === 0) {
        const directionalLight1 = new THREE.DirectionalLight(0xffffff);
        directionalLight1.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);
      }

      // Load the 3D model only if it hasn't been loaded yet
      if (this.scene.children.filter(c => c.type === 'Scene').length === 0) {
        const loader = new GLTFLoader();
        console.log('Loading model from:', modelUrl);
        loader.load(
          modelUrl,
          (gltf) => {
            console.log('Model loaded successfully:', gltf);
            this.scene.add(gltf.scene);
          },
          (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
          },
          (error) => {
            console.error('Error loading model:', error);
          }
        );
      }
    },
    render: function (gl: any, matrix: number[]) {
      const mt = this.modelTransform;

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        mt.rotateX
      )
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        mt.rotateY
      )
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        mt.rotateZ
      )

      const m = new THREE.Matrix4().fromArray(matrix)
      const l = new THREE.Matrix4()
        .makeTranslation(
          mt.translateX,
          mt.translateY,
          mt.translateZ
        )
        .scale(
          new THREE.Vector3(
            mt.scale,
            -mt.scale,
            mt.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      map.triggerRepaint()
    },
  }

  // Add the layer to the map
  map.addLayer(customLayer)
  return customLayer // Return the custom layer instance
}