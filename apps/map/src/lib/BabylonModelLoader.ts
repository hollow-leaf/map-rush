import { Scene, SceneLoader, AbstractMesh, Vector3, Quaternion } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // For GLTF model loading
import type { ModelConfig } from './CustomLayerConfig'; // Import ModelConfig type

// Define a type for the optional config parameters to loadCarModel
type ModelLoadConfig = Pick<ModelConfig, 'baseScale' | 'positionOffset' | 'rotationOffset'>;

export class BabylonModelLoader {
    private scene: Scene;
    public carModel: AbstractMesh | null = null;
    private babylonOrigin: Vector3 | null = null; 

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public async loadCarModel(
        modelUrl: string, 
        config?: ModelLoadConfig
    ): Promise<AbstractMesh | null> {
        try {
            const model = await SceneLoader.LoadAssetContainerAsync(modelUrl, "", this.scene)
                .then((modelContainer) => {
                modelContainer.addAllToScene();
                const rootMesh = modelContainer.createRootMesh();
                if (rootMesh) {
                    this.carModel = rootMesh as AbstractMesh;
                    this.babylonOrigin = this.carModel.getBoundingInfo().boundingBox.centerWorld;

                    // Apply position offset if provided
                    if (config?.positionOffset) {
                        const offset = new Vector3(
                            config.positionOffset.x || 0,
                            config.positionOffset.y || 0,
                            config.positionOffset.z || 0
                        );
                        this.carModel.position.addInPlace(offset);
                    }

                    // Apply rotation offset if provided
                    if (config?.rotationOffset) {
                        const rotation = Quaternion.FromEulerAngles(
                            config.rotationOffset.x || 0,
                            config.rotationOffset.y || 0,
                            config.rotationOffset.z || 0
                        );
                        this.carModel.rotationQuaternion = rotation;
                    }
                } else {
                    console.error("BabylonLayerImpl: No root mesh found in the loaded model.");
                }
            })
            .catch((error) => {
                console.error("BabylonLayerImpl: Error loading model asset.", error);
            });
            console.log("Model loaded successfully:", model);

            return this.carModel;
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

    public removeCurrentModel(): void {
        if (this.carModel) {
            this.carModel.dispose(); // Dispose of the mesh and its resources
            this.carModel = null;
            this.babylonOrigin = null;
            console.log("BabylonModelLoader: Current model removed.");
        }
    }
}
