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

        // Test Cube - This was for debugging, consider removing or making it optional
        const testCube = MeshBuilder.CreateBox("testCube", { size: 1 }, this.instance);
        testCube.position = new Vector3(0, 0.5, 0);
        const testCubeMaterial = new StandardMaterial("testCubeMaterial", this.instance);
        testCubeMaterial.diffuseColor = new Color3(1, 0, 0); // Red
        testCube.material = testCubeMaterial;

        // Example: Add a ground plane
        const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.instance);
        ground.computeWorldMatrix(true); // Ensure bounding box is ready

        // Add some obstacles
        const box1 = MeshBuilder.CreateBox("box1", { size: 1 }, this.instance);
        box1.position = new Vector3(2, 0.5, 5);
        box1.computeWorldMatrix(true);
        this.obstacles.push(box1);

        const box2 = MeshBuilder.CreateBox("box2", { size: 1 }, this.instance);
        box2.position = new Vector3(-3, 0.5, -2);
        box2.computeWorldMatrix(true);
        this.obstacles.push(box2);
        
        const sphere1 = MeshBuilder.CreateSphere("sphere1", { diameter: 1.5 }, this.instance);
        sphere1.position = new Vector3(0, 0.75, 2);
        sphere1.computeWorldMatrix(true);
        this.obstacles.push(sphere1);
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
