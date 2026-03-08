// require is part of the ArcGIS modules
require([
// MapView is 2D; SceneView is 3D
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/widgets/Fullscreen",
  "esri/layers/SceneLayer",
  "esri/widgets/BasemapToggle"
], function(Map, SceneView, Home, ScaleBar, Fullscreen, SceneLayer, BasemapToggle) {

  const map = new Map({
    basemap: "streets-vector"
  });
// Creates 3D layer esri recomends portal item instead of URL we can test later
  const open3DBuildings = new SceneLayer({
    portalItem: {
        id: "c444b24b184c4523a5dc96248bfea4e1"
    },
    visible: false
  });

  map.add(open3DBuildings);

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

const basemapToggle = new BasemapToggle({
  view: view,
  nextBasemap: "satellite"
});

view.ui.add(basemapToggle, "bottom-right");

const basemapSelect = document.getElementById("basemapSelect");

  basemapSelect.addEventListener("change", function() {
    map.basemap = basemapSelect.value;
  });
  
let is3DMode = false;

const toggleButton = document.getElementById("toggle3D");

toggleButton.addEventListener("click", function(){
    is3DMode = !is3DMode;

    const currentCenter = view.center.clone();
    const currentScale = view.scale;

    if(is3DMode){
        open3DBuildings.visible = true;
        toggleButton.textContent = "Switch to 2D";

        view.goTo({
            center: currentCenter,
            scale: currentScale,
            tilt:60,
            heading:30

        }, {
            duration: 1500
        });
    } else {
        open3DBuildings.visible = false;
        toggleButton.textContent = "Switch to 3D";

        view.goTo({
            center: currentCenter,
            scale: currentScale,
            tilt: 0,
            heading: 0
        },{
            duration: 1500
        });
    }
});

});
