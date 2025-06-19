import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, SceneLoader, ActionManager, ExecuteCodeAction, AbstractMesh, Color4, Quaternion, Matrix } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading

export class BabylonGame {
    private canvas: HTMLCanvasElement | null = null;
    private engine: Engine | null = null;
    private scene: Scene | null = null;
    private camera: FreeCamera | null = null;
    private carModel: AbstractMesh | null = null;
    // private speed = 0.1; // Babylon units per frame -- Will be replaced by currentSpeed etc.
    private obstacles: AbstractMesh[] = [];

    private activeCameraView: 'sky' | 'ground' = 'sky'; // Default view
    private groundViewOffset = new Vector3(0, 2, -6); 
    private skyViewOffset = new Vector3(0, 10, -10);   

    // New properties for refined controls
    private currentSpeed = 0;
    private readonly normalSpeed = 0.05; 
    private readonly sprintSpeed = 0.1;
    private readonly rotationSpeed = 0.03; // Radians per frame

    public onCarMoved: ((position: Vector3, isSprinting: boolean) => void) | null = null;

    // Properties for coordinate synchronization
    private babylonOrigin: Vector3 | null = null;
    private readonly worldScale = 1.0; // 1 Babylon unit = 1 meter.

    constructor() {
        // Initialization logic will be added here
    }

