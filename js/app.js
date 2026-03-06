// require is part of the ArcGIS modules
require([
// MapView is 2D; SceneView is 3D
  "esri/Map",
  "esri/views/SceneView" 
], function(Map, SceneView) {

  const map = new Map({
    basemap: "streets-vector"
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,
    center: [-74.0060, 40.7128],
    zoom: 12,
    tilt: 0 // This is how we changee perspective
  });

});