import { Engine, Scene, Vector3, AbstractMesh, Quaternion } from '@babylonjs/core'; // Added Scene for type hint
import { BabylonScene } from './BabylonScene';
import { BabylonCamera } from './BabylonCamera';
import { BabylonModelLoader } from './BabylonModelLoader';
import { BabylonControls } from './BabylonControls';
import type { ModelConfig } from './CustomLayerConfig'; // For ModelConfig type

// Define a type for the config parameter to loadCarModelAndSetup
// This will be a subset of ModelConfig, specifically what BabylonModelLoader needs
type ModelLoadOptions = Pick<ModelConfig, 'url' | 'baseScale' | 'positionOffset' | 'rotationOffset'>;

export class BabylonGame {
    private engine: Engine | null = null;
    // We still need the canvas for camera controls, even if engine uses GL context
    private canvasForControls: HTMLCanvasElement | null = null; 
    
    public babylonScene: BabylonScene | null = null;
    public babylonCamera: BabylonCamera | null = null;
    public modelLoader: BabylonModelLoader | null = null;
    public controls: BabylonControls | null = null;

    // Callback for when the car model is moved, to be used by external components (e.g., React UI)
    public onCarMoved: ((position: Vector3, isSprinting: boolean) => void) | null = null;

    constructor() {
        // Initialization logic will be triggered by the initialize method
    }

    // initialize now accepts gl context and a canvas for controls
    public initialize(
        gl: WebGLRenderingContext, 
        canvasForControls: HTMLCanvasElement, 
        startRenderLoop: boolean = true
    ): void {
        if (!gl) {
            console.error("BabylonGame: WebGLRenderingContext (gl) is null or undefined at initialization.");
            return;
        }
        if (!canvasForControls) {
            console.error("BabylonGame: Canvas element for controls is null or undefined at initialization.");
            return; 
        }
        this.canvasForControls = canvasForControls;

        // Initialize Babylon Engine with the provided WebGL context
        // Note: The arguments for Engine constructor when using a GL context might differ slightly.
        // Referring to the example: new BABYLON.Engine(gl, true, { useHighPrecisionMatrix: true }, true);
        // We'll use similar parameters, ensuring antialiasing is true, and check if other options are needed.
        this.engine = new Engine(gl, true, { 
            stencil: true, 
            alpha: true, // For transparency with map background
            preserveDrawingBuffer: true, // May be needed for custom layer integration
            useHighPrecisionMatrix: true // As per MapLibre example, good for mercator scales
        }, true); // The last 'true' could be for 'adaptToDeviceRatio' or similar, check docs.

        if (!this.engine) {
            console.error("BabylonGame: Engine initialization failed with GL context.");
            return; 
        }
        
        this.babylonScene = new BabylonScene(this.engine);
        // BabylonCamera still needs a canvas for attaching controls
        this.babylonCamera = new BabylonCamera(this.babylonScene.instance, this.canvasForControls); 
        this.modelLoader = new BabylonModelLoader(this.babylonScene.instance);
        
        // Pass the camera update function to controls
        this.controls = new BabylonControls(this.babylonScene.instance, () => this.babylonCamera?.updateCameraPosition());
        this.controls.setObstacles(this.babylonScene.getObstacles());

        // Forward the onCarMoved callback from controls
        this.controls.onCarMoved = (position, isSprinting) => {
            if (this.onCarMoved) {
                this.onCarMoved(position, isSprinting);
            }
        };

        if (startRenderLoop && this.engine) {
            this.engine.runRenderLoop(() => {
                if (this.babylonScene) {
                    this.babylonScene.render();
                }
            });
        }

        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
    }

