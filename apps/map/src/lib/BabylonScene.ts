import { Scene, Engine, Color4, HemisphericLight, PointLight, StandardMaterial, Color3, Vector3, MeshBuilder, AbstractMesh } from '@babylonjs/core';

export class BabylonScene {
    public instance: Scene;
    public obstacles: AbstractMesh[] = [];

    constructor(engine: Engine) {
        this.instance = new Scene(engine);
        this.initialize();
    }

    private initialize(): void {
        this.instance.clearColor = new Color4(0, 0, 0, 0); // Transparent background
        this.instance.autoClear = false; // For better blending with MapLibre scene

        // Basic light setup
        const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), this.instance);
        hemisphericLight.intensity = 0.7;

        // Point light for better visibility
        const pointLight = new PointLight("pointLight", new Vector3(0, 2, -2), this.instance);
        pointLight.intensity = 0.8;
    }

    public getObstacles(): AbstractMesh[] {
        return this.obstacles;
    }

    public render(): void {
        this.instance.render();
    }

    public dispose(): void {
        // Custom disposal logic for scene elements if needed, though scene.dispose() handles most.
        this.obstacles.forEach(obstacle => obstacle.dispose());
        this.instance.dispose();
    }
}
