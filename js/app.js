require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/Home",
  "esri/widgets/Fullscreen",
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/GeoJSONLayer"
], function (Map, SceneView, Home, Fullscreen, SceneLayer, FeatureLayer, BasemapToggle, GeoJSONLayer) {

  // ==========================================================================
  // LAYER DEFINITIONS
  // ==========================================================================
  // Layers are organized by draw order: polygon layers first (drawn on bottom),
  // then point layers (drawn on top) so points remain visible and clickable.
  // When you add a new layer, you should:
  //   1. Define the layer variable here in the correct section
  //   2. Add it to the map.layers array below in the correct draw order position
  //   3. Replace the null in layerRegistry with the layer variable

  // ---- Polygon layers (bottom of draw order) ----

  // Heat Vulnerability Index — placeholder
   const hviLayer = new FeatureLayer({ 
    url: "https://services2.arcgis.com/IsDCghZ73NgoYoz5/arcgis/rest/services/HVIbyCommunityDistrict_ForWeb/FeatureServer/0",
    visible: false,
    title: "Heat Vulnerability Index",
    opacity: 0.7
 });

  // Drinking Fountain walking distance buffer — placeholder (will be a client-side GraphicsLayer)
  // const fountainBufferLayer = new GraphicsLayer({ visible: false, title: "Walking Distance from Fountains" });

  // Tree Canopy Cover — placeholder
  // const treeCanopyLayer = new FeatureLayer({ url: "...", visible: false, title: "Tree Canopy Cover" });

  // Beaches — placeholder
  // const beachesLayer = new FeatureLayer({ url: "...", visible: false, title: "Beaches" });

  // Building Footprints — LIVE
  const buildingFootprintsLayer = new FeatureLayer({
    url: "https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/BUILDING_view/FeatureServer/0",
    visible: false,
    title: "Building Footprints",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [200, 200, 200, 0.5],
        outline: {
          color: [140, 140, 140, 0.6],
          width: 0.5
        }
      }
    },
    // Only load when zoomed in enough to avoid performance issues at citywide scale
    minScale: 50000
  });

  // ---- Point layers (top of draw order) ----

  // Drinking Fountains — placeholder
  // const fountainsLayer = new FeatureLayer({ url: "...", visible: false, title: "Drinking Fountains" });

  // Cooling Sites — placeholder
  // const coolingSitesLayer = new FeatureLayer({ url: "...", visible: false, title: "Cooling Sites" });

  // Spray Showers — placeholder
  // const sprayShowersLayer = new FeatureLayer({ url: "...", visible: false, title: "Spray Showers" });

  // Pools — placeholder
 // Pools source data (polygon GeoJSON)
