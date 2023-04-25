import * as THREE from 'three'
import dataInput from '../data'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

 
const PARAMS = {
    progress: 0
}

const slider = document.getElementById("rangeInput")!;




// Initialize the scene
const scene = new THREE.Scene();



const width = 600
const height = 600

// Create an orthographic camera
const cameraWidth = 90; // Width of the camera's view
const cameraHeight = cameraWidth * (height/ width); // Height of the camera's view, adjusted for the aspect ratio
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
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(height, width);
document.body.appendChild(renderer.domElement);

const white =  new THREE.Color(0xffffff);
const blue =  new THREE.Color(0x0000ff);
const red =  new THREE.Color(0xff0000);
        

       
function interpolateColor(color1, color2, factor) {
    const result = color1.clone();
    result.lerp(color2, factor);
    return result;
  }
  


(async () => {

    const {monthes, dataPoints} = await dataInput()

		slider.setAttribute('max',dataPoints.length)

    const fontLoader = new FontLoader();
    const font = await new Promise(resolve => {
        fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', resolve);
    });
    
    // Set up the parameters for the spiral
    
    const oneGradRadius = 20;
    const zeroGradRadius = oneGradRadius * .5; // Radius of the spiral
    const spiralHeight = 50; // Height of the spiral

    // Create an array to hold the month labels
    const monthLabels = [];

    // Add the month labels to the scene
    for (let i = 0; i < monthes.length; i++) {
        const {label, angle} = monthes[i];
        const textGeometry = new TextGeometry(label, {
            font: font,
            size: 2,
            height: 0.2,
        });
        const textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        const labelPos = new THREE.Vector3(oneGradRadius * 1.25 * Math.cos(angle) , spiralHeight *.5, oneGradRadius * 1.3 * Math.sin(angle));
        
        textMesh.position.copy(labelPos);
        textMesh.rotation.x -= Math.PI / 2;
        monthLabels.push(textMesh);
        scene.add(textMesh);
    }
    
    

    // Create the spiral geometry
    const spiralGeometry = new THREE.BufferGeometry();
		// Create the material for the spiral
    const spiralMaterial = new THREE.LineBasicMaterial({
            linewidth: 2,
            vertexColors: true
        });
    
    
		const spiralMesh = new THREE.Line(spiralGeometry, spiralMaterial);


		let yearLabels = []
    
		const buildSpiral = () => {
			const dataPointsOI = dataPoints.slice(0, PARAMS.progress);

			const obtainSpiralY = (i) => {
					const k = i / dataPoints.length;
					return spiralHeight * k - spiralHeight *.5;
			}
			
			const colors = []
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
	
			
	
					// Create the spiral mesh
					spiralGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // set the colors attribute of the geometry
					spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
			
					// Add the spiral mesh to the scene
					scene.add(spiralMesh);
			
			
					// Month Lables
	
	
	
	
			for (const i in dataPointsOI) {
	
					const {year, monthIndex} = dataPointsOI[i]
					
					if (year % 20 === 0 && monthIndex === 1) {
							const textGeometry = new TextGeometry(year.toString(), {
									font: font,
									size: 2,
									height: 0.2
									
							});
							const textMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x000000, specular: 0x111111});
							const textMesh = new THREE.Mesh(textGeometry, textMaterial);
	
							const y = obtainSpiralY(i)
							const x = oneGradRadius * 1.3;
	
							
							textMesh.position.x = x;
							textMesh.position.y = y
							scene.add(textMesh);
							yearLabels.push(textMesh)
					}
			}
			
		}
    

    const controlLabelVisibility = () =>  {
        // Check if the camera is looking from above
        const cameraLook = new THREE.Vector3();
        camera.getWorldDirection(cameraLook);
        const up = new THREE.Vector3(0, 1, 0);
        const angle = cameraLook.angleTo(up);

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

		buildSpiral()

    animate()
    
    
		// Update the current slider value (each time you drag the slider handle)
		slider.oninput = function() {
				
			PARAMS.progress = this.value!;
			buildSpiral()

		};

  

    
})()

