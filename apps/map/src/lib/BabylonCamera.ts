import { FreeCamera, Vector3, Scene, AbstractMesh, Matrix, Quaternion } from '@babylonjs/core';

export class BabylonCamera {
    public instance: FreeCamera | null = null;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private carModel: AbstractMesh | null = null; // Reference to the car model for targeting

    public activeCameraView: 'sky' | 'ground' = 'sky'; // Default view
    private groundViewOffset = new Vector3(0, 2, -6);
    private skyViewOffset = new Vector3(0, 10, -10);

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.initialize();
    }

    private initialize(): void {
        this.instance = new FreeCamera("camera1", new Vector3(0, 5, -10), this.scene);
        this.instance.fov = Math.PI / 4; // Set FOV
        this.instance.setTarget(Vector3.Zero());
        this.instance.attachControl(this.canvas, true); // TODO: Consider if camera controls should be managed here or by a dedicated input manager
    }

    public setCarModel(model: AbstractMesh): void {
        this.carModel = model;
        this.updateCameraPosition(); // Initial position update once model is set
    }

    public setCameraViewType(viewType: 'sky' | 'ground'): void {
        this.activeCameraView = viewType;
        this.updateCameraPosition();
    }

    public updateCameraPosition(): void {
        if (!this.instance) return;

        if (!this.carModel) {
            // Default camera position if no car model is set (e.g., looking at scene origin)
            this.instance.position = this.activeCameraView === 'sky' ? this.skyViewOffset : new Vector3(0, 2, -5); // Adjusted ground view without car
            this.instance.setTarget(Vector3.Zero());
            return;
        }

        let cameraPositionInCarSpace: Vector3;

        if (this.activeCameraView === 'ground') {
            cameraPositionInCarSpace = this.groundViewOffset;
        } else { // 'sky'
            cameraPositionInCarSpace = this.skyViewOffset;
        }

        const carWorldMatrix = this.carModel.getWorldMatrix();
        let worldOffset: Vector3;

        // Ensure carModel has rotationQuaternion, default to Euler if not.
        const carRotationQuaternion = this.carModel.rotationQuaternion ? this.carModel.rotationQuaternion : Quaternion.FromEulerVector(this.carModel.rotation);
        
        if (carWorldMatrix) {
            // Convert the camera position from car space to world space
            worldOffset = Vector3.TransformCoordinates(cameraPositionInCarSpace, carWorldMatrix)
                .add(this.carModel.getAbsolutePosition());
        } else {
            // Fallback if carWorldMatrix is not available
            worldOffset = cameraPositionInCarSpace.add(this.carModel.getAbsolutePosition());
        }
        // Calculate the desired camera position in world space
        // Use the car's absolute position to set the camera target
        // This ensures the camera follows the car's position in the scene
        if (!this.carModel.getAbsolutePosition) {
            console.warn("Car model does not have an absolute position method, using local position instead.");
            this.carModel.getAbsolutePosition = () => this.carModel.position;
        }
        
        const desiredCameraPosition = this.carModel.getAbsolutePosition().add(worldOffset);

        this.instance.position = desiredCameraPosition;
        this.instance.setTarget(this.carModel.getAbsolutePosition());
    }

    public getActiveCamera(): FreeCamera | null {
        return this.instance;
    }
}
