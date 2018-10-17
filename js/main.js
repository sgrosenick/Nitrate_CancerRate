//Setup map
var mymap = L.map('map', {
    center: [44.544530, -90.157751],
    zoomSnap: 0.25,
    zoom: 6.75,
    zoomControl: false
});
//move zoom control to the right
L.control.zoom({
    position: 'topright'
}).addTo(mymap);

var osmTile = "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, @ <a href="https://carto.com/">CARTO</a>';
var osmLayer = new L.TileLayer(osmTile, {
    attribution: osmAttrib
}).addTo(mymap);

//Global Variables
var hexGrid = null;
var cancertract_hexgrid = null;
var nitrate_inWI = null;
var grid = [];
var cancertract_grid = [];
var nitrateCentroid = [];
var nitratePoints = null;
var stdev;
var min;
var median;
var max;
var regression_hexgrid = null;

//create symbology for hex grid
function hexColor(c) {
    return c < 0.0 ? '#fef0d9' :
           c < 3.0 ? '#fdd49e' :
           c < 3.3 ? '#fdbb84' :
           c < 3.7 ? '#fc8d59' :
           c < 4.0 ? '#ef6548' :
           c < 4.5 ? '#d7301f' :
           c < 13.0 ? '#990000':
                      '#fff';
}

function canrate_hexColor(c) {
    return c < 0.08 ? '#eff4ff' :
           c < 0.09 ? '#c6dbef' :
           c < 0.10 ? '#9ecae1' :
           c < 0.11 ? '#6baed6' :
           c < 0.12 ? '#3182bd' :
           c < 0.14 ? '#08519c' :
                      '#fff';
 }


function regression_hexColor(c) {
    return c < (median - (stdev*3)) ? "#edf8fb" :
           c < (median - (stdev*2)) ? "#bfd3e6" : 
           c < (median - stdev)     ? "#9ebcda" :
           c < (median + stdev)     ? "#8c96c6" :
           c < (median + (stdev*2)) ? "#8c6bb1" :
           c < (median + (stdev*3)) ? "#88419d" :
                                      "#6e016b";
}


function styled(feature) {
    return {
        fillColor: hexColor(feature.properties.nitr_ran),
        weight: 0.5,
        opacity: 0.8,
        color: 'black',
        fillOpacity: 0.4
    };
}

function canrate_style(feature) {
    return {
        fillColor: canrate_hexColor(feature.properties.canrate),
        weight: 0.5,
        opacity: 0.8,
        color: 'black',
        fillOpacity: 0.4
    };
}

function regression_style(feature) {
    return {
        fillColor: regression_hexColor(feature.properties.residualsquared),
        weight: 0.5,
        opacity: 0.8,
        color: 'black',
        fillOpacity: 0.4
    };
}

function createCircleMarker(feature, latlng) {
    let options = {
        radius: 6,
        fillColor: "blue",
        color: "black",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.6
    }
    return L.circleMarker(latlng,options);
}

nitratePoints = L.geoJSON(well_nitrate, {
    pointToLayer: createCircleMarker,
    onEachFeature: function(feature, layer) {
        layer.bindPopup("Nitrate: " + Number((feature.properties.nitr_ran).toFixed(2)) + " ppm")
    }
}).addTo(mymap);

//interpolate the nitrate data
var options = {gridType: 'hex', property: 'nitr_ran', units: 'kilometers'};


var canrateOptions = {gridType: 'hex', property: 'canrate', units: 'kilometers'};
var cancerTract_grid = turf.interpolate(cancer_tract_points, 5, canrateOptions);

var nitrate = ['0', '3', '3.3', '3.7', '4', '4.5', '<4.5'];

//button functionality
$("#nitrateInterpolate").click(function(){
    //remove nitrate points from map and legend
    if (nitratePoints) {
        nitratePoints.remove();
    }
    if (cancertract_hexgrid) {
        cancertract_hexgrid.remove();
    }
    
    if (hexGrid) {
        hexGrid.remove();
    }
    
    if (regression_hexgrid) {
        regression_hexgrid.remove();
    }
    
    document.getElementById('nitrateCircleTitle').style.display='none';
    document.getElementById('nitrateTitle').style.display='block';
    document.getElementById('nitrateCircle').style.display='none';
    document.getElementById('nitrateCircle_label').style.display='none';

    //get q value
    var sliderValue = $('input[id="qVal"]').slider('getValue');
    grid = turf.interpolate(well_nitrate, sliderValue, options);
    
    var gridToPoint = [];
    
    hexGrid = new L.GeoJSON(grid, {
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Nitrate: " + Number((feature.properties.nitr_ran).toFixed(2)) + " ppm");
            gridToPoint.push(turf.centroid(feature, feature.properties));
        },
        style:styled
        }).addTo(mymap);

    //clear legend
    var cancerRate_legend = document.getElementsByClassName('cancerRate');
    var cancerRate_length = cancerRate_legend.length;
    
    document.getElementById("cancerInterpolate").disabled=false;
    document.getElementById("cancerRate_instruct").style.display='block';
    document.getElementById("nitrate_instruct").style.display='none';
    document.getElementById("nitrateInterpolate").disabled=true;
    document.getElementById("reset").style.display='inline-block';
    
    //add legend
    var nitrateLegend = document.getElementsByClassName('nitrate');
    var lengthofNitrate = nitrateLegend.length;
    
    for (var i=0; i<lengthofNitrate; i++) {
        nitrateLegend[i].style.display='block';
    }
    
});

