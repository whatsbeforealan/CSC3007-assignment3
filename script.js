let width = 1000, height = 600;
var json_data;

// api render sgmap
$.ajax({ 
    type: 'GET', 
    url: 'https://chi-loong.github.io/CSC3007/assignments/sgmap.json', 
    dataType: 'json',
    success: function (data) { 
        json_data = data;
    }
})

// api render population csv
$.ajax({ 
  type: 'GET', 
  url: 'https://chi-loong.github.io/CSC3007/assignments/population2021.csv', 
  success: function (data) { 
      csv_data = data;
  }
})

// api render population csv
$.ajax({ 
  type: 'GET', 
  url: 'https://raw.githubusercontent.com/whatsbeforealan/CSC3007-assignment3/main/population2021.csv', 
  success: function (data) { 
      csv = render_csv(csv_data) 
      plot_choropleth(json_data, csv);
  }
})

function population_legend({
    color,
    title,
    width = 320,
    tickSize = 10,
    height = 44,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16,
    marginLeft = 30,
    ticks = width / 64,
    tickFormat,
    tickValues
  } = {}) {

    const svg = d3.select("#legendBar")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("overflow", "visible")

    let x;
    // Data for legend

    x = d3.scaleBand()
      .domain(color.domain())
      .rangeRound([marginLeft, width - marginRight]);
  
    svg.append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);

  
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(title));
  
    return svg.node();
}

function render_csv(csv_data, populate_data){
    dataset = []
    let array =  csv_data.toString().replace("/\n/g", ",").replace("-", '0');
    var chunks = array.split("\n")
    chunks.forEach((chunk, i) => {
      if (i != 0){
        var temp = {};
        temp["subzone"] = chunk.split(",")[0]
        temp["planning"] = chunk.split(",")[1]
        if (chunk.split(",")[2] != "-"){
          temp["count"] = chunk.split(",")[2]
        } else {
          temp["count"] = '0';
        }
        populate_data =  populate_data.toString().replace("/\n/g", ",");
        populate_data = populate_data.split("\n")

        
        populate_data.find((o, i) => {
            if (String(o.Subzone).toUpperCase() == String(chunk.split(",")[0]).toUpperCase()) {
              temp["males"] = Object(data[0][i + 1]).Count
              temp["females"]= Object(data[0][i + 2]).Count
            }
          })

        dataset.push(temp)
      }
    })
    return dataset
}

// fill up color based on the population and apply to plot choropleth
function population_color(zone, csv, scale){
  var ticks = scale.map(d => parseInt(d.value));
  var color = scale.map(d => d.color);

  var csv_map = d3.rollups(csv,  v => d3.sum(v, d => d.count), d => d.subzone);
  var fill = "white";
  
  let obj = csv_map.find((o, i) => {
    if (String(o[0]).toUpperCase() == String(zone).toUpperCase()) {
        if (o[1] == 0){
          fill ="white"
        } else if (o[1] > 0 && o[1] < ticks[0]){
          fill = color[0]
        } else if (o[1] >= ticks[0] && o[1] < ticks[1]){
          fill = color[1]
        } else if (o[1] >= ticks[1] && o[1] < ticks[2]){
          fill = color[2]
        } else if (o[1] >= ticks[2] && o[1] < ticks[3]){
          fill = color[3]
        } else if (o[1] >= ticks[3] && o[1] < ticks[4]){
          fill = color[4]
        } else if (o[1] >= ticks[4] && o[1] < ticks[5]){
          fill = color[5]
        } else if (o[1] >= ticks[5] && o[1] < ticks[6]){
          fill = color[6]
        } else if (o[1] >= ticks[6] && o[1] < ticks[7]){
          fill = color[7]
        } else {
          fill = "black"
        }
    }
  });
  return fill;
}


function plot_choropleth(pos_data, csv_data){
    var data = [{"color":"#E0E9F5","value":8000}, {"color":"#C6DBEE","value":16000}, {"color":"#9DCAE1","value":24000}, {"color":"#6AAFD6","value":32000}, {"color":"#4292C4","value":40000}, {"color":"#2171B3","value":48000}, {"color":"#09519C","value":56000}, {"color":"#093067","value":64000}]
    var xTicks = data.map(d => d.value);
    let svg = d3.select("svg")
                .attr("width", width)
                .attr("height", height);
    

    // Map and projection
    var projection = d3.geoMercator()
                       .center([103.851959, 1.290270])
                       .fitExtent([[20, 20], [980, 580]], pos_data);
    let geopath = d3.geoPath().projection(projection);
    var tooltipDiv = d3.select(".tooltip")

    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(pos_data.features)
        .enter()
        .append("path")
        .attr("d",  d => geopath(d))
        .attr("fill", function (d) {var color = String(population_color(d.properties["Field_1"], csv_data, data))
                                     return color})
        .on("mouseover", function (event, d) {
          tooltipDiv.transition()
          .duration(200)
          .style("opacity", .9);
          tooltipDiv.html(d.properties.Name)
          .style("left", (event.pageX) + "px")     
          .style("top", (event.pageY) + "px");    
        })                              
        .on("mouseout", function(d) {       
            tooltipDiv.transition()        
                      .duration(500)      
                      .style("opacity", 0);   
        })
        .on("click", function(d, data) {
          $('label.active input').prop("id", function(i, gender) {
            csv_data.find((o, i) => {
              if (String(o.subzone).toUpperCase() == String(data.properties.Name).toUpperCase()) {
                if (gender == "male"){
                  d3.select("span").html(data.properties.Name + "<br>" + "Male population: " + o.count)
                } else{
                  d3.select("span").html(data.properties.Name + "<br>" + "Female population: " + o.count)
                }
              }
            })
          });
        })

    // Color Scale based on population 
    var legendElement = population_legend({
        color: d3.scaleThreshold(
            xTicks,
            d3.schemeBlues[9]
        ),
        title: "Population",
        tickSize: 0,
        width: 300, 
        height: 50
    });
}
