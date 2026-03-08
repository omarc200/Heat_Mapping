require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Fullscreen"
], function (Map, SceneView, SceneLayer, BasemapToggle, Fullscreen) {

  // ---- 3D Buildings layer (hidden by default) ----
  const buildingsLayer = new SceneLayer({
    portalItem: {
      id: "ca0470dbbddb4db28bad74ed39949e25"   // OpenStreetMap 3D Buildings
    },
    visible: false,
    title: "3D Buildings"
  });

  const map = new Map({
    basemap: "topo-vector",
    ground: "world-elevation",
    layers: [buildingsLayer]
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

  // ---- Track whether we are in 3D mode ----
  let is3D = false;

  // Store the basemap that was active before entering 3D mode
  // so we can restore it when returning to 2D
  let basemapBefore3D = null;

  // ---- Create the 2D/3D toggle button ----
  const toggleBtn = document.createElement("div");
  toggleBtn.id = "toggle-3d-btn";
  toggleBtn.title = "Switch to 3D view";
  toggleBtn.innerHTML = "3D";

  toggleBtn.addEventListener("click", function () {
    // Get the center of the current view (the point on the ground you're looking at)
    const viewCenter = view.center;

    if (!is3D) {
      // ---- Switch to 3D ----
      buildingsLayer.visible = true;

      // Remember current basemap and switch to light gray for shadow viewing
      basemapBefore3D = map.basemap;
      map.basemap = "gray-vector";

      // Animate camera: keep the same ground target, just tilt
      view.goTo(
        {
          target: viewCenter,
          tilt: 60
        },
        { duration: 1500 }
      );

      toggleBtn.innerHTML = "2D";
      toggleBtn.title = "Switch to 2D view";
      is3D = true;

    } else {
      // ---- Switch back to 2D ----

      // Animate camera back to top-down, keeping the same ground target
      view.goTo(
        {
          target: viewCenter,
          tilt: 0,
          heading: 0
        },
        { duration: 1500 }
      ).then(function () {
        // Hide buildings and restore previous basemap after animation completes
        buildingsLayer.visible = false;
        if (basemapBefore3D) {
          map.basemap = basemapBefore3D;
        }
      });

      toggleBtn.innerHTML = "3D";
      toggleBtn.title = "Switch to 3D view";
      is3D = false;
    }
  });

  // Add the toggle button to the map UI
  view.ui.add(toggleBtn, "top-left");

  // ---- Basemap toggle (topo-vector / satellite) ----
  const basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite"
  });
  view.ui.add(basemapToggle, "bottom-right");

  // ---- Fullscreen button ----
  const fullscreen = new Fullscreen({
    view: view
  });
  view.ui.add(fullscreen, "top-left");

});
