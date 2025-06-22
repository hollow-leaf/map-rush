import { type CustomLayerInterface, Map as MaplibreMap, MercatorCoordinate } from 'maplibre-gl';
// import { BabylonGame } from '../../lib/BabylonGame'; // Assuming BabylonGame is not used for now
import { Matrix, Engine, Scene, Camera, Vector3, HemisphericLight, AxesViewer, SceneLoader, Quaternion, FreeCamera } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading
import { getModelConfig, type ModelConfig } from '../../lib/CustomLayerConfig'; // Import config
import { BabylonModelLoader } from '../../lib/BabylonModelLoader';
import { BabylonGame } from '../../lib/BabylonGame';
import { BabylonScene } from '../../lib/BabylonScene';
import { BabylonCamera } from '../../lib/BabylonCamera';
interface BabylonLayerType extends CustomLayerInterface {
    map?: MaplibreMap; 
}

export class BabylonLayerImpl implements BabylonLayerType {
    id: string;
    type: 'custom';
    renderingMode: '3d' | '2d';
    public map?: MaplibreMap;
    private modelConfig: ModelConfig | undefined;
    private engine?: Engine;
    private scene?: Scene;
    private camera?: FreeCamera;
    public babylonGame?: BabylonGame;


    constructor(id: string = 'babylon-layer', modelConfigIndex: number = 0) {
        this.id = id;
        this.type = 'custom';
        this.renderingMode = '3d';
        this.modelConfig = getModelConfig(modelConfigIndex);

        if (!this.modelConfig) {
            console.error(`BabylonLayerImpl: Model config with index ${modelConfigIndex} not found.`);
        }
    }
    
    onAdd (map: MaplibreMap, gl: WebGLRenderingContext) {
        this.map = map; 
        const mapCanvas = map.getCanvas();
         this.babylonGame = new BabylonGame();
        this.engine = new Engine(
            gl,
            true,
            { useHighPrecisionMatrix: true },
            true
        );
        // 
        const scene = new BabylonScene(this.engine);
        this.scene = scene.instance;
        const camera = new BabylonCamera(this.scene, mapCanvas);
        this.camera = camera.instance as FreeCamera;
        
        this.camera =  new FreeCamera("camera1", new Vector3(0, 0, 0), this.scene);
        console.log("camera initialized:", this.camera);
        // if (gl && mapCanvas) {
        //     this.babylonGame.initialize(gl, mapCanvas, false); 
        // } else {
        //     console.error("BabylonMapLayer: Missing gl context or mapCanvas for BabylonGame initialization.");
        //     return;
        // }
        const light = new HemisphericLight('light1', new Vector3(0, 0, 100), this.scene);
        light.intensity = 0.7;

        new AxesViewer(this.scene, 10); 

        const modelUrl = this.modelConfig?.url || 'https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf'; 
        
        const modelLoader = new BabylonModelLoader(this.scene)
        modelLoader.loadCarModel(modelUrl, {
            baseScale: this.modelConfig?.baseScale,
            positionOffset: this.modelConfig?.positionOffset,
            rotationOffset: this.modelConfig?.rotationOffset
        })
    }

    render (gl: WebGLRenderingContext, viewProjectionMatrix: number[]) {
        if (!this.engine || !this.scene || !this.camera || !this.map) {
            return;
        }

        const cameraMatrix = Matrix.FromArray(viewProjectionMatrix);
        
        const worldOrigin = this.modelConfig?.worldOrigin || [148.9819, -35.39847];
        const worldAltitude = this.modelConfig?.worldAltitude || 0;
        const worldRotate = [Math.PI / 2, 0, 0]; 

        const worldOriginMercator = MercatorCoordinate.fromLngLat(worldOrigin as [number, number], worldAltitude);
        const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits();
        
        const worldMatrix = Matrix.Compose(
            new Vector3(worldScale, worldScale, worldScale), 
            Quaternion.FromEulerAngles( 
                worldRotate[0],
                worldRotate[1],
                worldRotate[2]
            ),
            new Vector3( 
                worldOriginMercator.x,
                worldOriginMercator.y,
                worldOriginMercator.z
            )
        );

        const wvpMatrix = worldMatrix.multiply(cameraMatrix);
        this.camera.freezeProjectionMatrix(wvpMatrix); 
        this.scene.render(false); 
        this.map.triggerRepaint(); 
    }

    onRemove() {
        console.log("BabylonLayerImpl: onRemove called.");
        this.scene?.dispose();
        this.engine?.dispose();
        this.scene = undefined;
        this.engine = undefined;
        this.camera = undefined;
        this.map = undefined; 
        console.log("BabylonLayerImpl: Scene and engine disposed.");
    }
}

export default BabylonLayerImpl;
