import * as THREE from "three";
import React from "react";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { useMemo } from "react";
import { Data } from "./ClimateSpiralWidget";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { useFrame } from "@react-three/fiber";
import { useStore } from ".";

const Labels = ({ data, font }: { data: Data; font: Font }) => {
  const { spiralHeight, oneGradRadius } = useStore((state) => state);

  const { monthes, dataPoints } = data;

  const monthLabels = useMemo(() => {
    const group = new THREE.Group();

    monthes.forEach(({ label, angle }) => {
      const textGeometry = new TextGeometry(label, {
        font,
        size: 2,
        height: 0.2,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);

      const labelPos = new THREE.Vector3(
        oneGradRadius * 1.25 * Math.cos(angle),
        spiralHeight * 0.5,
        oneGradRadius * 1.3 * Math.sin(angle)
      );

      textMesh.position.copy(labelPos);
      textMesh.rotation.x -= Math.PI / 2;

      group.add(textMesh);
    });

    return group;
  }, [monthes, font]);

  const [yearLabels, ruler] = useMemo(() => {
    const group = new THREE.Group();
    const rulerVertices: THREE.Vector3[] = [];

    dataPoints.forEach(({ year, monthIndex }, i) => {
      const x = oneGradRadius * 1.3;
      const y = spiralHeight * (i / dataPoints.length - 0.5);
      const rx = x - 4;
      const ry = y + 1;

      if (year % 20 === 0 && monthIndex === 1) {
        const textGeometry = new TextGeometry(year.toString(), {
          font,
          size: 1.5,
          height: 0.2,
        });
        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.x = x;
        textMesh.position.y = y;

        group.add(textMesh);

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

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(rulerVertices);

    const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
      color: 0xcccccc,
    });

    const ruler = new THREE.Line(geometry, material);

    return [group, ruler];
  }, [dataPoints, font]);

  useFrame(({ camera }) => {
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
  });

  return (
    <>
      <primitive object={monthLabels} />
      <primitive object={yearLabels} />
      <primitive object={ruler} />
    </>
  );
};

export default Labels;
