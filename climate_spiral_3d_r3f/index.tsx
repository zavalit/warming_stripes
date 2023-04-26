import React, { useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import ClimateSpiralWidget from "./ClimateSpiralWidget";
import { OrbitControls } from "@react-three/drei";
import { create } from "zustand";

document.body.innerHTML = '<div id="app"></div>';

const root = createRoot(document.getElementById("app"));

interface State {
  progress: number;
  progressMax: number;

  oneGradRadius: number;
  zeroGradRadius: number;
  spiralHeight: number;
  updateProgress: (p: number) => void;
  updateProgressMax: (p: number) => void;
}

export const useStore = create<State>((set) => ({
  progress: 0,
  progressMax: 0,

  oneGradRadius: 20,
  zeroGradRadius: 10,
  spiralHeight: 50,
  updateProgress: (progress) => set({ progress }),
  updateProgressMax: (progressMax) => set({ progressMax }),
}));

const Slider = () => {
  const ref = useRef<HTMLInputElement>(null);

  const [progressMax, updateProgress] = useStore((state) => [
    state.progressMax,
    state.updateProgress,
  ]);

  return (
    <input
      ref={ref}
      type="range"
      min="0"
      max={progressMax}
      defaultValue="0"
      className="range"
      id="rangeInput"
      onChange={(e) => updateProgress(parseInt(e.target.value))}
    />
  );
};

function App() {
  return (
    <>
      <Slider />
      <div style={{ width: 600, height: 600 }}>
        <Canvas
          linear
          orthographic
          camera={{ position: [0, 0, 50], zoom: 8.8 }}
        >
          <directionalLight
            color={0xffffff}
            intensity={1}
            position={[0, 0, 1]}
          />
          <ambientLight color={0xffffff} intensity={0.5} />
          <ClimateSpiralWidget />
          <OrbitControls />
        </Canvas>
      </div>
    </>
  );
}

root.render(<App />);
