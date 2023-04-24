import csvDataUrl from 'url:../data/globalMeans.csv';


const PARAMS = {
	progress: 0
}

// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function csvToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }


        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
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
canvas.style.width = width / dpx;
canvas.style.height = height / dpx;


ctx.font = '40px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const oneGradRadius = 450;
const zeroGradRadius = oneGradRadius * .5;
const labelRadius = oneGradRadius * 1.15;


const slider = document.getElementById("myRange")!;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  PARAMS.progress = this.value!;
};
  
  

(async () => {
    
    const csv = await fetch(csvDataUrl)
    .then(response => response.text())

    const [, header, ...data] = csvToArray(csv, ',');


    const mCount = 12;

		const monthes = [...Array.from(Array(mCount).keys())].map(i => {
        
			const angle = (Math.PI * 2.) * i / mCount - Math.PI * .5
			const nextI = mCount - 1 > i ? i + 1 : 0
			const nextAngle = (Math.PI * 2.) * nextI /mCount - Math.PI * .5

			return {
					label: header[i+1],
					angle,
					nextAngle,
					nextI
			}

	})
		const dataPoints = data.reduce((acc: any, currentYear: any) => {

			const [year, ...monthData] = currentYear
			if(!year){
				return acc
			}

			const validPoints = monthData.slice(0, mCount)
				.map(p => parseFloat(p))
				.map((value, i) => ({value, year, monthIndex: i}))
				.filter(p => p.value)
				

			return [...acc, ...validPoints]
		}, [])

		slider.setAttribute('max', dataPoints.length)
		console.log('slider', slider)

    const [centerX, centerY] = [canvas.width * .5, canvas.height * .5]

		const renderSpiral = () => {

			ctx.clearRect(0, 0, height, width)

				// LABELS
				monthes.forEach(({label, angle}, i) => {        
					const labelX = centerX + labelRadius * Math.cos(angle)
					const labelY = centerY + labelRadius * Math.sin(angle)
					ctx.textAlign = 'center';
					ctx.fillText(label, labelX, labelY)
			})
			
			ctx?.beginPath();
			ctx.arc(centerX, centerY, oneGradRadius, 0, Math.PI * 2);
			ctx.strokeStyle = '#ffff00';
			ctx.lineWidth = 2;
			ctx.stroke();


			ctx?.beginPath();
			ctx.arc(centerX, centerY, zeroGradRadius, 0., Math.PI * 2.);
			ctx.strokeStyle = '#ffffff'
			ctx.lineWidth = 1;
			ctx.stroke()

			renderDataPoints()
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