$("#qVal").slider({
    ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ticks_labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    ticks_snap_bounds: 10
});

$("#cancerInterpolate").click(function(){
    nitratePoints.remove();
    if (hexGrid) {
        hexGrid.remove();
    }
    
    if (cancertract_hexgrid) {
        cancertract_hexgrid.remove();
    }
    
    if (regression_hexgrid) {
        regression_hexgrid.remove();
    }
    var sliderValue = $('input[id="qVal"]').slider('getValue');
    var sliderVal_string = sliderValue.toString();
    // update legend
    document.getElementById('nitrateTitle').style.display='none';
    document.getElementById('cancerRateTitle').textContent='Cancer Rate Per ' + sliderVal_string + ' km';
    document.getElementById('cancerRateTitle').style.display='block';
    document.getElementById('nitrateCircle').style.display='none';
    document.getElementById('nitrateCircle_label').style.display='none';
    //hexGrid.remove();
    
    cancertract_grid = turf.interpolate(cancer_tract_points, sliderValue, canrateOptions);
    cancertract_hexgrid = new L.GeoJSON(cancertract_grid,{
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Cancer Rate: " + Number((feature.properties.canrate).toFixed(3)));
        },
        style: canrate_style
    }).addTo(mymap);
    
    var cancerRate_num =[];
    
    turf.featureEach(cancertract_grid, function(currentFeautre, featureIndex) {
        cancerRate_num.push(currentFeautre.properties.canrate);
    });
    
    var canrate_min = math.min(cancerRate_num);
    var canrate_std = math.std(cancerRate_num);
    var canrate_median = math.median(cancerRate_num);
    var canrate_max = math.max(cancerRate_num);
    
    console.log("Cancer Rate Min: " + canrate_min);
    console.log("Cancer Rate Standard Deviation: " + canrate_std);
    console.log("Cancer Rate Median: " + canrate_median);
    console.log("Cancer Rate Max: " + canrate_max);
    
    //clear legend
    var nitrateLegend = document.getElementsByClassName('nitrate');
    var lengthofNitrate = nitrateLegend.length;
    
    for (var i=0; i<lengthofNitrate; i++) {
        nitrateLegend[i].style.display='none';
    }
    
    var regressionLegend = document.getElementsByClassName('regression');
    var regressionLegend_length = regressionLegend.length;
    
    for (var i=0; i<regressionLegend_length; i++) {
        regressionLegend[i].style.display='none';
    }
    
    document.getElementById("cancerInterpolate").disabled=true;
    document.getElementById("cancerRate_instruct").style.display='none';
    document.getElementById("regression_instruct").style.display='block';
    document.getElementById("runFeature").disabled=false;
    document.getElementById("reset").style.display='inline-block';
    
    //add legend    
    var cancerRate_legend = document.getElementsByClassName('cancerRate');
    var cancerRate_length = cancerRate_legend.length;
    
    for (var i=0; i<cancerRate_length; i++) {
        cancerRate_legend[i].style.display='block';
    }
      
});