const poolsLayer = new GeoJSONLayer({
  url: "assets/pools_points.geojson",
  visible: false,
  title: "Pools",
  renderer:{
    type: "simple",
    symbol: {
        type:"simple-marker",
        style: "circle",
        color:[0,150,255,0.9],
        size:14,
        outline: {
            color: [255,255,255,1],
            width:1.5
        }
    }
  }
});

  // Indoor Cooling Centers — placeholder
  // const coolingCentersLayer = new FeatureLayer({ url: "...", visible: false, title: "Indoor Cooling Centers" });

  // 3D Buildings (only visible in 3D mode, not in layer panel)
  const open3DBuildings = new SceneLayer({
    portalItem: {
      id: "c444b24b184c4523a5dc96248bfea4e1"
    },
    visible: false
  });

  // ==========================================================================
  // MAP AND VIEW
  // ==========================================================================

  const map = new Map({
    basemap: "gray-vector",
    ground: "world-elevation",
    layers: [
      // --- Polygon layers (bottom of draw order) ---
      hviLayer,
      // fountainBufferLayer,
      // treeCanopyLayer,
      // beachesLayer,
      buildingFootprintsLayer,

      // --- Point layers (top of draw order) ---
      // fountainsLayer,
      // coolingSitesLayer,
      // sprayShowersLayer,
       poolsLayer,
      // coolingCentersLayer,

      // 3D buildings (toggled separately via 2D/3D button)
      open3DBuildings
    ]
  });

  const view = new SceneView({
    container: "viewDiv",
    map: map,
    center: [-74.006, 40.7128],
    zoom: 12,
    tilt: 0
  });

  // ==========================================================================
  // LAYER CONTROL PANEL (collapsible, inside map UI)
  // ==========================================================================

  // Layer registry: connects each checkbox ID to its layer object.
  // When you add a real layer, replace null with the layer variable.
  var layerRegistry = {
    "hvi":                 hviLayer,
    "hvi-high":            hviLayer,   // This will be a filter on hviLayer, not a separate layer
    "fountains":           null,
    "fountain-buffer":     null,
    "cooling-sites":       null,
    "spray-showers":       null,
    "pools":               poolsLayer,
    "beaches":             null,
    "cooling-centers":     null,
    "tree-canopy":         null,
    "building-footprints": buildingFootprintsLayer
  };

  // Define the layer list items for the panel
  var layerItems = [
    { id: "hvi",                label: "Heat Vulnerability Index",           indent: false },
    { id: "hvi-high",           label: "High Heat Risk Areas (HVI 4 or 5)", indent: true  },
    { id: "fountains",          label: "Drinking Fountains",                indent: false },
    { id: "fountain-buffer",    label: "Walking Distance from Fountains",   indent: true  },
    { id: "cooling-sites",      label: "Cooling Sites",                     indent: false },
    { id: "spray-showers",      label: "Spray Showers",                     indent: false },
    { id: "pools",              label: "Pools",                             indent: false },
    { id: "beaches",            label: "Beaches",                           indent: false },
    { id: "cooling-centers",    label: "Indoor Cooling Centers",            indent: false },
    { id: "tree-canopy",        label: "Tree Canopy Cover",                 indent: false },
    { id: "building-footprints", label: "Building Footprints",              indent: false }
  ];

  // Build the panel container
  var panelContainer = document.createElement("div");
  panelContainer.id = "layer-panel";
  panelContainer.classList.add("layer-panel-collapsed");

  // Toggle button to open/close the panel
  var panelToggleBtn = document.createElement("div");
  panelToggleBtn.id = "layer-panel-toggle";
  panelToggleBtn.title = "Toggle layer panel";
  panelToggleBtn.innerHTML = "&#9776; Layers";

  // Panel content area (the checkbox list)
  var panelContent = document.createElement("div");
  panelContent.id = "layer-panel-content";

  // Build a checkbox row for each layer
  layerItems.forEach(function (item) {
    var row = document.createElement("label");
    row.className = "layer-row" + (item.indent ? " layer-indent" : "");

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "layer-checkbox";
    checkbox.dataset.layerId = item.id;

    checkbox.addEventListener("change", function () {
      var layer = layerRegistry[item.id];
      if (layer) {
        layer.visible = checkbox.checked;
      }
      // Special case: "hvi-high" will apply/remove a definition expression
      // on hviLayer rather than toggling a separate layer. Example:
      // if (item.id === "hvi-high" && layerRegistry["hvi"]) {
      //   layerRegistry["hvi"].definitionExpression = checkbox.checked ? "HVI >= 4" : null;
      // }
      // MAIN HVI TOGGLE
      if (item.id === 'hvi'){
        if (layer){
            layer.visible = checkbox.checked;

            if(!checkbox.checked){
                layer.definitionExpression = null;
            }
        }
        return;
      }

      // HVI HIGH FILTER (4 and 5)
      if (item.id === "hvi-high"){
        var hviLayer = layerRegistry["hvi"];
        if(checkbox.checked){

            // show only high risk areas
            hviLayer.definitionExpression = "HVI >= 4";
        } else {
            // remove filter
            hviLayer.definitionExpression = null;
        }
        return;
      }
      // Normal layer toggle
      if(layer) {
        layer.visible = checkbox.checked;
      }
    });

    var labelText = document.createTextNode(" " + item.label);

    row.appendChild(checkbox);
    row.appendChild(labelText);
    panelContent.appendChild(row);
  });

  // Wire up the toggle button to expand/collapse
  var panelOpen = false;
  panelToggleBtn.addEventListener("click", function () {
    panelOpen = !panelOpen;
    if (panelOpen) {
      panelContainer.classList.remove("layer-panel-collapsed");
      panelContainer.classList.add("layer-panel-expanded");
    } else {
      panelContainer.classList.remove("layer-panel-expanded");
      panelContainer.classList.add("layer-panel-collapsed");
    }
  });

  panelContainer.appendChild(panelToggleBtn);
  panelContainer.appendChild(panelContent);

  // Add the layer panel to the map UI
  view.ui.add(panelContainer, "top-right");

  // ==========================================================================
  // WIDGETS
  // ==========================================================================

  var home = new Home({ view: view });
  view.ui.add(home, "top-left");

  var fullscreen = new Fullscreen({ view: view });
  view.ui.add(fullscreen, "top-right");

  var basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite"
  });
  view.ui.add(basemapToggle, "bottom-right");

  // ==========================================================================
  // 2D / 3D TOGGLE
  // ==========================================================================

  var is3DMode = false;
  var toggleButton = document.getElementById("toggle3D");

  toggleButton.addEventListener("click", function () {
    is3DMode = !is3DMode;

    var viewCenter = view.center;

    if (is3DMode) {
      open3DBuildings.visible = true;
      toggleButton.textContent = "Switch to 2D";

      view.goTo(
        { target: viewCenter, tilt: 60, heading: 30 },
        { duration: 1500 }
      );
    } else {
      open3DBuildings.visible = false;
      toggleButton.textContent = "Switch to 3D";

      view.goTo(
        { target: viewCenter, tilt: 0, heading: 0 },
        { duration: 1500 }
      );
    }
  });
  
      
});

