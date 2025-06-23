import React, { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core'; // For materials and colors
import '@babylonjs/loaders'; // For potential model loading later

interface BabylonSceneProps {
  // We can add props later if needed, e.g., for passing car model info or initial settings
}

const BabylonScene: React.FC<BabylonSceneProps> = () => {
  const reactCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true);
      const scene = new Scene(engine);

      // Create a camera
      // ArcRotateCamera(name, alpha, beta, radius, target, scene)
      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);

      // Create a basic light
      new HemisphericLight("light", new Vector3(0, 1, 0), scene);

      // Create a placeholder for the car (e.g., a box)
      // This will be at the center of the scene (0,0,0) by default
      const carPlaceholder = MeshBuilder.CreateBox("carPlaceholder", { size: 1 }, scene);
      carPlaceholder.position.y = 0.5; // Adjust if needed so it's not halfway through a ground plane

      // Simple ground plane (optional, but good for orientation)
      const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
      ground.material = new BABYLON.StandardMaterial("groundMat", scene);
      (ground.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);


      // Add some placeholder boxes around the car
      const box1 = MeshBuilder.CreateBox("box1", { size: 2 }, scene);
      box1.position = new Vector3(5, 1, 5);
      const mat1 = new BABYLON.StandardMaterial("box1Mat", scene);
      mat1.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
      box1.material = mat1;

      const box2 = MeshBuilder.CreateBox("box2", { size: 1.5 }, scene);
      box2.position = new Vector3(-4, 0.75, 3);
      const mat2 = new BABYLON.StandardMaterial("box2Mat", scene);
      mat2.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
      box2.material = mat2;

      const box3 = MeshBuilder.CreateBox("box3", { size: 1 }, scene);
      box3.position = new Vector3(3, 0.5, -4);
      const mat3 = new BABYLON.StandardMaterial("box3Mat", scene);
      mat3.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue
      box3.material = mat3;


      engine.runRenderLoop(() => {
        scene.render();
      });

      const handleResize = () => {
        engine.resize();
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    }
  }, [reactCanvas]);

  return (
    <canvas
      ref={reactCanvas}
      style={{ width: '100%', height: '100%', outline: 'none', display: 'block' }}
    />
  );
};

export default BabylonScene;
