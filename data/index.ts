import csvDataUrl from "url:./globalMeans.csv";

// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function csvToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ",";

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    // Delimiters.
    "(\\" +
      strDelimiter +
      "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      "\\r\\n]*))",
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
  while ((arrMatches = objPattern.exec(strData))) {
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    }

    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }

  // Return the parsed data.
  return arrData;
}

export default async () => {
  const csv = await fetch(csvDataUrl).then((response) => response.text());

  const [, header, ...data] = csvToArray(csv, ",");

  const mCount = 12;

  const monthes = [...Array.from(Array(mCount).keys())].map((i) => {
    const angle = (Math.PI * 2 * i) / mCount - Math.PI * 0.5;
    const nextI = mCount - 1 > i ? i + 1 : 0;
    const nextAngle = (Math.PI * 2 * nextI) / mCount - Math.PI * 0.5;

    return {
      label: header[i + 1],
      angle,
      nextAngle,
      nextI,
    };
  });

  const dataPoints = data.reduce((acc: any, currentYear: any) => {
    const [year, ...monthData] = currentYear;
    if (!year) {
      return acc;
    }

    const validPoints = monthData
      .slice(0, mCount)
      .map((p) => parseFloat(p))
      .map((value, i) => ({ value, year, monthIndex: i }))
      .filter((p) => p.value);

    return [...acc, ...validPoints];
  }, []);

  return { monthes, dataPoints };
};
