import { Scene, SceneLoader, AbstractMesh, Vector3, Quaternion } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading

export class BabylonModelLoader {
    private scene: Scene;
    public carModel: AbstractMesh | null = null;
    private babylonOrigin: Vector3 | null = null; // Could be part of a broader world/coordinate manager

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public async loadCarModel(modelUrl: string, initialPosition: Vector3 = new Vector3(0, 0.2, 0), initialScaling: Vector3 = new Vector3(0.1, 0.1, 0.1)): Promise<AbstractMesh | null> {
        try {
            const model = await SceneLoader.ImportMeshAsync("", modelUrl, "", this.scene);
            console.log("Model loaded successfully:", model);
            if (model.meshes.length > 0) {
                this.carModel = model.meshes[0]; // Assuming the first mesh is the car root
                if (this.carModel) {
                    // console.log("BabylonModelLoader: Model imported successfully. Root mesh name:", this.carModel.name);
                    this.carModel.position = initialPosition;
                    this.carModel.scaling = initialScaling;
                    if (!this.carModel.rotationQuaternion) {
                        this.carModel.rotationQuaternion = Quaternion.Identity(); 
                    }

                    // Apply the X-axis rotation to align with MapLibre's coordinate system (+Z up)
                    // Assuming the original model is designed with Y-up standard.
                    const xUpToZUpRotation = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
                    this.carModel.rotationQuaternion = xUpToZUpRotation.multiply(this.carModel.rotationQuaternion);
                    
                    this.carModel.computeWorldMatrix(true); 

                    this.carModel.refreshBoundingInfo(true); 
                    const boundingBox = this.carModel.getBoundingInfo().boundingBox;
                    console.log("  BoundingBox Size (World):", boundingBox.extendSizeWorld.scale(2).toString()); 
                    console.log("  BoundingBox Min (World):", boundingBox.minimumWorld.toString());
                    console.log("  BoundingBox Max (World):", boundingBox.maximumWorld.toString());

                    if (!this.babylonOrigin) { 
                        this.babylonOrigin = this.carModel.getAbsolutePosition().clone();
                        // console.log("BabylonModelLoader: Babylon origin set to car model's initial absolute position:", this.babylonOrigin.toString());
                    }
                    return this.carModel;
                } else {
                    console.error("BabylonModelLoader: Root mesh (model.meshes[0]) is null after import.");
                }
            } else {
                console.error("BabylonModelLoader: No meshes found in the loaded model.");
            }
            return null;
        } catch (error) {
            console.error("Error loading model:", error);
            return null;
        }
    }

    public getCarModel(): AbstractMesh | null {
        return this.carModel;
    }

    public getBabylonOrigin(): Vector3 | null {
        return this.babylonOrigin;
    }
}
