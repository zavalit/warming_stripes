import dataInput from '../data'

const PARAMS = {
	progress: 0
}


const canvas = document.createElement('canvas');
canvas.setAttribute('id', 'climate_spiral');
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d')!;

const dpx = Math.min(2, window.devicePixelRatio)

const width = 1200
const height = 1200
canvas.width = width ;
canvas.height = height;
canvas.style.width = `${width / dpx}`;
canvas.style.height =`${height / dpx}`;


ctx.font = '40px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const oneGradRadius = 450;
const zeroGradRadius = oneGradRadius * .5;
const labelRadius = oneGradRadius * 1.15;


const slider = document.getElementById("rangeInput")!;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  PARAMS.progress = this.value!;
};
  
  

(async () => {
    
    const {monthes, dataPoints} = await dataInput()
	slider.setAttribute('max', dataPoints.length)

    const [centerX, centerY] = [canvas.width * .5, canvas.height * .5]

		const renderSpiral = () => {

			ctx.clearRect(0, 0, height, width)

				// LABELS
				monthes.forEach(({label, angle}, i) => {        
					const labelX = centerX + labelRadius * Math.cos(angle)
					const labelY = centerY + labelRadius * Math.sin(angle)
					ctx.textAlign = 'center';
					ctx.fillStyle = 'white'
					ctx.fillText(label, labelX, labelY)
			})
			
			

			renderDataPoints()

			// render help lines and labels

			ctx?.beginPath();
			ctx.arc(centerX, centerY, oneGradRadius, 0, Math.PI * 2);
			ctx.strokeStyle = '#ffff00';
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx?.beginPath();
			ctx.arc(centerX, centerY, zeroGradRadius, 0., Math.PI * 2.);
			ctx.strokeStyle = '#ffff00'
			ctx.lineWidth = 1;
			ctx.stroke()			


			// 0 grad label
			ctx?.beginPath();
			ctx.roundRect(centerX - 30,centerY - zeroGradRadius - 35, 60, 60, 5);
			ctx.fillStyle = '#ffff00';
			ctx.fill();
			ctx.fillStyle = 'black'
			ctx.fillText('0°', centerX, centerY - zeroGradRadius)

			// 1 grad label
			ctx?.beginPath();
			ctx.roundRect(centerX - 30,centerY - oneGradRadius - 35, 60, 60, 5);
			ctx.fillStyle = '#ffff00';
			ctx.fill();
			ctx.fillStyle = 'black'
			ctx.fillText('1°', centerX, centerY - oneGradRadius)
			
		}



	    // YEARS DATA
		const renderDataPoints = () => {
			
			const dataPointsOI = dataPoints.slice(0, PARAMS.progress)
			let currentYear;
		
			dataPointsOI.forEach(({value, year, monthIndex}, i) => {
		
				currentYear = year
				
				const {angle, nextAngle} = monthes[monthIndex]
								
				const nextDataPoint = dataPointsOI[i + 1]
		
				if(!nextDataPoint) {
					return
				}
		
				const currentMeanDiff = value
				const nextMeanDiff = nextDataPoint.value
			
				const x1 = centerX + zeroGradRadius * (1  +  currentMeanDiff) * Math.cos(angle)
				const y1 = centerY + zeroGradRadius * (1  +  currentMeanDiff) * Math.sin(angle)
		
				const x2 = centerX + zeroGradRadius * (1  +  nextMeanDiff) * Math.cos(nextAngle) 
				const y2 = centerY + zeroGradRadius * (1  +  nextMeanDiff) * Math.sin(nextAngle) 
		
				var grad= ctx.createLinearGradient(x1, y1, x2, y2);
				grad.addColorStop(0, getRemapedColor(currentMeanDiff));
				grad.addColorStop(1, getRemapedColor(nextMeanDiff));
		
				ctx.beginPath()
				ctx.moveTo(x1, y1)
				ctx.lineTo(x2, y2)
				ctx.strokeStyle = grad
				ctx.stroke()
				
			})
		
			
			currentYear && ctx.fillText(currentYear, centerX, centerY)
		
		}
		
		slider.oninput = function() {
			PARAMS.progress = this.value;
			renderSpiral()

		}
			
		renderSpiral()
			
})()




function lerpColor(color1, color2, weight) {
    // convert each color to an array of [r, g, b] values
    const c1 = color1.match(/\d+/g).map(Number);
    const c2 = color2.match(/\d+/g).map(Number);
    // interpolate each color channel separately
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * weight);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * weight);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * weight);
    // return the interpolated color as an RGB string
    return `rgb(${r}, ${g}, ${b})`;
  }
  
	// from -1...1 to 0...1
  function getRemapedColor(value) {
		return getColor((value + 1) * .5)
	}

  function getColor(value) {
    if (value < 0.5) {
      return lerpColor('rgb(0, 0, 255)', 'rgb(255, 255, 255)', value * 2);
    } else {
      return lerpColor('rgb(255, 255, 255)', 'rgb(255, 0, 0)', (value - 0.5) * 2);
    }
  }
  



	const debugTemperatureColor = () => {

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 100;
		
		for (let i = 0; i <= 1; i += 0.01) {
			const value = i;
			const color = getColor(value);
			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.arc(centerX, centerY, radius, (i - 0.5) * Math.PI, (i - 0.49) * Math.PI);
			ctx.stroke();
		}
		

	}

