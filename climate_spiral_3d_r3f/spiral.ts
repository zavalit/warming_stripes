import * as THREE from "three";

const white = new THREE.Color(0xffffff);
const blue = new THREE.Color(0x0000ff);
const red = new THREE.Color(0xff0000);

function interpolateColor(color1, color2, factor) {
  const result = color1.clone();
  result.lerp(color2, factor);
  return result;
}

export const provisionSpiral = ({ monthes, dataPoints }, mesh, PARAMS) => {
  const dataPointsOI = dataPoints.slice(0, PARAMS.progress);

  const colors = [];
  const positions = dataPointsOI
    .map(({ value, monthIndex }, i) => {
      const { angle } = monthes[monthIndex];

      const mean = PARAMS.zeroGradRadius * (1 + value);
      const x = mean * Math.cos(angle);
      const z = mean * Math.sin(angle);

      const y = PARAMS.spiralHeight * (i / dataPoints.length - 0.5);

      // Calculate the color based on the x position
      let color: THREE.Color;
      if (mean < PARAMS.zeroGradRadius) {
        color = interpolateColor(blue, white, mean / PARAMS.zeroGradRadius);
      } else if (mean < 2 * PARAMS.zeroGradRadius) {
        color = interpolateColor(
          white,
          red,
          (mean - PARAMS.zeroGradRadius) / PARAMS.zeroGradRadius
        );
      } else {
        color = red;
      }

      //@ts-ignore
      colors.push(color.r, color.g, color.b);

      return [x, y, z];
    })
    .flat();

  // Create the spiral mesh
  mesh.geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  ); // set the colors attribute of the geometry
  mesh.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
};

export const createSpiral = (data, progress) => {
  // Create the spiral geometry
  const spiralGeometry = new THREE.BufferGeometry();
  // Create the material for the spiral
  const spiralMaterial = new THREE.LineBasicMaterial({
    linewidth: 2,
    vertexColors: true,
  });
  const mesh = new THREE.Line(spiralGeometry, spiralMaterial);

  provisionSpiral(data, mesh, progress);

  return mesh;
};
