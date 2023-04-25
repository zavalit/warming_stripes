import * as THREE from 'three'
import dataInput from '../data'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

 



// Initialize the scene
const scene = new THREE.Scene();

// Set up the camera
// const camera = new THREE.PerspectiveCamera(
//   75, // field of view
//   window.innerWidth / window.innerHeight, // aspect ratio
//   0.1, // near clipping plane
//   1000 // far clipping plane
// );
// // Position the camera
//camera.position.set(0, 50, 100);



// Create an orthographic camera
const cameraWidth = 100; // Width of the camera's view
const cameraHeight = cameraWidth * (window.innerHeight / window.innerWidth); // Height of the camera's view, adjusted for the aspect ratio
const camera = new THREE.OrthographicCamera(
  cameraWidth / -2, // Left
  cameraWidth / 2, // Right
  cameraHeight / 2, // Top
  cameraHeight / -2, // Bottom
  1, // Near
  1000 // Far
);

// Position the camera
camera.position.set(0, 0., 50.);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function createYearLabel(year, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = '16px Arial';
    context.fillStyle = 'white';
    context.fillText(year.toString(), 0, 16);
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(canvas.width / 32, canvas.height / 32);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.5, // Adjust the roughness to control the reflection
      metalness: 0.5, // Adjust the metalness to control the shine
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

(async () => {

    const {monthes, dataPoints} = await dataInput()

    const fontLoader = new FontLoader();
    const font = await new Promise(resolve => {
        fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', resolve);
    });
    
    // Set up the parameters for the spiral
    
    const oneGradRadius = 20;
    const zeroGradRadius = oneGradRadius * .5; // Radius of the spiral
    const spiralHeight = 50; // Height of the spiral
    

    // Create the spiral geometry
    const spiralGeometry = new THREE.BufferGeometry();
    const dataPointsOI = dataPoints;

    const obtainSpiralY = (i) => {
        const k = i / dataPointsOI.length;
        return spiralHeight * k - spiralHeight *.5;
    }
    
    const colors = []
    const white =  new THREE.Color(0xffffff)
    const blue =  new THREE.Color(0x0000ff)
    const red =  new THREE.Color(0xff0000)
    const positions = dataPointsOI.map(({value, monthIndex}, i) => {		        
        
        const {angle} = monthes[monthIndex]

        const mean = zeroGradRadius * (1  +  value)
        const x = mean * Math.cos(angle)
		const z = mean * Math.sin(angle)
		
        const y = obtainSpiralY(i)

        

        // Calculate the color based on the x position
        let color;
        if (mean < zeroGradRadius) {
            color = interpolateColor(blue, white, mean / zeroGradRadius);
        } else if (mean < 2 * zeroGradRadius) {
            color = interpolateColor(white, red, (mean - zeroGradRadius) / zeroGradRadius);
        } else {
            color = red;
        }

        colors.push(color.r, color.g, color.b);


        return  [x, y, z]    
    }).flat()
    
    const yearLabels = []
    for (const i in dataPointsOI) {

        const {year} = dataPointsOI[i]
        if (year % 20 === 0) {
            const textGeometry = new TextGeometry(year.toString(), {
                font: font,
                size: 2,
                height: 0.2,
            });
            const textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

            const y = obtainSpiralY(i)
            const x = oneGradRadius * 1.3;

            const labelPos = new THREE.Vector3(x, y, 0);
            textMesh.position.copy(labelPos);
            scene.add(textMesh);
            yearLabels.push(textMesh)
        }
    }
    
    spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  
   // Create the material for the spiral
   const spiralMaterial = new THREE.LineBasicMaterial({
        linewidth: 2,
        vertexColors: true
    });
   

    // Create the spiral mesh
    const spiralMesh = new THREE.Line(spiralGeometry, spiralMaterial);
    spiralGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // set the colors attribute of the geometry
    
    function interpolateColor(color1, color2, factor) {
        const result = color1.clone();
        result.lerp(color2, factor);
        return result;
      }
      

    
   

    // Add the spiral mesh to the scene
    scene.add(spiralMesh);


    // Month Lables

    // Create an array to hold the month labels
    const monthLabels = [];

    // Add the month labels to the scene
    for (let i = 0; i < 12; i++) {
        const {label, angle} = monthes[i];
        const textGeometry = new TextGeometry(label, {
            font: font,
            size: 2,
            height: 0.2,
        });
        const textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        const labelPos = new THREE.Vector3(oneGradRadius * 1.1 * Math.cos(angle), spiralHeight *.5, oneGradRadius * 1.3 * Math.sin(angle));
        
        textMesh.position.copy(labelPos);
        textMesh.rotation.x -= Math.PI / 2;
        monthLabels.push(textMesh);
        scene.add(textMesh);
    }


    const controlLabelVisibility = () =>  {
        // Check if the camera is looking from above
        const cameraLook = new THREE.Vector3();
        camera.getWorldDirection(cameraLook);
        const up = new THREE.Vector3(0, 1, 0);
        const angle = cameraLook.angleTo(up);
        console.log('angle', angle)

        // Show or hide the month labels based on the angle
        if (angle >= Math.PI * .8 || (angle <= Math.PI * .2 )) {
            // Show the month labels
            monthLabels.forEach((label) => {
                label.visible = true;
            });
            yearLabels.forEach((label) => {
                label.visible = false;
            });
        } else {
            // Hide the month labels
            monthLabels.forEach((label) => {
            label.visible = false;
            });
            yearLabels.forEach((label) => {
                label.visible = true;
            });
        }


    }



    // Add a directional light to the scene
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 1);
    scene.add(light);

    // Add an ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);


    const controls = new OrbitControls(camera, renderer.domElement);


    const animate = () => {

        requestAnimationFrame(animate)
        controls.update();
        controlLabelVisibility()
        // Render the scene
        renderer.render(scene, camera);
        


    }


    animate()
    
    

  

    
})()