    public async loadCarModelAndSetup(config: ModelLoadOptions): Promise<void> {
        if (!this.modelLoader || !this.babylonCamera || !this.controls || !this.babylonScene) {
            console.error("BabylonGame components not fully initialized for model loading.");
            return;
        }
        // Pass the relevant parts of the config to the modelLoader
        const carModel = await this.modelLoader.loadCarModel(config.url, {
            baseScale: config.baseScale,
            positionOffset: config.positionOffset,
            rotationOffset: config.rotationOffset
        });

        if (carModel) {
            this.babylonCamera.setCarModel(carModel); 
            this.controls.setCarModel(carModel);     
            this.babylonCamera.updateCameraPosition(); // Ensure camera is correctly positioned after model load
        } else {
            console.error("Failed to load car model in BabylonGame.");
        }
    }

    public setupKeyboardControls(): void {
        if (!this.controls) {
            console.error("Controls not initialized.");
            return;
        }
        this.controls.setupKeyboardControls();
    }
    
    // Expose methods from sub-components as needed by external users (e.g., BabylonMapLayer)
    public getSceneInstance(): Scene | null {
        return this.babylonScene ? this.babylonScene.instance : null;
    }

    public getEngineInstance(): Engine | null {
        return this.engine;
    }

    public getCarModel(): AbstractMesh | null {
        return this.modelLoader ? this.modelLoader.getCarModel() : null;
    }
    
    public getCarPosition(): Vector3 | null {
        const model = this.getCarModel();
        return model ? model.position : null;
    }

    public getCarRotationQuaternion(): Quaternion | null {
        const model = this.getCarModel();
        return model ? model.rotationQuaternion : null;
    }

    public getBabylonOrigin(): Vector3 | null {
        return this.modelLoader ? this.modelLoader.getBabylonOrigin() : null;
    }

    public setCameraViewType(viewType: 'sky' | 'ground'): void {
        if (this.babylonCamera) {
            this.babylonCamera.setCameraViewType(viewType);
        }
    }

    public triggerMovement(direction: 'forward' | 'backward', isSprinting: boolean = false): void {
        if (this.controls) {
            this.controls.triggerMovement(direction, isSprinting);
        }
    }

    public triggerRotation(direction: 'left' | 'right'): void {
        if (this.controls) {
            this.controls.triggerRotation(direction);
        }
    }
    
    public renderScene(): void { // If manual rendering is needed (e.g. when not using engine's render loop)
        if (this.babylonScene) {
            this.babylonScene.render();
        }
    }

    public runBasicChecks(): void {
        console.log("--- Running Basic BabylonGame Checks (Refactored) ---");
        if (this.engine) console.log("SUCCESS: Engine initialized."); else console.error("FAILURE: Engine not initialized.");
        if (this.babylonScene) console.log("SUCCESS: BabylonScene component initialized."); else console.error("FAILURE: BabylonScene component not initialized.");
        if (this.babylonCamera) console.log("SUCCESS: BabylonCamera component initialized."); else console.error("FAILURE: BabylonCamera component not initialized.");
        if (this.modelLoader) console.log("SUCCESS: BabylonModelLoader component initialized."); else console.error("FAILURE: BabylonModelLoader component not initialized.");
        if (this.controls) console.log("SUCCESS: BabylonControls component initialized."); else console.error("FAILURE: BabylonControls component not initialized.");
        
        // Check camera instance within BabylonCamera
        if (this.babylonCamera?.getActiveCamera()) {
            console.log(`SUCCESS: Active camera '${this.babylonCamera.getActiveCamera()?.name}' available in BabylonCamera.`);
        } else {
            console.error("FAILURE: No active camera available in BabylonCamera.");
        }

        // Check for car model (will be null before loadCarModelAndSetup is called)
        if (this.getCarModel()) {
            console.log(`INFO: Car model '${this.getCarModel()?.name}' is loaded.`);
        } else {
            console.warn("INFO: Car model is not loaded yet (expected before loadCarModelAndSetup).");
        }
        console.log("--- Basic BabylonGame Checks Complete (Refactored) ---");
    }

    public dispose(): void {
        // Dispose components in reverse order of creation or dependency
        if (this.babylonScene) { // Scene dispose usually handles lights, meshes, etc.
            this.babylonScene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
        // Other components might not have explicit dispose if their resources are managed by scene/engine
        this.canvasForControls = null; // Release reference
    }
}
