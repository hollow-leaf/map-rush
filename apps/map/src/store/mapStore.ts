import { create } from 'zustand';
import { LngLatLike } from 'maplibre-gl';

interface MapState {
  center: LngLatLike;
  zoom: number;
  pitch: number;
  bearing: number;
  setCenter: (center: LngLatLike) => void;
  setZoom: (zoom: number) => void;
  setPitch: (pitch: number) => void;
  setBearing: (bearing: number) => void;
  setMapState: (newState: Partial<Omit<MapState, 'setMapState' | 'setCenter' | 'setZoom' | 'setPitch' | 'setBearing'>>) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [-74.006, 40.7128], // Initial New York City
  zoom: 19,
  pitch: 90,
  bearing: 0,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setPitch: (pitch) => set({ pitch }),
  setBearing: (bearing) => set({ bearing }),
  setMapState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// Function to update store when map moves, can be called from MapComponent
export const updateStoreFromMap = (map: maplibregl.Map) => {
  useMapStore.getState().setMapState({
    center: map.getCenter().toArray() as [number, number],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  });
};
