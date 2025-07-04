import { type CustomLayerInterface, Map as MaplibreMap, MercatorCoordinate } from 'maplibre-gl';
import { BabylonGame } from '../../lib/BabylonGame';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core';
import { getModelConfig, type ModelConfig } from '../../lib/CustomLayerConfig'; // Import config

// Define the structure for the BabylonLayer to hold the game instance
interface BabylonLayerType extends CustomLayerInterface {
    babylonGame?: BabylonGame;
    map?: MaplibreMap; // Keep a reference to the map
}

export class BabylonLayerImpl implements BabylonLayerType {
    id: string;
    type: 'custom';
    renderingMode: '3d' | '2d';
    public babylonGame?: BabylonGame;
    public map?: MaplibreMap;
    private modelConfig: ModelConfig | undefined;

    constructor(id: string = 'babylon-layer', modelConfigIndex: number = 0) {
        this.id = id;
        this.type = 'custom';
        this.renderingMode = '3d';
        this.modelConfig = getModelConfig(modelConfigIndex);

        if (!this.modelConfig) {
            console.error(`BabylonLayerImpl: Model config with index ${modelConfigIndex} not found.`);
            // Potentially throw an error or handle this state appropriately
        }
    }

    async onAdd(map: MaplibreMap, gl: WebGLRenderingContext) {
        this.map = map;
        const mapCanvas = map.getCanvas();
        this.babylonGame = new BabylonGame();
        
        if (gl && mapCanvas) {
            this.babylonGame.initialize(gl, mapCanvas, false); 
        } else {
            console.error("BabylonMapLayer: Missing gl context or mapCanvas for BabylonGame initialization.");
            return;
        }
        
        if (!this.modelConfig) {
            console.error("BabylonMapLayer: No model configuration available to load model.");
            return;
        }

        try {
            // Load the 3D model using the full modelConfig
            await this.babylonGame.loadCarModelAndSetup({
                url: this.modelConfig.url,
                baseScale: this.modelConfig.baseScale,
                positionOffset: this.modelConfig.positionOffset,
                rotationOffset: this.modelConfig.rotationOffset,
            });
            console.log(`Babylon model (${this.modelConfig.url}) loaded and setup successfully by BabylonLayer.`);

            // Setup keyboard controls after model is loaded
            // If keyboard controls are more global, they might be initialized elsewhere
            // or passed as a configuration. For now, assuming BabylonGame sets them up.
            this.babylonGame.setupKeyboardControls();

        } catch (error) {
            console.error(`Error loading model (${this.modelConfig.url}) in BabylonLayer:`, error);
        }
    }

    render(_gl: WebGLRenderingContext, matrix: any) {
        if (!this.babylonGame || !this.babylonGame.getSceneInstance() || !this.babylonGame.getEngineInstance() || !this.babylonGame.getCarModel()) {
            if (this.map) this.map.triggerRepaint();
            return;
        }
        const cameraMatrix = Matrix.FromArray(matrix);
        
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
        const activeCamera = this.babylonGame.babylonCamera?.getActiveCamera();

        if (activeCamera) {
            
            const maplibreMatrix = worldMatrix.multiply(cameraMatrix);
            activeCamera.freezeProjectionMatrix(maplibreMatrix);
            this.babylonGame.renderScene();
        }
        
        if (this.map) {
            this.map.triggerRepaint();
        }
    }

    onRemove() {
        if (this.babylonGame) {
            this.babylonGame.dispose();
            this.babylonGame = undefined;
        }
        console.log("BabylonLayer removed and babylonGame disposed.");
    }

    // Method to allow external access to the BabylonGame instance if needed
    // This could be used by a separate UI controller component.
    public getBabylonGameInstance(): BabylonGame | undefined {
        return this.babylonGame;
    }
}

export default BabylonLayerImpl; // Default export is now the class itself
