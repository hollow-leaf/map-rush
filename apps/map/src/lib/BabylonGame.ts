import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, SceneLoader, ActionManager, ExecuteCodeAction, AbstractMesh } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading

export class BabylonGame {
    private canvas: HTMLCanvasElement | null = null;
    private engine: Engine | null = null;
    private scene: Scene | null = null;
    private camera: FreeCamera | null = null;
    private carModel: AbstractMesh | null = null;
    private speed = 0.1; // Babylon units per frame
    private obstacles: AbstractMesh[] = [];

    constructor() {
        // Initialization logic will be added here
    }

    public initialize(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // Basic camera setup
        this.camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl(this.canvas, true);

        // Basic light setup
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // Example: Add a ground plane (optional, for testing)
        const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.scene);
        ground.computeWorldMatrix(true); // Ensure bounding box is ready

        // Add some obstacles
        const box1 = MeshBuilder.CreateBox("box1", { size: 1 }, this.scene);
        box1.position = new Vector3(2, 0.5, 5);
        box1.computeWorldMatrix(true);
        this.obstacles.push(box1);

        const box2 = MeshBuilder.CreateBox("box2", { size: 1 }, this.scene);
        box2.position = new Vector3(-3, 0.5, -2);
        box2.computeWorldMatrix(true);
        this.obstacles.push(box2);
        
        const sphere1 = MeshBuilder.CreateSphere("sphere1", { diameter: 1.5 }, this.scene);
        sphere1.position = new Vector3(0, 0.75, 2);
        sphere1.computeWorldMatrix(true);
        this.obstacles.push(sphere1);

        this.engine.runRenderLoop(() => {
            if (this.scene) {
                this.scene.render();
            }
        });

        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
    }

    public async loadModel(modelUrl: string): Promise<void> {
        if (!this.scene) {
            console.error("Scene is not initialized.");
            return;
        }
        // Logic to load a 3D model
        try {
            const model = await SceneLoader.ImportMeshAsync("", modelUrl, "", this.scene);
            console.log("Model loaded successfully:", model);
            if (model.meshes.length > 0) {
                // Assuming the first mesh is the car or a suitable root for it.
                // For more complex models, you might search by name:
                // this.carModel = this.scene.getMeshByName("car_root") as AbstractMesh;
                this.carModel = model.meshes[0];
                if (this.carModel) {
                    // Adjust initial position (Y should be above ground, considering car's own origin)
                    this.carModel.position = new Vector3(0, 0.2, 0); // Adjust Y based on model's pivot
                    // Adjust scaling as needed
                    this.carModel.scaling = new Vector3(0.1, 0.1, 0.1); // Uniform scale, adjust as needed

                    // Ensure world matrix and bounding box are up-to-date after positioning/scaling
                    this.carModel.computeWorldMatrix(true);
                    
                    // If the car model has child meshes, ensure their world matrices are also updated.
                    // this.carModel.getChildMeshes().forEach(mesh => mesh.computeWorldMatrix(true));
                }
            }
        } catch (error) {
            console.error("Error loading model:", error);
        }
    }

    public setupKeyboardControls(): void {
        if (!this.scene || !this.canvas) return;

        const inputMap: any = {};
        this.scene.actionManager = new ActionManager(this.scene);

        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
                inputMap[evt.sourceEvent.key.toLowerCase()] = true;
            })
        );
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
                inputMap[evt.sourceEvent.key.toLowerCase()] = false;
            })
        );

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.carModel || !this.scene) return;

            const previousPosition = this.carModel.position.clone();
            let moved = false;

            if (inputMap["arrowup"]) {
                this.carModel.position.z += this.speed;
                moved = true;
            }
            if (inputMap["arrowdown"]) {
                this.carModel.position.z -= this.speed;
                moved = true;
            }
            if (inputMap["arrowleft"]) {
                this.carModel.position.x -= this.speed;
                moved = true;
            }
            if (inputMap["arrowright"]) {
                this.carModel.position.x += this.speed;
                moved = true;
            }

            if (moved) {
                // Recompute the car's bounding box after movement
                this.carModel.computeWorldMatrix(true);
                const carBoundingBox = this.carModel.getBoundingInfo().boundingBox;

                let collisionDetected = false;
                for (const obstacle of this.obstacles) {
                    // Ensure obstacle's bounding box is up-to-date (might not be necessary if static)
                    // obstacle.computeWorldMatrix(true); 
                    const obstacleBoundingBox = obstacle.getBoundingInfo().boundingBox;
                    if (carBoundingBox.intersects(obstacleBoundingBox)) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (collisionDetected) {
                    this.carModel.position = previousPosition;
                    // Recompute world matrix after reverting position
                    this.carModel.computeWorldMatrix(true); 
                }
            }

            // Update GameController's position ref for UI and map centering
            // This needs a callback or event system, or GameController polls getPosition()
        });
    }

    public getScene(): Scene | null {
        return this.scene;
    }

    public getEngine(): Engine | null {
        return this.engine;
    }

    public getCarPosition(): Vector3 | null {
        return this.carModel ? this.carModel.position : null;
    }

    public getCarModel(): AbstractMesh | null {
        return this.carModel;
    }

    public runBasicChecks(): void {
        console.log("--- Running Basic BabylonGame Checks ---");

        // Check 1: Engine and Scene Initialization
        if (this.engine && this.scene) {
            console.log("SUCCESS: Engine and Scene initialized.");
        } else {
            console.error("FAILURE: Engine or Scene not initialized.");
            if (!this.engine) console.error("  - Engine is null.");
            if (!this.scene) console.error("  - Scene is null.");
        }

        // Check 2: Canvas Association
        if (this.canvas) {
            console.log(`SUCCESS: Canvas is associated (ID: ${this.canvas.id || 'N/A'}).`);
        } else {
            console.error("FAILURE: Canvas not associated.");
        }
        
        // Check 3: Camera Initialization
        if (this.camera) {
            console.log(`SUCCESS: Camera '${this.camera.name}' initialized.`);
        } else {
            console.error("FAILURE: Camera not initialized.");
        }

        // Check 4: Model Loading (this check happens before model is actually loaded)
        // This check is more of a placeholder here, as loadModel is async.
        // A better check for model loading would be after the loadModel promise resolves.
        if (this.carModel) {
            console.log(`SUCCESS: carModel property is initially set (name: ${this.carModel.name}). This will be properly checked after async loading.`);
        } else {
            console.warn("INFO: carModel property is null before async loading, which is expected.");
        }
        console.log("--- Basic BabylonGame Checks Complete ---");
    }

    public dispose(): void {
        if (this.engine) {
            this.engine.dispose();
        }
    }
}
