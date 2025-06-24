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
    <div className="absolute top-[70px] left-[10px] bg-white bg-opacity-80 p-[10px] rounded-[5px] z-10 flex flex-col gap-[8px]">
      <h4 className="text-sm font-semibold">Select Model:</h4>
      {models.map((model) => {
        const isActive = currentModelUrl === model.url || (currentModelUrl === null && model.url === null);
        return (
          <button
            key={model.name}
            onClick={() => onSelectModel(model.url)}
            className={`
              py-2 px-3 border border-gray-300 rounded-[4px] cursor-pointer text-left
              ${isActive ? 'bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'}
              ${isActive ? 'cursor-default' : 'cursor-pointer'}
            `}
            disabled={isActive}
          >
            {model.name}
          </button>
        );
      })}
    </div>
  );
};

export default ModelSelector;
