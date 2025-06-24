import React from 'react';

interface ModelSelectorProps {
  onSelectModel: (modelUrl: string | null) => void;
  currentModelUrl: string | null;
}

const DEFAULT_MODEL_NAME = "Default Box";
const CAR_MODEL_URL = "https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf";
const CAR_MODEL_NAME = "Concept Car";

const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelectModel, currentModelUrl }) => {
  const models = [
    { name: DEFAULT_MODEL_NAME, url: null },
    { name: CAR_MODEL_NAME, url: CAR_MODEL_URL },
    // Add more models here if needed
    // { name: "Another Model", url: "path/to/another/model.gltf" },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '70px', // Below Navbar
      left: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 10, // Ensure it's above the map but could be below other critical UI
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <h4>Select Model:</h4>
      {models.map((model) => (
        <button
          key={model.name}
          onClick={() => onSelectModel(model.url)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            backgroundColor: currentModelUrl === model.url || (currentModelUrl === null && model.url === null) ? '#cce5ff' : '#f0f0f0',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          disabled={currentModelUrl === model.url || (currentModelUrl === null && model.url === null)}
        >
          {model.name}
        </button>
      ))}
    </div>
  );
};

export default ModelSelector;
