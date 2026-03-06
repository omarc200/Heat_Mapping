require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Fullscreen"
], function (Map, SceneView, BasemapGallery, Fullscreen) {

  const map = new Map({
    basemap: "topo-vector"
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,

    // Center on NYC
    camera: {
      position: {
        longitude: -74.006,
        latitude: 40.7128,
        z: 45000
      },
      tilt: 0,
      heading: 0
    }
  });

  // ---- Basemap gallery ----
  const basemapGallery = new BasemapGallery({
    view: view
  });
  view.ui.add(basemapGallery, "top-right");

  // ---- Fullscreen button ----
  const fullscreen = new Fullscreen({
    view: view
  });
  view.ui.add(fullscreen, "top-left");

});
