import { Scene, Engine, Color4, HemisphericLight, Vector3, MeshBuilder, AbstractMesh } from '@babylonjs/core';

export class BabylonScene {
    public instance: Scene;
    public obstacles: AbstractMesh[] = [];

    constructor(engine: Engine) {
        this.instance = new Scene(engine);
        this.initialize();
    }

    private initialize(): void {
        this.instance.clearColor = new Color4(0, 0, 0, 0); // Transparent background

        // Basic light setup
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.instance);

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
