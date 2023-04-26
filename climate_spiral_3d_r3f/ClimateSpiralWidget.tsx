import React, { Suspense, useEffect, useState, useMemo } from "react";
import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader.js";
import Labels from "./Labels";
import dataInput from "../data";
import { provisionSpiral } from "./spiral";
import * as THREE from "three";
import { useStore } from ".";

const loadFont = async () => {
  const fontLoader = new FontLoader();
  const font = await new Promise<Font>((resolve) => {
    fontLoader.load(
      "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json",
      resolve,
      undefined, // onProgress callback
      (err) => console.error(err) // onError callback
    );
  });

  return font;
};

export interface DataPoint {
  year: number;
  monthIndex: number;
}

export interface Month {
  label: string;
  angle: number;
}

export interface Data {
  monthes: Month[];
  dataPoints: DataPoint[];
}

const Spiral = ({ data }: { data: Data }) => {
  const { progress, zeroGradRadius, spiralHeight } = useStore((state) => state);

  const mesh = useMemo(() => {
    // Create the spiral geometry
    const spiralGeometry = new THREE.BufferGeometry();
    // Create the material for the spiral
    const spiralMaterial = new THREE.LineBasicMaterial({
      linewidth: 2,
      vertexColors: true,
    });
    const mesh = new THREE.Line(spiralGeometry, spiralMaterial);

    provisionSpiral(data, mesh, { progress, zeroGradRadius, spiralHeight });

    return mesh;
  }, [data]);

  useEffect(() => {
    provisionSpiral(data, mesh, { progress, zeroGradRadius, spiralHeight });
  }, [progress]);

  return <primitive object={mesh} />;
};

const spiralArgs = Promise.all([dataInput(), loadFont()]);

function App() {
  const [args, setArgs] = useState<{ data: Data; font: Font } | null>(null);
  const updateProgressMax = useStore((state) => state.updateProgressMax);

  useEffect(() => {
    spiralArgs.then(([data, font]) => {
      setArgs({ data, font });
      updateProgressMax(data.dataPoints.length);
    });
  }, []);

  return !args ? null : (
    <>
      <Labels {...args} />
      <Spiral {...{ data: args.data }} />
    </>
  );
}

export default App;