    public initialize(canvas: HTMLCanvasElement, startRenderLoop: boolean = true): void {
        this.canvas = canvas;
        // Note: adaptToDeviceRatio = false based on subtask description.
        // The `true` for antialias is kept.
        this.engine = new Engine(this.canvas, true, { stencil: true, alpha: true, preserveDrawingBuffer: true }, false);
        this.scene = new Scene(this.engine);

        if (this.scene) {
            this.scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background
        }

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

        if (startRenderLoop) {
            this.engine.runRenderLoop(() => {
                if (this.scene) {
                    this.scene.render();
                }
            });
        }

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

                    if (!this.babylonOrigin) { // Set origin only once
                        this.babylonOrigin = this.carModel.getAbsolutePosition().clone();
                    }
                    
                    // Set initial camera position based on loaded model and active view
                    this.updateCameraPosition();
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
            // Ensure rotationQuaternion is initialized if it's null
            if (!this.carModel.rotationQuaternion) {
                this.carModel.rotationQuaternion = Quaternion.FromEulerVector(this.carModel.rotation);
            }
            const previousRotation = this.carModel.rotationQuaternion.clone();

            let isSprinting = false;
            if (inputMap["shift"]) { // Sprint key
                this.currentSpeed = this.sprintSpeed;
                isSprinting = true;
            } else {
                this.currentSpeed = this.normalSpeed;
            }
            
            let moved = false;
            let rotated = false;

            if (inputMap["arrowup"]) {
                const forward = new Vector3(0, 0, 1);
                const worldForward = Vector3.Zero(); // Holder for the result
                this.carModel.rotationQuaternion.toRotationMatrix(Matrix.IdentityReadOnly).transformCoordinates(forward, worldForward);
                this.carModel.position.addInPlace(worldForward.scale(this.currentSpeed));
                moved = true;
            }
            if (inputMap["arrowdown"]) {
                const backward = new Vector3(0, 0, -1);
                const worldBackward = Vector3.Zero(); // Holder for the result
                this.carModel.rotationQuaternion.toRotationMatrix(Matrix.IdentityReadOnly).transformCoordinates(backward, worldBackward);
                this.carModel.position.addInPlace(worldBackward.scale(this.currentSpeed * 0.7)); // Slower reverse
                moved = true;
            }

            if (inputMap["arrowleft"]) {
                this.carModel.rotationQuaternion = Quaternion.FromAxisAngle(Vector3.UpReadOnly, -this.rotationSpeed).multiply(this.carModel.rotationQuaternion);
                rotated = true;
            }
            if (inputMap["arrowright"]) {
                this.carModel.rotationQuaternion = Quaternion.FromAxisAngle(Vector3.UpReadOnly, this.rotationSpeed).multiply(this.carModel.rotationQuaternion);
                rotated = true;
            }
            
            const actionPerformed = moved || rotated;

            if (actionPerformed) {
                this.carModel.computeWorldMatrix(true); // Update world matrix after any move/rotation
                let collisionDetected = false;
                if (moved) { // Only check collision if moved
                    const carBoundingBox = this.carModel.getBoundingInfo().boundingBox;
                    for (const obstacle of this.obstacles) {
                        if (carBoundingBox.intersects(obstacle.getBoundingInfo().boundingBox)) {
                            collisionDetected = true;
                            break;
                        }
                    }
                }

                if (collisionDetected) {
                    this.carModel.position = previousPosition;
                    this.carModel.rotationQuaternion = previousRotation; // Revert rotation on collision too
                    this.carModel.computeWorldMatrix(true); // Update matrix again after reverting
                }
            }
            
            this.updateCameraPosition();
            
            if (actionPerformed && this.onCarMoved) { // Notify if any action was performed and callback exists
                this.onCarMoved(this.carModel.getAbsolutePosition(), isSprinting);
            }
        });
    }

    public setCameraViewType(viewType: 'sky' | 'ground'): void {
        this.activeCameraView = viewType;
        // Immediate position update. If performance becomes an issue, could be throttled or only updated in render loop.
        this.updateCameraPosition(); 
    }

    private updateCameraPosition(): void {
        if (!this.camera || !this.carModel || !this.scene) {
            // If carModel is not loaded yet, position camera at a default spot or based on scene origin.
            if (this.camera && !this.carModel) {
                 this.camera.position = this.skyViewOffset; // Default sky view if no car
                 this.camera.setTarget(Vector3.Zero());
            }
            return;
        }

        let cameraPositionInCarSpace: Vector3;

        if (this.activeCameraView === 'ground') {
            cameraPositionInCarSpace = this.groundViewOffset;
        } else { // 'sky'
            cameraPositionInCarSpace = this.skyViewOffset;
        }

        // Transform offset from car's local space to world space
        // Important: Use carModel.getWorldMatrix() for rotation if the car itself rotates.
        // If the car only moves but doesn't rotate relative to world Y axis, simpler methods can be used.
        // Assuming carModel can rotate, so using its world matrix for orientation.
        const carWorldMatrix = this.carModel.getWorldMatrix();
        // We need the rotation component of the car's world matrix.
        // Option 1: Decompose matrix (can be complex)
        // Option 2: If car has a `rotationQuaternion` and it's up-to-date.
        // Option 3: Simpler approach if car's "forward" is along its local Z, and it rotates around Y.
        // For now, let's assume car's rotation is primarily around Y axis for simplicity in offset calculation.
        // A full matrix transformation for the offset is more robust for complex rotations.
        
        let worldOffset: Vector3;
        if (this.carModel.rotationQuaternion) {
            // Create a rotation matrix from the car's quaternion
            const rotationMatrix = Matrix.RotationQuaternion(this.carModel.rotationQuaternion);
            worldOffset = Vector3.TransformCoordinates(cameraPositionInCarSpace, rotationMatrix);
        } else {
            // Fallback if no quaternion (e.g. using .rotation.y)
            // This simplified version assumes rotation is mainly around Y. For complex rotations, it's less accurate.
            const rotationMatrix = Matrix.RotationY(this.carModel.rotation.y);
            worldOffset = Vector3.TransformCoordinates(cameraPositionInCarSpace, rotationMatrix);
        }
        
        const desiredCameraPosition = this.carModel.getAbsolutePosition().add(worldOffset);

        // Set camera position
        this.camera.position = desiredCameraPosition;

        // Set camera target - always look at the car model's center
        this.camera.setTarget(this.carModel.getAbsolutePosition());
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

    public getBabylonOrigin(): Vector3 | null {
        return this.babylonOrigin;
    }

    public getCarRotationQuaternion(): Quaternion | null {
        return this.carModel ? this.carModel.rotationQuaternion : null;
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
