import { Scene, SceneLoader, AbstractMesh, Vector3 } from '@babylonjs/core';
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
                    this.carModel.position = initialPosition;
                    this.carModel.scaling = initialScaling;
                    this.carModel.computeWorldMatrix(true);

                    // If the car model has child meshes, ensure their world matrices are also updated.
                    // this.carModel.getChildMeshes().forEach(mesh => mesh.computeWorldMatrix(true));

                    if (!this.babylonOrigin) { // Set origin only once
                        this.babylonOrigin = this.carModel.getAbsolutePosition().clone();
                    }
                    return this.carModel;
                }
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
