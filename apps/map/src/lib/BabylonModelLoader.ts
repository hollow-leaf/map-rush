import { Scene, SceneLoader, AbstractMesh, Vector3, Quaternion, Tools } from '@babylonjs/core';
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
            const model = await SceneLoader.LoadAssetContainerAsync(modelUrl, "", this.scene);
            console.log("Model loaded successfully:", model);
            if (model.meshes.length > 0) {
                this.carModel = model.meshes[0]; 
                if (this.carModel) {
                    // Default position is (0,0,0)
                    this.carModel.position = new Vector3(0, 0, 0);
                    
                    // Default scaling if not provided in config
                    this.carModel.scaling = new Vector3(0.1, 0.1, 0.1); 

                    if (!this.carModel.rotationQuaternion) {
                        this.carModel.rotationQuaternion = Quaternion.Identity();
                    }

                    // Apply base scale from config if available
                    if (config?.baseScale) {
                        this.carModel.scaling = new Vector3(config.baseScale.x, config.baseScale.y, config.baseScale.z);
                    }

                    // Apply position offset from config if available
                    // This adds to the base position (0,0,0)
                    if (config?.positionOffset) {
                        this.carModel.position = this.carModel.position.add(
                            new Vector3(config.positionOffset.x, config.positionOffset.y, config.positionOffset.z)
                        );
                    }
                    
                    // Base rotation to align model from Y-up (standard) to Z-up (MapLibre)
                    // This is Math.PI / 2 around the X-axis.
                    let finalRotation = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);

                    // Apply rotation offset from config if available
                    // These are assumed to be Euler angles in degrees, need to convert to radians
                    if (config?.rotationOffset) {
                        const offsetXRad = Tools.ToRadians(config.rotationOffset.x);
                        const offsetYRad = Tools.ToRadians(config.rotationOffset.y);
                        const offsetZRad = Tools.ToRadians(config.rotationOffset.z);
                        const offsetQuaternion = Quaternion.FromEulerAngles(offsetXRad, offsetYRad, offsetZRad);
                        finalRotation = offsetQuaternion.multiply(finalRotation); // Apply offset first, then base rotation
                    }
                    
                    this.carModel.rotationQuaternion = finalRotation.multiply(this.carModel.rotationQuaternion);

                    this.carModel.computeWorldMatrix(true);
                    this.carModel.refreshBoundingInfo(true);
                    
                    const boundingBox = this.carModel.getBoundingInfo().boundingBox;
                    console.log("  BoundingBox Size (World):", boundingBox.extendSizeWorld.scale(2).toString());
                    console.log("  BoundingBox Min (World):", boundingBox.minimumWorld.toString());
                    console.log("  BoundingBox Max (World):", boundingBox.maximumWorld.toString());

                    if (!this.babylonOrigin) {
                        this.babylonOrigin = this.carModel.getAbsolutePosition().clone();
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