$('#runFeature').click(function(){
    
    //remove any layers
     if (nitratePoints) {
        nitratePoints.remove();
    }
    
    if (cancertract_hexgrid) {
        cancertract_hexgrid.remove();
    }
    
    if (hexGrid) {
        hexGrid.remove();
    }
    
    turf.featureEach(grid, function(currentFeature, featureIndex) {
        var nitrate_ToPoint = turf.centroid(currentFeature, currentFeature.properties);
        nitrateCentroid.push(nitrate_ToPoint);
    });
    
    // Convert list of centroids into GeoJSON feature
    var nitrateCollection = turf.featureCollection(nitrateCentroid);
    
    // Add nitrate values to cancer rate layer
    var collected = turf.collect(cancertract_grid, nitrateCollection, 'nitr_ran', 'values');
    
    // list to hold any undefined numbers
    var undefinedList = [];
    // list to hold all others to be considered for regres
    var cleanList = [];
    
    turf.featureEach(collected, function(currentFeature, featureIndex) {
        if (currentFeature.properties.values[0] == undefined || currentFeature.properties.canrate == undefined) {
            undefinedList.push([currentFeature.properties.canrate, currentFeature.properties.values[0]]);
        } else {
            cleanList.push([currentFeature.properties.canrate, currentFeature.properties.values[0]]);
        }
    });
    
    // run regression using Simple Statistics
    var linearReg = ss.linearRegression(cleanList);
    var linearRegResidual = ss.linearRegressionLine(linearReg);
    
    // create list of residuals squared for use in creating classes
    var residualSquared = [];
    
    turf.featureEach(collected, function(currentFeature, featureIndex) {
        //set up predicted values
        currentFeature.properties.predicted = linearRegResidual(currentFeature.properties.canrate);
        //get residuals, then square for analysis
        currentFeature.properties.residual = Math.abs(currentFeature.properties.canrate - currentFeature.properties.predicted);
        currentFeature.properties.residualsquared = currentFeature.properties.residual * currentFeature.properties.residual;
        residualSquared.push(currentFeature.properties.residualsquared);
    });
    
    // compute standard deviations, median, minimum, and max for creating classes
    stdev = math.std(residualSquared);
    var twoStdev = stdev*2;
    median = math.median(residualSquared);
    min = math.min(residualSquared);
    max = math.max(residualSquared);
    
    console.log("Median - Standard Deviation x3: " + (median - (stdev*3)));
    console.log("Median - Two standard Deviations: " + (median - twoStdev));
    console.log("Median - Standard Deviation: " + (median - stdev));
    console.log("Median: " + median);
    console.log("Median + Standard Deviation: " + (median + stdev));
    console.log("Median + two Standard Devs: " + (median + twoStdev));
    console.log("Median + Standard Dev x3: " + (median + (stdev*3)));
    console.log("Minimum: " + min + " Maximum: " + max);

    regression_hexgrid = new L.GeoJSON(collected, {
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Residual Squared: " + Number(feature.properties.residualsquared).toFixed(2));
        },
        style: regression_style
    }).addTo(mymap);
    
    // clear legend
    var nitrate_legend = document.getElementsByClassName('nitrate');
    var nitrate_legend_length = nitrate_legend.length;
    
    for (var i=0; i<nitrate_legend_length; i++) {
        nitrate_legend[i].style.display='none';
    }
    
    var canrate_legend = document.getElementsByClassName('cancerRate');
    var canrate_legend_length = canrate_legend.length;
    
    for (var i=0; i<canrate_legend_length; i++) {
        canrate_legend[i].style.display='none';
    }
    
    document.getElementById('cancerRateTitle').style.display='none';
    document.getElementById('regressionTitle').style.display='block';
    document.getElementById("regression_instruct").style.display='block';
    document.getElementById("runFeature").disabled=true;
    document.getElementById("reset").style.display='inline-block';
    
    // update legend
    var regression_legend = document.getElementsByClassName('regression');
    var regression_leg_length = regression_legend.length;
    
    for (var i=0; i<regression_leg_length; i++) {
        regression_legend[i].style.display='block';
    }
});

$('#reset').click(function() {
    // reset layers
    if (hexGrid) {
        hexGrid.remove();
    }
    
    if (cancertract_hexgrid) {
        cancertract_hexgrid.remove();
    }
    
    if(regression_hexgrid) {
        regression_hexgrid.remove();
    }
    
    // remove legend layers
    var nitrate_legend = document.getElementsByClassName('nitrate');
    var nitrate_legend_length = nitrate_legend.length;
    
    for (var i=0; i<nitrate_legend_length; i++) {
        nitrate_legend[i].style.display='none';
    }
    
    var canrate_legend = document.getElementsByClassName('cancerRate');
    var canrate_legend_length = canrate_legend.length;
    
    for (var i=0; i<canrate_legend_length; i++) {
        canrate_legend[i].style.display='none';
    }
    
    var regression_legend = document.getElementsByClassName('regression');
    var regression_leg_length = regression_legend.length;
    
    for (var i=0; i<regression_leg_length; i++) {
        regression_legend[i].style.display='none';
    }
    
    
    // add nitrate points back to map
    nitratePoints = L.geoJSON(well_nitrate, {
        pointToLayer: createCircleMarker,
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Nitrate: " + Number((feature.properties.nitr_ran).toFixed(2)) + " ppm")
        }
    }).addTo(mymap);
    
    document.getElementById('nitrateCircleTitle').style.display='block';
    document.getElementById('nitrateCircle').style.display='block';
    document.getElementById('nitrateCircle_label').style.display='block';
    
    //reset buttons and instructions
    document.getElementById("nitrateTitle").style.display='none';
    document.getElementById("cancerRateTitle").style.display='none';
    document.getElementById("regressionTitle").style.display='none';
    document.getElementById("nitrate_instruct").style.display='block';
    document.getElementById("nitrateInterpolate").disabled=false;
    document.getElementById("cancerRate_instruct").style.display='none';
    document.getElementById("cancerInterpolate").disabled=true;
    document.getElementById("regression_instruct").style.display='none';
    document.getElementById("runFeature").disabled=true;
    document.getElementById("reset").style.display='none';
    
});
