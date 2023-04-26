import * as THREE from "three";
import dataInput from "../data";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

import { createSpiral, provisionSpiral } from "./spiral";

const PARAMS = {
  progress: 0,
  width: 600,
  height: 600,
  oneGradRadius: 20,
  zeroGradRadius: 10,
  spiralHeight: 50,
  cameraWidth: 70,
  cameraHeight: 70,
  cameraNear: 1,
  cameraFar: 1000,
};

const slider = document.getElementById("rangeInput")!;

// Initialize the scene
const scene = new THREE.Scene();

// Create an orthographic camera
const camera = new THREE.OrthographicCamera(
  PARAMS.cameraWidth / -2,
  PARAMS.cameraWidth / 2,
  PARAMS.cameraHeight / 2,
  PARAMS.cameraHeight / -2,
  PARAMS.cameraNear,
  PARAMS.cameraFar
);

// Position the camera
camera.position.set(0, 0, PARAMS.spiralHeight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(PARAMS.height, PARAMS.width);
document.body.appendChild(renderer.domElement);

interface DataPoint {
  year: number;
  monthIndex: number;
}

interface Month {
  label: string;
  angle: number;
}

interface Data {
  monthes: Month[];
  dataPoints: DataPoint[];
}

function createLabels(
  { monthes, dataPoints }: Data,
  font: Font
): [THREE.Group, THREE.Group, THREE.Line] {
  // Create the geometry for the ruler
  const rulerGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();

  // Create the material for the ruler
  const rulerMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0x666666,
  });

  // Create the ruler object and add it to the scene
  const ruler: THREE.Line = new THREE.Line(rulerGeometry, rulerMaterial);

  const monthLabels: THREE.Group = new THREE.Group();
  for (const { label, angle } of monthes) {
    const textGeometry: TextGeometry = new TextGeometry(label, {
      font,
      size: 2,
      height: 0.2,
    });
    const textMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const textMesh: THREE.Mesh = new THREE.Mesh(textGeometry, textMaterial);

    const labelPos: THREE.Vector3 = new THREE.Vector3(
      PARAMS.oneGradRadius * 1.25 * Math.cos(angle),
      PARAMS.spiralHeight * 0.5,
      PARAMS.oneGradRadius * 1.3 * Math.sin(angle)
    );

    textMesh.position.copy(labelPos);
    textMesh.rotation.x -= Math.PI / 2;

    monthLabels.add(textMesh);
  }

  const yearLabels: THREE.Group = new THREE.Group();
  const rulerVertices: THREE.Vector3[] = [];

  dataPoints.forEach(({ year, monthIndex }: DataPoint, i: number) => {
    const x: number = PARAMS.oneGradRadius * 1.3;
    const y: number = PARAMS.spiralHeight * (i / dataPoints.length - 0.5);
    const rx: number = x - 4;
    const ry: number = y + 1;

    if (year % 20 === 0 && monthIndex === 1) {
      const textGeometry: TextGeometry = new TextGeometry(year.toString(), {
        font,
        size: 1.5,
        height: 0.2,
      });
      const textMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(
        {
          color: 0xffffff,
        }
      );
      const textMesh: THREE.Mesh = new THREE.Mesh(textGeometry, textMaterial);

      textMesh.position.x = x;
      textMesh.position.y = y;
      textMesh.visible = false;

      yearLabels.add(textMesh);

      rulerVertices.push(new THREE.Vector3(rx, ry, 0));
      rulerVertices.push(new THREE.Vector3(rx + 2, ry, 0));
      rulerVertices.push(new THREE.Vector3(rx, ry, 0));
    }

    if (year % 10 === 0 && monthIndex === 1) {
      rulerVertices.push(new THREE.Vector3(rx, ry, 0));
      rulerVertices.push(new THREE.Vector3(rx + 1, ry, 0));
      rulerVertices.push(new THREE.Vector3(rx, ry, 0));
    }
  });
  rulerGeometry.setFromPoints(rulerVertices);

  return [monthLabels, yearLabels, ruler];
}

const controlLabelVisibility = (monthLabels, yearLabels, ruler) => {
  // Check if the camera is looking from above
  const cameraLook = new THREE.Vector3();
  camera.getWorldDirection(cameraLook);
  const up = new THREE.Vector3(0, 1, 0);
  const angle = cameraLook.angleTo(up);

  // Show or hide the month labels based on the angle
  if (angle >= Math.PI * 0.8 || angle <= Math.PI * 0.2) {
    // Show the month labels
    monthLabels.children.forEach((label) => {
      label.visible = true;
    });

    yearLabels.children.forEach((label) => {
      label.visible = ruler.visible = false;
    });
  } else {
    // Hide the month labels
    monthLabels.children.forEach((label) => {
      label.visible = false;
    });

    yearLabels.children.forEach((label) => {
      label.visible = ruler.visible = true;
    });
  }
};

const loadFont = async () => {
  const fontLoader = new FontLoader();
  const font: void | Font = await new Promise(
    (resolve: (font: Font) => any) => {
      fontLoader.load(
        "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json",
        resolve
      );
    }
  ).catch((e: Error) => console.error(e));

  return font;
};

(async () => {
  const data = await dataInput();
  slider.setAttribute("max", data.dataPoints.length);

  const font = await loadFont();

  const [monthLabels, yearLabels, ruler] = createLabels(data, font as Font);
  scene.add(monthLabels);
  scene.add(yearLabels);
  scene.add(ruler);

  const spiral = createSpiral(data, PARAMS.progress);
  scene.add(spiral);

  // Add a directional light to the scene
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 0, 1);
  scene.add(light);

  // Add an ambient light to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const controls = new OrbitControls(camera, renderer.domElement);

  const animate = (timestamp) => {
    requestAnimationFrame(animate);

    controls.update();
    controlLabelVisibility(monthLabels, yearLabels, ruler);

    //riseTheRange(slider, dataPoints, 2000 - timestamp)

    renderer.render(scene, camera);
  };

  animate(0);

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function () {
    // @ts-ignore
    PARAMS.progress = this.value!;
    provisionSpiral(data, spiral, PARAMS);
  };
})();

const riseTheRange = (slider, dataPoints, defer = 0) => {
  if (defer >= 0) {
    return;
  }
  if (PARAMS.progress < dataPoints.length) {
    const _v = slider.getAttribute("value") || "0";
    slider.setAttribute("value", parseInt(_v) + 2);
    var event = new Event("input", {
      bubbles: true,
      cancelable: true,
    });

    slider.dispatchEvent(event);
  }
};
