function getData() {
  const readUSAStatesPromise = new Promise((resolve, reject) => {
    d3.json("./us_states_data.json")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readPopulationData = new Promise((resolve, reject) => {
    d3.csv("./us_population_by_state_2019.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readUSACapitalsData = new Promise((resolve, reject) => {
    d3.csv("./us_state_capitals.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readUSAbirthData = new Promise((resolve, reject) => {
    d3.csv("./us_birth_rate.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readUSARainFallData = new Promise((resolve, reject) => {
    d3.csv("./us_rain_data.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  Promise.all([
    readUSAStatesPromise,
    readPopulationData,
    readUSACapitalsData,
    readUSAbirthData,
    readUSARainFallData,
  ]).then((values) => {
    drawUSAMap(values[0], values[1], values[2], values[3], values[4]);
  });
}

getData();

// Demonstrates the d3 map infrastructure for plotting maps given
// in GeoJSON format

// Read the North Carolina map JSON
function drawUSAMap(
  StatesData,
  populationData,
  capitalsData,
  birthData,
  rainfallData
) {
  // set up the projection and its mapping to the display
  let projection = d3.geoEquirectangular();
  projection.fitSize([1200, 1200], StatesData);

  // create a SVG path generator
  let generator = d3.geoPath().projection(projection);

  dataMapper = {
    USPopulation: populationData,
    USBirthRate: birthData,
    USRainFall: rainfallData,
  };

  cellMapper = {
    "USPopulation": "population",
    "USBirthRate": "birthRate",
    "USRainFall": "inches",
  };
  const displayData = document.getElementById("datasetSelect").value;

  let extent = d3.extent(
    dataMapper[displayData].map((item) => Number(item[cellMapper[displayData]]))
  );

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([Number(extent[0]), Number(extent[1])]);

  // create svg symbol, set offset for the plot
  let svg = d3.select("svg").attr("transform", "translate(0, 0)");

  // put it in a group
  let plot = svg.append("g").attr("transform", "translate(0,0)");

  // Add the paths to the plot. The features key can hold multiple path data
  // which is iterated through in the following code
  // The generator reads the needed geometry for the whole state, which
  // is a set of polygons - see the data file and its structure.
  plot
    .selectAll("paths")
    .data(StatesData.features)
    .enter()
    .append("path")
    .attr("d", generator)
    .attr("stroke", "red")
    .attr("fill", function (d) {
      var p = dataMapper[displayData].find(
        (item) => item.area === d.properties.NAME
      );
      return p ? colorScale(p[cellMapper[displayData]]) : "#ccc";
    })
    .attr("stroke-width", 2);


  capitalsData.forEach((element) => {
    let v = projection([element.longitude, element.latitude]);
    plot
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#ff00ff")
      .attr("cx", v[0])
      .attr("cy", v[1])
      .on("click", (event) => displayCapitalName(event, element, v, plot));
  });


  let svg2 = d3.select("#svg2").attr("transform", "translate(0, 0)");

  // put it in a group
  let plot2 = svg2.append("g").attr("transform", "translate(0,0)");

  plot2
    .selectAll("paths")
    .data(StatesData.features)
    .enter()
    .append("path")
    .attr("d", generator)
    .attr("stroke", "red")
    .attr("fill",function (d) {
      var p = dataMapper["USPopulation"].find(
        (item) => item.area === d.properties.NAME
      );
      return p ? colorScale(p[cellMapper["USPopulation"]]) : "#ccc";
    })
    .attr("stroke-width", 2);
    
    var linearScale = d3.scaleLinear()
    .domain(d3.extent(birthData.map((item) => Number(item.birthRate))))
    .range([0, 18]);
  
    const colorScale2 = d3
    .scaleSequential(d3.interpolateGreens)
    .domain(d3.extent(birthData.map((item) => Number(item.birthRate))));
  
    capitalsData.forEach((element) => {
      let v = projection([element.longitude, element.latitude]);
      plot2
        .append("circle")
        .attr("r", function (d) {
          var p = birthData.find(
            (item) => item.area === element.name
          );
          return p ? linearScale(p["birthRate"]) : "#ccc";
        })
        .attr("fill", function (d) {
          var p = dataMapper["USBirthRate"].find(
            (item) => item.area === element.name
          );
          return p ? colorScale2(p[cellMapper["USBirthRate"]]) : "#ccc";
        })
        .attr("cx", v[0])
        .attr("cy", v[1])
        .on("click", (event) => displayCapitalName(event, element, v, plot2));
    });
}

function displayCapitalName(event, capitalData, projectionValue, plot) {
  plot
    .append("text")
    .attr("x", projectionValue[0] + 8)
    .attr("y", projectionValue[1] + 8)
    .attr("font-size", 24)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .text(capitalData.description);
}
