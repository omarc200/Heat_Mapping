require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/Home",
  "esri/widgets/Fullscreen",
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/GeoJSONLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/geometryEngineAsync"
], function (Map, SceneView, Home, Fullscreen, SceneLayer, FeatureLayer, BasemapToggle, GeoJSONLayer, GraphicsLayer, Graphic, geometryEngineAsync) {

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

  // Tree Canopy Cover — LIVE
  const treeCanopyLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/xJHn8F2NTtwCMFtX/ArcGIS/rest/services/TreeCanopy2017_Simplified_1ft/FeatureServer/0",
    visible: false,
    title: "Tree Canopy Cover",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [0, 100, 0, 0.75],
        outline: {
          color: [0, 80, 0, 0.75],
          width: 0.5
        }
      }
    },
    // Only load when zoomed in enough to avoid performance issues at citywide scale
    minScale: 25000
  });

  // Beaches — local GeoJSON point data
  const beachesLayer = new GeoJSONLayer({
    url: "assets/beaches_points.geojson",
    visible: false,
    title: "Beaches",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [0, 150, 255, 0.9],
        size: 14,
        outline: { color: [255, 255, 255, 1], width: 1.5 }
      }
    }
  });

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
    minScale: 25000
  });

  // ---- Point layers (top of draw order) ----

  // Drinking Fountains — LIVE
  const fountainsLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/QnAlpI4OtHhbgGN9/arcgis/rest/services/NYC_Parks_Drinking_Fountains_20240129/FeatureServer/0",
    visible: false,
    title: "Drinking Fountains",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-marker",
        color: "#1E90FF",
        size: "9px",
        outline: { color: "#ffffff", width: 1.5 }
      }
    },
    popupTemplate: {
      title: "Drinking Fountain",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "propertyna", label: "Park / Property" },
          { fieldName: "borough",    label: "Borough" },
          { fieldName: "fountainty", label: "Fountain Type" },
          { fieldName: "featuresta", label: "Status" }
        ]
      }]
    }
  });

  // Drinking Fountain ¼-mile dissolved buffer — LIVE (client-side, populated after view loads)
  const fountainBufferLayer = new GraphicsLayer({
    visible: false,
    title: "Walking Distance from Fountains"
  });

  // Cooling Sites (Cool It!) — LIVE
  const coolingSitesLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/ZpsvDOsGv97WuKRh/arcgis/rest/services/Cool_it_Cooling_Sites/FeatureServer/0",
    visible: false,
    title: "Cooling Sites",
    renderer: {
      type: "unique-value",
      field: "featuretype",
      uniqueValueInfos: [
        {
          value: "Misting Station",
          label: "Misting Station",
          symbol: { type: "simple-marker", color: "#00CED1", size: "10px", outline: { color: "#fff", width: 1 } }
        },
        {
          value: "Hydrant Spray Cap",
          label: "Hydrant Spray Cap",
          symbol: { type: "simple-marker", color: "#20B2AA", size: "10px", outline: { color: "#fff", width: 1 } }
        }
      ],
      defaultSymbol: { type: "simple-marker", color: "#5F9EA0", size: "9px", outline: { color: "#fff", width: 1 } },
      defaultLabel: "Spray Adapter / Other"
    },
    popupTemplate: {
      title: "Cooling Site",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "featuretype",   label: "Type" },
          { fieldName: "propertyname",  label: "Property" },
          { fieldName: "borough",       label: "Borough" },
          { fieldName: "status",        label: "Status" }
        ]
      }]
    }
  });

  // Spray Showers — LIVE
  const sprayShowersLayer = new FeatureLayer({
    url: "https://services6.arcgis.com/yG5s3afENB5iO9fj/ArcGIS/rest/services/Cool_Options/FeatureServer/0",
    visible: false,
    title: "Spray Showers",
    definitionExpression: "Space_type = 'Spray Shower'",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-marker",
        color: "#0078A8", 
        size: "10px",
        outline: { color: "#ffffff", width: 1 }
      }
    },
    popupTemplate: {
      title: "💦 Spray Shower",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "Facility_name", label: "Name" }, 
          { fieldName: "Address", label: "Address" } 
        ]
      }]
    }
  });


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

  // Indoor Cooling Centers — LIVE
  const coolingCentersLayer = new FeatureLayer({
    url: "https://services6.arcgis.com/yG5s3afENB5iO9fj/ArcGIS/rest/services/Cool_Options/FeatureServer/0",
    visible: false,
    title: "Indoor Cooling Centers",
    definitionExpression: "Space_type = 'Cooling Center'", 
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-marker",
        color: "#FF8C00", 
        size: "10px",
        outline: { color: "#ffffff", width: 1 }
      }
    },
    popupTemplate: {
      title: "❄️ Cooling Center",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "Facility_name", label: "Name" }, 
          { fieldName: "Finder_status", label: "Status" } 
        ]
      }]
    }
  });

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
      // Draw order bottom-to-top: HVI, Beaches, Building Footprints, Tree Canopy, Fountain Buffer
      hviLayer,
      beachesLayer,
      buildingFootprintsLayer,
      treeCanopyLayer,
      fountainBufferLayer,

      // --- Point layers (top of draw order) ---
      fountainsLayer,
      coolingSitesLayer,
      sprayShowersLayer,
      coolingCentersLayer,
      poolsLayer,

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

  // Log the current map scale to the browser console whenever zoom changes.
  // Open DevTools (F12 → Console) to see these values while testing.
  // This can be removed once minScale thresholds are finalized.
  view.watch("scale", function (newScale) {
    console.log("Current map scale: " + Math.round(newScale));

    // Disable/enable checkboxes for layers that have a minScale threshold.
    // When the map is zoomed out beyond a layer's minScale, its checkbox
    // and label are greyed out with a tooltip explaining why.
    updateScaleDependentControls(newScale);
  });

  /**
   * Grey out or re-enable layer panel checkboxes based on the current
   * map scale and each layer item's minScale property.
   */
  function updateScaleDependentControls(currentScale) {
    layerItems.forEach(function (item) {
      if (!item.minScale) return; // Only applies to layers with a minScale

      var checkbox = document.querySelector('.layer-checkbox[data-layer-id="' + item.id + '"]');
      if (!checkbox) return;

      var row = checkbox.closest(".layer-row");
      var beyondScale = currentScale > item.minScale;

      checkbox.disabled = beyondScale;

      if (beyondScale) {
        row.classList.add("layer-row-disabled");
        row.title = "Zoom in to enable this layer";
      } else {
        row.classList.remove("layer-row-disabled");
        row.title = "";
      }
    });
  }

  // ==========================================================================
  // LAYER CONTROL PANEL (collapsible, inside map UI)
  // ==========================================================================

  // Layer registry: connects each checkbox ID to its layer object.
  // When you add a real layer, replace null with the layer variable.
  var layerRegistry = {
    "hvi":                 hviLayer,
    "hvi-high":            hviLayer,   // This will be a filter on hviLayer, not a separate layer
    "fountains":           fountainsLayer,
    "fountain-buffer":     fountainBufferLayer,
    "cooling-sites":       coolingSitesLayer,
    "spray-showers":       sprayShowersLayer,
    "pools":               poolsLayer,
    "beaches":             beachesLayer,
    "cooling-centers":     coolingCentersLayer,
    "tree-canopy":         treeCanopyLayer,
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
    { id: "tree-canopy",        label: "Tree Canopy Cover",                 indent: false, minScale: 25000 },
    { id: "building-footprints", label: "Building Footprints",              indent: false, minScale: 25000 }
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
  // DRINKING FOUNTAIN BUFFER GENERATION
  // ==========================================================================
  // Once the view is ready, query all fountain points and generate a single
  // dissolved ¼-mile (402m) geodesic buffer around them.

  view.when(function () {
    fountainsLayer.queryFeatures({
      where: "1=1",
      returnGeometry: true,
      outFields: ["ObjectId"]
    }).then(function (result) {
      var geometries = result.features.map(function (f) { return f.geometry; });
      if (!geometries.length) return;
      return geometryEngineAsync.geodesicBuffer(geometries, 402, "meters", true);
    }).then(function (buffered) {
      if (!buffered) return;
      var geom = Array.isArray(buffered) ? buffered[0] : buffered;
      fountainBufferLayer.add(new Graphic({
        geometry: geom,
        symbol: {
          type: "simple-fill",
          color: [30, 144, 255, 0.15],
          outline: { color: [30, 100, 220, 0.5], width: 1 }
        }
      }));
    }).catch(function (err) {
      console.error("Fountain buffer generation failed:", err);
    });
  });

  // ==========================================================================
  // SHADOW CAST & DAYLIGHT COMPONENTS
  // ==========================================================================
  // Shadow Cast: destroyed and recreated each time the user toggles it,
  //   because v4.34 provides no reliable way to hide its overlay once rendered.
  // Daylight: persistent component, reused across activations.
  //
  // Both are configured for July 21 — the hottest day of the year on average
  // in NYC per NOAA 1991–2020 climate normals.

  var tools3DPanel = document.getElementById("tools-3d");

  // Shadow Cast is created/destroyed on demand; Daylight is persistent
  var shadowCastEl = null;
  var daylightEl   = null;

  // Track which shadow tool is currently selected
  var activeShadowTool = "none";

  // Track whether Daylight has been initialized (one-time setup)
  var daylightInitialized = false;

  // Track whether the custom elements have been registered
  var componentsRegistered = false;

  // Helper: milliseconds from midnight for a given hour
  function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
  }

  /**
   * Wait for custom elements to register, then initialize the persistent
   * Daylight component. Called once on first 3D activation.
   */
  function initShadowTools(callback) {
    if (daylightInitialized) {
      if (callback) callback();
      return;
    }

    // Wait for custom elements to be registered by the browser
    Promise.all([
      customElements.whenDefined("arcgis-shadow-cast"),
      customElements.whenDefined("arcgis-daylight")
    ]).then(function () {
      componentsRegistered = true;
      console.log("Custom elements registered.");

      // --- Initialize Daylight (persistent, reused across activations) ---
      daylightEl = document.createElement("arcgis-daylight");
      daylightEl.id = "daylightComponent";
      daylightEl.autoDestroyDisabled = true;
      daylightEl.view = view;

      // Append to DOM temporarily for componentOnReady
      daylightEl.style.display = "none";
      document.body.appendChild(daylightEl);

      return daylightEl.componentOnReady();

    }).then(function () {
      // Configure Daylight defaults
      daylightEl.localDate = new Date(2025, 6, 21);
      daylightEl.utcOffset = -4;
      daylightEl.timeSliderPosition = 8 * 60;
      daylightEl.playSpeedMultiplier = 1.5;
      daylightEl.hideTimezone = true;

      // Remove from body until needed
      document.body.removeChild(daylightEl);
      daylightEl.style.display = "";

      daylightInitialized = true;
      console.log("Daylight component initialized.");

      if (callback) callback();

    }).catch(function (err) {
      console.error("Error initializing shadow tools:", err);
    });
  }

  /**
   * Create a fresh Shadow Cast component, connect it to the view,
   * configure it, and add it to the map UI.
   * Returns a promise that resolves when the component is ready.
   */
  function createShadowCast() {
    shadowCastEl = document.createElement("arcgis-shadow-cast");
    shadowCastEl.id = "shadowCastComponent";
    // Do NOT set autoDestroyDisabled — we WANT it to auto-destroy
    // when removed from the DOM, which is how we clear the overlay.

    // Connect to view and add to UI
    shadowCastEl.view = view;
    view.ui.add(shadowCastEl, "top-right");

    // Return the componentOnReady promise so we can configure after
    return shadowCastEl.componentOnReady().then(function () {
      shadowCastEl.date = new Date(2025, 6, 21);
      shadowCastEl.startTimeOfDay = hoursToMs(8);
      shadowCastEl.endTimeOfDay   = hoursToMs(18);
      shadowCastEl.utcOffset = -4;
      shadowCastEl.setAttribute("mode", "total-duration");

      view.environment.lighting.directShadowsEnabled = true;

      console.log("Shadow Cast component created and configured.");
    });
  }

  /**
   * Destroy the current Shadow Cast component to fully clear its overlay.
   */
  function destroyShadowCast() {
    if (shadowCastEl) {
      // Remove from UI — since autoDestroyDisabled is false (default),
      // removing from DOM triggers the component's destroy() automatically,
      // which should clean up its internal rendering pipeline.
      view.ui.remove(shadowCastEl);

      // Also call destroy explicitly to be thorough
      try {
        shadowCastEl.destroy();
      } catch (e) {
        // May already be destroyed by auto-destroy; that's fine
      }

      shadowCastEl = null;
      console.log("Shadow Cast component destroyed.");
    }
  }

  /**
   * Reset the scene's lighting back to a neutral daytime state.
   */
  function resetSceneLighting() {
    view.environment.lighting = {
      type: "sun",
      date: new Date("July 21, 2025 12:00:00 EDT"),
      directShadowsEnabled: false,
      cameraTrackingEnabled: false
    };
  }

  /**
   * Activate a shadow tool by name ("shadow-cast", "daylight", or "none").
   */
  function activateShadowTool(toolName) {
    activeShadowTool = toolName;

    if (!daylightInitialized || !componentsRegistered) return;

    // --- Cleanup: stop Daylight animation ---
    daylightEl.dayPlaying = false;
    daylightEl.yearPlaying = false;

    // --- Cleanup: destroy Shadow Cast to clear its overlay ---
    destroyShadowCast();

    // --- Cleanup: remove Daylight from UI ---
    view.ui.remove(daylightEl);

    // --- Cleanup: reset lighting ---
    resetSceneLighting();

    // --- Activate the selected tool ---

    if (toolName === "shadow-cast") {
      createShadowCast();

    } else if (toolName === "daylight") {
      // Set up lighting for Daylight
      view.environment.lighting = {
        type: "sun",
        date: new Date("July 21, 2025 08:00:00 EDT"),
        directShadowsEnabled: true,
        cameraTrackingEnabled: false
      };

      // Add Daylight to the map UI
      view.ui.add(daylightEl, "top-right");

      // Re-apply settings each time
      daylightEl.localDate = new Date(2025, 6, 21);
      daylightEl.utcOffset = -4;
      daylightEl.timeSliderPosition = 8 * 60;
      daylightEl.playSpeedMultiplier = 1.5;
      daylightEl.hideTimezone = true;
    }
  }

  /**
   * Deactivate all shadow tools. Called when switching back to 2D mode.
   */
  function deactivateShadowTools() {
    if (!daylightInitialized) return;

    daylightEl.dayPlaying = false;
    daylightEl.yearPlaying = false;

    destroyShadowCast();
    view.ui.remove(daylightEl);
    resetSceneLighting();
  }

  // Listen for radio button changes in the 3D tools panel
  var shadowToolRadios = document.querySelectorAll('input[name="shadow-tool"]');
  shadowToolRadios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (is3DMode && radio.checked) {
        activateShadowTool(radio.value);
      }
    });
  });

  // ==========================================================================
  // 2D / 3D TOGGLE
  // ==========================================================================

  var is3DMode = false;
  var toggleButton = document.getElementById("toggle3D");

  toggleButton.addEventListener("click", function () {
    is3DMode = !is3DMode;

    var viewCenter = view.center;

    if (is3DMode) {
      // Switch to 3D mode
      open3DBuildings.visible = true;
      toggleButton.textContent = "Switch to 2D";

      // Show the 3D tools panel in the sidebar
      tools3DPanel.classList.remove("tools-3d-hidden");
      tools3DPanel.classList.add("tools-3d-visible");

      // Animate camera to 3D perspective
      view.goTo(
        { target: viewCenter, tilt: 60, heading: 30 },
        { duration: 1500 }
      ).then(function () {
        // Initialize shadow tools on first use, then activate the selected one.
        // initShadowTools calls componentOnReady() which may take a moment
        // on the first call; on subsequent calls it returns immediately.
        initShadowTools(function () {
          activateShadowTool(activeShadowTool);
        });
      });

    } else {
      // Switch to 2D mode
      open3DBuildings.visible = false;
      toggleButton.textContent = "Switch to 3D";

      // Hide the 3D tools panel in the sidebar
      tools3DPanel.classList.remove("tools-3d-visible");
      tools3DPanel.classList.add("tools-3d-hidden");

      // Deactivate all shadow tools
      deactivateShadowTools();

      // Animate camera back to top-down
      view.goTo(
        { target: viewCenter, tilt: 0, heading: 0 },
        { duration: 1500 }
      );
    }
  });
  
      
});

