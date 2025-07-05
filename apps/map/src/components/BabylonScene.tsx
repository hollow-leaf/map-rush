import React, { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core'; // For materials and colors
import '@babylonjs/loaders'; // For GLTF model loading
import { BabylonModelLoader } from '../lib/BabylonModelLoader'; // Import the model loader

interface BabylonSceneProps {
  modelUrl: string | null; // URL of the model to load, or null to show default/no model
}

const BabylonScene: React.FC<BabylonSceneProps> = ({ modelUrl }) => {
  const reactCanvas = useRef<HTMLCanvasElement | null>(null);
  const modelLoaderRef = useRef<BabylonModelLoader | null>(null);
  const sceneRef = useRef<Scene | null>(null); // Keep a ref to the scene for cleanup

  useEffect(() => {
    if (reactCanvas.current) {
      // for test basic theme
      const engine = new Engine(reactCanvas.current, true);
      const scene = new Scene(engine);
      sceneRef.current = scene; // Store scene for cleanup
      modelLoaderRef.current = new BabylonModelLoader(scene);

      // Create a camera
      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; // Adjust zoom sensitivity

      // Create a basic light
      new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
      new HemisphericLight("light2", new Vector3(-1, 1, 0), scene);


      // Simple ground plane (optional, but good for orientation)
      const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
      ground.material = new BABYLON.StandardMaterial("groundMat", scene);
      (ground.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      
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
        // modelLoaderRef.current?.removeCurrentModel(); // Ensure model is disposed
        if (sceneRef.current) {
          sceneRef.current.dispose();
        }
        engine.dispose();
      };
    }
  }, [reactCanvas]); // Initial setup effect, only runs once

  useEffect(() => {
    // Effect for loading/changing models when modelUrl prop changes
    if (modelLoaderRef.current) {
      modelLoaderRef.current.removeCurrentModel(); // Remove previous model

      if (modelUrl) {
        // For the new car model, let's try to scale and position it reasonably
        // These values might need adjustment based on the actual model's origin and scale
        const modelConfig = {
            baseScale: new Vector3(0.5, 0.5, 0.5), // Example scale, adjust as needed
            positionOffset: new Vector3(0, 0, 0), // Adjust if the model's pivot isn't at its base center
            rotationOffset: new Vector3(0, Math.PI / 2, 0) // Rotate if needed (radians)
        };
        modelLoaderRef.current.loadCarModel(modelUrl, modelConfig)
          .then((loadedModel) => {
            if (loadedModel) {
              // Optional: further adjustments after model is loaded
              loadedModel.position.y = 0; // Example: ensure it's on the ground
            }
          })
          .catch(error => console.error("Error loading model in component:", error));
      }
    }
  }, [modelUrl]); // This effect runs when modelUrl changes

  return (
    <canvas
      ref={reactCanvas}
      className="w-full h-full outline-none block"
    />
  );
};

export default BabylonScene;
