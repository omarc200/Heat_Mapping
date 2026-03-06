// require is part of the ArcGIS modules
require([
// MapView is 2D; SceneView is 3D
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/widgets/Fullscreen"
], function(Map, SceneView, Home, ScaleBar, Fullscreen) {

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

const home = new Home({
    view: view
  });

  view.ui.add(home, "top-left")

// Issue rendering   
const scaleBar = new ScaleBar({
    view: view,
    unit: "dual"
  });

  view.ui.add(scaleBar, "bottom-left");

  const fullscreen = new Fullscreen({
    view: view
  });

  view.ui.add(fullscreen, "top-right");

const basemapSelect = document.getElementById("basemapSelect");

  basemapSelect.addEventListener("change", function() {
    map.basemap = basemapSelect.value;
  });
});