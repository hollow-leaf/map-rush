export interface ModelConfig {
  url: string;
  baseScale?: { x: number; y: number; z: number }; // Optional: if we want to scale the model
  positionOffset?: { x: number; y: number; z: number }; // Optional: for fine-tuning position relative to map coordinates
  rotationOffset?: { x: number; y: number; z: number }; // Optional: for adjusting initial orientation
  worldOrigin?: [number, number]; // Optional: LngLat array for the model's world origin
  worldAltitude?: number; // Optional: Altitude for the model's world origin
}

export interface CustomLayerSettings {
  modelConfigs: ModelConfig[]; // Allowing for multiple models in the future
  initialGameModelPosition: {
    // This might be more related to the game logic itself
    // but can be configured here for centralization.
    // For now, let's assume these are Babylon world coordinates.
    x: number;
    y: number; // Babylon's Y is typically up
    z: number;
  };
  // Add other layer-wide settings here if needed
}

// Example Configuration
export const defaultCustomLayerSettings: CustomLayerSettings = {
  modelConfigs: [
    {
      url: 'https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf', // Default car model
      baseScale: { x: 1.5, y: 1.5, z: 1.5 },
      positionOffset: { x: 0, y: 0.5, z: 0 }, // Move up slightly on Y-axis
      rotationOffset: { x: 0, y: 45, z: 0 },   // Rotate 45 degrees around Y-axis
      worldOrigin: [-74.006, 40.7128], // Default origin from example
      worldAltitude: 0, // Default altitude from example
    },
    // Add more models here if needed
    // {
    //   url: 'path/to/another/model.gltf',
    //   baseScale: { x: 0.5, y: 0.5, z: 0.5 }
    // }
  ],
  initialGameModelPosition: {
    x: 0, // Centered at the map's initial lat/lng for now
    y: 0, // Ground level
    z: 0, // Centered
  },
};

// Function to get a specific model config (e.g., by index or name if we add ids)
export const getModelConfig = (index: number = 0): ModelConfig | undefined => {
  return defaultCustomLayerSettings.modelConfigs[index];
};

// In the future, we might have different sets of configurations
// export const alternativeCustomLayerSettings: CustomLayerSettings = { ... };

console.log('Custom Layer Config Loaded'); // For debugging to ensure file is processed
