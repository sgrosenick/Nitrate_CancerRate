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
var gridInWI = {};

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

//function canrate_hexColor(c) {
//    return c < 0.02 ? '#eff4ff' :
//           c < 0.04 ? '#c6dbef' :
//           c < 0.06 ? '#9ecae1' :
//           c < 0.1 ? '#6baed6' :
//           c < 0.14 ? '#3182bd' :
//           c < 0.2 ? '#08519c' :
//                      '#fff';
// }

function canrate_hexColor(c) {
    return c < 0.08 ? '#eff4ff' :
           c < 0.09 ? '#c6dbef' :
           c < 0.10 ? '#9ecae1' :
           c < 0.11 ? '#6baed6' :
           c < 0.12 ? '#3182bd' :
           c < 0.14 ? '#08519c' :
                      '#fff';
 }

function styled(feature) {
    return {
        fillColor: hexColor(feature.properties.nitr_ran),
        weight: 0.5,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
    };
}

function canrate_style(feature) {
    return {
        fillColor: canrate_hexColor(feature.properties.canrate),
        weight: 0.5,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
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

var nitratePoints = L.geoJSON(well_nitrate, {
    pointToLayer: createCircleMarker,
    onEachFeature: function(feature, layer) {
        layer.bindPopup("Nitrate: " + Number((feature.properties.nitr_ran).toFixed(2)) + " ppm")
    }
}).addTo(mymap);

//var wiscBound = L.geoJSON(wiCounties).addTo(mymap);

//interpolate the nitrate data
var options = {gridType: 'hex', property: 'nitr_ran', units: 'kilometers'};
//var grid = turf.interpolate(well_nitrate, 5, options);

var canrateOptions = {gridType: 'hex', property: 'canrate', units: 'kilometers'};
var cancerTract_grid = turf.interpolate(cancer_tract_points, 5, canrateOptions);

//var cancerTract_hexGrid = new L.GeoJSON(cancerTract_grid,{
//    onEachFeature: function(feature, layer) {
//        layer.bindPopup("Cancer Rate: " + Number((feature.properties.canrate).toFixed(2)));
//    }
//}).addTo(mymap);

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
    document.getElementById('nitrateCircle').style.display='none';
    document.getElementById('nitrateCircle_label').style.display='none';

    //get q value
    var sliderValue = $('input[id="qVal"]').slider('getValue');
    var grid = turf.interpolate(well_nitrate, sliderValue, options);
    
    var gridToPoint = [];
    
    hexGrid = new L.GeoJSON(grid, {
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Nitrate: " + Number((feature.properties.nitr_ran).toFixed(2)) + " ppm");
            gridToPoint.push(turf.centroid(feature, feature.properties));
        },
        style:styled
        }).addTo(mymap);
//    
//    console.log("gridToPoint Length: " + gridToPoint.length);
    
    
//    turf.featureEach(grid, function(currentFeature, featureIndex) {
//        gridToPoint.push(turf.centroid(currentFeature, currentFeature.properties));
//        console.log("converted polygon");
//    });
     
//    var newTurf = turf.featureEach(gridToPoint, function(currentFeature) {
//        console.log("Nitrate Level: " + currentFeature.properties.nitr_ran);
//        if (turf.booleanContains(wiCounties, currentFeature)) {
//            console.log("Nitrate Level: " + currentFeature.properties.nitr_ran);
//            gridInWI.push(currentFeature);
//        }
//    });
    
    //clear legend
    var cancerRate_legend = document.getElementsByClassName('cancerRate');
    var cancerRate_length = cancerRate_legend.length;
    
    //add legend
    var nitrateLegend = document.getElementsByClassName('nitrate');
    var lengthofNitrate = nitrateLegend.length;
    
    for (var i=0; i<lengthofNitrate; i++) {
        nitrateLegend[i].style.display='block';
    }
    
});

$("#qVal").slider({
    ticks: [1, 2, 3, 4, 5, 6, 7, 8],
    ticks_labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
    ticks_snap_bounds: 10
});

$("#cancerInterpolate").click(function(){
    nitratePoints.remove();
    if (hexGrid) {
        hexGrid.remove();
    }
    
    if (cancertract_grid) {
        cancertract_grid.remove();
    }
    document.getElementById('nitrateCircle').style.display='none';
    document.getElementById('nitrateCircle_label').style.display='none';
    //hexGrid.remove();
    
    var sliderValue = $('input[id="qVal"]').slider('getValue');
    var cancertract_grid = turf.interpolate(cancer_tract_points, sliderValue, canrateOptions);
    cancertract_hexgrid = new L.GeoJSON(cancertract_grid,{
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Cancer Rate: " + Number((feature.properties.canrate).toFixed(3)));
        },
        style: canrate_style
    }).addTo(mymap);
    
    //clear legend
    var nitrateLegend = document.getElementsByClassName('nitrate');
    var lengthofNitrate = nitrateLegend.length;
    
    for (var i=0; i<lengthofNitrate; i++) {
        nitrateLegend[i].style.display='none';
    }
    
    //add legend    
    var cancerRate_legend = document.getElementsByClassName('cancerRate');
    var cancerRate_length = cancerRate_legend.length;
    
    for (var i=0; i<cancerRate_length; i++) {
        cancerRate_legend[i].style.display='block';
    }
      
});

$('#removeLayers').click(function(){
    if (nitratePoints) {
        nitratePoints.remove();
    }
    
    if (cancertract_hexgrid) {
        cancertract_hexgrid.remove();
    }
    
    if (hexGrid) {
        hexGrid.remove();
    }
});

$('#runFeature').click(function(){
    var features = turf.featureCollection([
        turf.point([26,37], {foo: 'bar'}),
        turf.point([36,53]), {hello: 'world'}
    ]);
    
    var values = [];
    
    turf.featureEach(well_nitrate, function(currentFeature, featureIndex) {
        values.push(currentFeature.properties.nitr_ran);
    });
    
    
});
  

//legend.addTo(mymap);