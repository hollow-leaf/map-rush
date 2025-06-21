import { type CustomLayerInterface, Map as MaplibreMap, MercatorCoordinate } from 'maplibre-gl';
// import { BabylonGame } from '../../lib/BabylonGame'; // Assuming BabylonGame is not used for now
import { Matrix, Engine, Scene, Camera, Vector3, HemisphericLight, AxesViewer, SceneLoader, Quaternion } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading
import { getModelConfig, type ModelConfig } from '../../lib/CustomLayerConfig'; // Import config
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
    private camera?: Camera;

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

        this.engine = new Engine(
            gl,
            true,
            { useHighPrecisionMatrix: true },
            true
        );
        this.scene = new Scene(this.engine);
        this.scene.autoClear = false;
        this.scene.detachControl();

        this.scene.beforeRender = () => {
            this.engine?.wipeCaches(true); 
        };

        this.camera = new Camera('Camera', new Vector3(0, 0, 0), this.scene);

        const light = new HemisphericLight('light1', new Vector3(0, 0, 100), this.scene);
        light.intensity = 0.7;

        new AxesViewer(this.scene, 10); 

        const modelUrl = this.modelConfig?.url || 'https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf'; 
        
        SceneLoader.LoadAssetContainerAsync(modelUrl, '', this.scene)
            .then((modelContainer) => {
                modelContainer.addAllToScene();
                const rootMesh = modelContainer.createRootMesh();
                if (rootMesh) {
                    if (this.modelConfig?.positionOffset) {
                        rootMesh.position = new Vector3(
                            this.modelConfig.positionOffset.x,
                            this.modelConfig.positionOffset.y,
                            this.modelConfig.positionOffset.z
                        );
                    }
                    if (this.modelConfig?.rotationOffset) {
                        // Convert degrees to radians for Babylon.js
                        const rotX = (this.modelConfig.rotationOffset.x * Math.PI) / 180;
                        const rotY = (this.modelConfig.rotationOffset.y * Math.PI) / 180;
                        const rotZ = (this.modelConfig.rotationOffset.z * Math.PI) / 180;
                        rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(rotX, rotY, rotZ);
                    }
                    if (this.modelConfig?.baseScale) {
                        rootMesh.scaling = new Vector3(
                            this.modelConfig.baseScale.x,
                            this.modelConfig.baseScale.y,
                            this.modelConfig.baseScale.z
                        );
                    }

                    const rootMesh2 = rootMesh.clone("modelClone");
                    if (rootMesh2) {
                        rootMesh2.position.x += 25; 
                        rootMesh2.position.z += 25; 
                    }
                }
            })
            .catch((error) => {
                console.error("BabylonLayerImpl: Error loading model asset.", error);
            });
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
