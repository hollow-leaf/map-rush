import { FreeCamera, Vector3, Scene, AbstractMesh, Quaternion } from '@babylonjs/core';

export class BabylonCamera {
    public instance: FreeCamera | null = null;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private carModel: AbstractMesh | null = null; // Reference to the car model for targeting

    public activeCameraView: 'sky' | 'ground' = 'sky'; // Default view
    private groundViewOffset = new Vector3(0, 1, -2); // Halved distance
    private skyViewOffset = new Vector3(0, 5, -1); // Halved distance

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.initialize();
    }

    private initialize(): void {
        // Simplified initial position and target for debugging
        // Restored original initialization logic, or close to it
        this.instance = new FreeCamera("camera1", new Vector3(0, 0, 0), this.scene); // Default position
        this.instance.fov = Math.PI / 2; // Set FOV
        // this.instance.setTarget(Vector3.Zero()); // Default target
        console.log("BabylonCamera: Camera initialized with default position and target.");
        // this.instance.attachControl(this.canvas, true); 
    }

    public setCarModel(model: AbstractMesh): void {
        // console.log("BabylonCamera: setCarModel called with model:", model ? model.name : "null");
        this.carModel = model;
        this.updateCameraPosition(); // Initial position update once model is set
    }

    public setCameraViewType(viewType: 'sky' | 'ground'): void {
        // console.log("BabylonCamera: setCameraViewType called with viewType:", viewType);
        this.activeCameraView = viewType;
        this.updateCameraPosition();
    }

    public updateCameraPosition(): void {
        if (!this.instance) {
            // console.error("BabylonCamera: updateCameraPosition called but camera instance is null.");
            return;
        }

        // console.log("BabylonCamera: updateCameraPosition called.");

        if (!this.carModel) {
            // console.log("BabylonCamera: No car model set. Using default camera position targeting origin.");
            this.instance.position = this.activeCameraView === 'sky' ? this.skyViewOffset.clone() : new Vector3(0, 2, -5); // Original logic for no car model
            this.instance.setTarget(Vector3.Zero());
            // console.log("  New Camera Position (no model):", this.instance.position.toString());
            // console.log("  New Camera Target (no model):", this.instance.getTarget().toString());
            return;
        }

        // console.log("BabylonCamera: Car model is present. Name:", this.carModel.name);
        const carAbsolutePosition = this.carModel.getAbsolutePosition();
        // console.log("  Car Model Absolute Position:", carAbsolutePosition.toString());
        // console.log("  Car Model Rotation Quaternion:", this.carModel.rotationQuaternion ? this.carModel.rotationQuaternion.toString() : "N/A");
        
        let cameraPositionInCarSpace: Vector3; 

        if (this.activeCameraView === 'ground') {
            cameraPositionInCarSpace = this.groundViewOffset.clone(); 
            // console.log("  Using groundViewOffset:", cameraPositionInCarSpace.toString());
        } else { // 'sky'
            cameraPositionInCarSpace = this.skyViewOffset.clone(); 
            // console.log("  Using skyViewOffset:", cameraPositionInCarSpace.toString());
        }

        const carRotation = this.carModel.rotationQuaternion ? this.carModel.rotationQuaternion : Quaternion.IdentityReadOnly;
        // if (!this.carModel.rotationQuaternion) {
            // console.warn("BabylonCamera: Car model does not have a rotationQuaternion. Using Identity.");
        // }

        const rotatedOffset = Vector3.Zero();
        cameraPositionInCarSpace.rotateByQuaternionToRef(carRotation, rotatedOffset); 
        
        // console.log("  Calculated rotatedOffset (world space offset from car):", rotatedOffset.toString());

        const finalDesiredCameraPosition = carAbsolutePosition.add(rotatedOffset);
        
        this.instance.position = finalDesiredCameraPosition;
        this.instance.setTarget(carAbsolutePosition); 

        // console.log("  New Camera Position (restored logic):", this.instance.position.toString());
        // console.log("  New Camera Target (restored logic):", this.instance.getTarget().toString());
    }

    public getActiveCamera(): FreeCamera | null {
        return this.instance;
    }
}
