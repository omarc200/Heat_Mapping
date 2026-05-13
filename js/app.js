require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/widgets/Fullscreen",
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/GeoJSONLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/geometryEngineAsync",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Search",
  "esri/widgets/Search/LocatorSearchSource"
], function (Map, SceneView, Fullscreen, SceneLayer, FeatureLayer, BasemapToggle, GeoJSONLayer, GraphicsLayer, Graphic, geometryEngineAsync, Legend, Expand, Search, LocatorSearchSource) {

  // ==========================================================================
  // LAYER DEFINITIONS
  // ==========================================================================
  // Layers are organized by draw order: polygon layers first (drawn on bottom),
  // then point layers (drawn on top) so points remain visible and clickable.
  // When you add a new layer, you should:
  //   1. Define the layer variable here in the correct section
  //   2. Add it to the map.layers array below in the correct draw order position
  //   3. Add an entry mapping its checkbox ID to the layer in layerRegistry below

  // ---- Polygon layers (bottom of draw order) ----

  // Heat Vulnerability Index — LIVE
   const hviLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/IsDCghZ73NgoYoz5/arcgis/rest/services/HVIbyCommunityDistrict_ForWeb/FeatureServer/0",
    visible: false,
    title: "Heat Vulnerability Index",
    opacity: 0.6,
    // Override the service-side symbology with the ColorBrewer YlOrRd 5-class
    // ramp — the conventional palette for HVI choropleths and what NYC planners
    // expect to see. HVI is a discrete 1-5 integer so UniqueValue (not
    // ClassBreaks) is the right renderer type.
    renderer: {
      type: "unique-value",
      field: "HVI",
      uniqueValueInfos: [
        { value: 1, label: "1 — Lowest risk",
          symbol: { type: "simple-fill", color: "#ffffb2",
                    outline: { color: [120, 120, 120, 0.6], width: 0.5 } } },
        { value: 2, label: "2",
          symbol: { type: "simple-fill", color: "#fecc5c",
                    outline: { color: [120, 120, 120, 0.6], width: 0.5 } } },
        { value: 3, label: "3",
          symbol: { type: "simple-fill", color: "#fd8d3c",
                    outline: { color: [120, 120, 120, 0.6], width: 0.5 } } },
        { value: 4, label: "4",
          symbol: { type: "simple-fill", color: "#f03b20",
                    outline: { color: [120, 120, 120, 0.6], width: 0.5 } } },
        { value: 5, label: "5 — Highest risk",
          symbol: { type: "simple-fill", color: "#bd0026",
                    outline: { color: [120, 120, 120, 0.6], width: 0.5 } } }
      ]
    },
    popupTemplate: {
      title: "Heat Vulnerability Index",
      content: [
        {
          type: "fields",
          fieldInfos:[
            {fieldName: "Borough", label: "Borough"},
            {fieldName: "CommDist", label: "Community District"},
            {fieldName: "Neighborhood_CD", label: "Neighborhood"},
            {fieldName:"HVI", label: "HVI Score"}
          ]
        }
      ]
    }
 });

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

  // Beaches — polygon feature service
  const beachesLayer = new FeatureLayer({
    url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/nyc_beaches/FeatureServer/1",
    visible: false,
    title: "Beaches",
    // Drape polygons on the terrain surface. Without this, the SceneView defaults
    // to absolute-height when features have Z coordinates, pinning the polygons at
    // z=0 (sea level) and causing inland areas to render below the ground.
    elevationInfo: { mode: "on-the-ground" },
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [255, 226, 156, 0.7],
        outline: { color: [219, 154, 89, 0.9], width: 1 }
      }
    },
    popupTemplate: {
      title: "{name}",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "name",      label: "Beach Name" },
          { fieldName: "agency",    label: "Agency" },
          { fieldName: "gov_level", label: "Government Level" }
        ]
      }]
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
    url: "https://services6.arcgis.com/yG5s3afENB5iO9fj/ArcGIS/rest/services/NYC_Parks_Drinking_Fountains/FeatureServer/0",
    visible: false,
    title: "Drinking Fountains",
    renderer: {
      type: "simple",
      symbol: {
      type: "simple-marker",
      style: "circle",
      color: [0, 150, 255, 0.8],   // nice water blue
      size: 6,                     // smaller = less clutter
      outline: {
      color: [255, 255, 255, 0.8],
      width: 1
  }
}
},
    popupTemplate: {
      title: "Drinking Fountain",
      expressionInfos: [{
        name: "borough-full",
        expression: `
          var code = $feature.Borough;
          if (code == "M") return "Manhattan";
          if (code == "B") return "Brooklyn";
          if (code == "Q") return "Queens";
          if (code == "X") return "The Bronx";
          if (code == "R") return "Staten Island";
          return code;
        `
      }],
      content: [{
        type: "text",
        text: `<table class="esri-widget__table">
          <tr><th>Park / Property</th><td>{PropName}</td></tr>
          <tr><th>Borough</th><td>{expression/borough-full}</td></tr>
          <tr><th><a href="https://docs.google.com/document/d/1whu6gzwBbinNuoBx6FLpaaGOy4cdecOrjRdJEsHwJn8/edit?tab=t.0" target="_blank">Fountain Type</a></th><td>{FountainTy}</td></tr>
          <tr><th>Status</th><td>{FeatureSta}</td></tr>
          <tr><th>Position</th><td>{Position}</td></tr>
        </table>`
      }]
    }
    
  });

  // Drinking Fountain ¼-mile dissolved buffer — LIVE (client-side, populated after view loads)
  const fountainBufferLayer = new GraphicsLayer({
    visible: false,
    title: "Walking Distance from Fountains",
    legendEnabled: false  // GraphicsLayer not supported by Legend widget; excluded from legend
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
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [0, 200, 255, 0.9],
        size: 7,
        outline: { color: [255,255,255], width: 1 }
      }
    },
    {
      value: "Hydrant Spray Cap",
      label: "Hydrant Spray Cap",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [255, 100, 100, 0.9],
        size: 7,
        outline: { color: [255,255,255], width: 1 }
      }
    }
  ],
  defaultSymbol: {
    type: "simple-marker",
    style: "circle",
    color: [180, 180, 255, 0.9],
    size: 7
  },
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
  style: "circle",
  color: [0, 255, 200, 0.9],
  size: 6,
  outline: {
    color: [160, 160, 160],
    width: 1
  }
}
    },
    popupTemplate: {
      title: "Spray Shower",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "Facility_name", label: "Name" }
        ]
      }]
    }
  });


  // Pools — LIVE (point GeoJSON)
const poolsLayer = new GeoJSONLayer({
  url: "assets/pools_points.geojson",
  visible: false,
  title: "Pools",
  popupTemplate:{
    title: "{name}",
    content: [
      {
        type: "fields",
        fieldInfos:[
          {fieldName: "name", label: "Pool Name"},
          {fieldName: "location", label: "Location"},
          {fieldName: "pooltype", label: "Pool Type"}
        ]
      }
    ]

  },
  renderer:{
    type: "simple",
    symbol: {
  type: "simple-marker",
  style: "circle",
  color: [0, 120, 255, 0.9],
  size: 7,
  outline: {
    color: [255,255,255],
    width: 1
    }
    }
  }
});

  // Indoor Cooling Centers — LIVE
  const coolingCentersLayer = new FeatureLayer({
    url: "https://services6.arcgis.com/yG5s3afENB5iO9fj/ArcGIS/rest/services/Cool_Options/FeatureServer/0",
    visible: false,
    title: "Indoor Cooling Centers",
    definitionExpression: "Space_type IN ('Cooling Center', 'Other Indoor Cool Option')", 
    renderer: {
      type: "simple",
      symbol: {
  type: "simple-marker",
  style: "circle",
  color: [255, 165, 0, 0.9],
  size: 7,
  outline: {
    color: [255,255,255],
    width: 1
  }
}
    },
    popupTemplate: {
      title: "Indoor Cooling Center",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "Facility_name", label: "Name" }, 
          { fieldName: "Address", label: "Address" },
          { fieldName: "Borough_name", label: "Borough" },
          { fieldName: "ZIP_code", label: "ZIP Code" },
          { fieldName: "Age_restriction", label: "Age Restriction" }
        ]
      }]
    }
  });

  // 3D Buildings (only visible in 3D mode, not in layer panel)
  // Using the Esri Living Atlas OSM-based layer for completeness. A prior auth bug
  // (empty tiles for AGOL users without Living Atlas subscription) appeared once but
  // could not be reproduced; monitoring during continued testing.
  const open3DBuildings = new SceneLayer({
    url: "https://basemaps3d.arcgis.com/arcgis/rest/services/Open3D_Buildings_v1/SceneServer",
    visible: false,
    legendEnabled: false
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
      // fountainsLayer is intentionally last so drinking fountains render
      // on top of every other 2D feature — they're the primary planning focus.
      coolingSitesLayer,
      sprayShowersLayer,
      coolingCentersLayer,
      poolsLayer,
      fountainsLayer,

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

  // Suppress city/borough/town labels from the basemap reference layer.
  // These labels ("New York", borough names, NJ towns) are visible at the default
  // zoom level but add no value for city planners already working within NYC.
  // Street, park, neighborhood, and water labels are preserved.
  map.basemap.load().then(function () {
    var refLayer = map.basemap.referenceLayers.getItemAt(0);
    if (!refLayer) return;
    refLayer.when(function () {
      var styleInfo = refLayer.currentStyleInfo;
      if (!styleInfo || !styleInfo.style) return;

      var style = JSON.parse(JSON.stringify(styleInfo.style));

      var toHide = [
        // "City large scale/..." — visible at the default zoom and finer
        "City large scale/town small",
        "City large scale/town large",
        "City large scale/small",
        "City large scale/medium",
        "City large scale/large",
        "City large scale/x large",
        // "City small scale/..." — visible when zoomed out beyond the default
        "City small scale/town small non capital",
        "City small scale/town large non capital",
        "City small scale/small non capital",
        "City small scale/medium non capital",
        "City small scale/large non capital",
        "City small scale/x large non capital",
        "City small scale/other capital",
        "City small scale/town large other capital",
        "City small scale/small other capital",
        "City small scale/medium other capital",
        "City small scale/large other capital",
        "City small scale/town small admin0 capital",
        "City small scale/town large admin0 capital",
        "City small scale/small admin0 capital",
        "City small scale/medium admin0 capital",
        "City small scale/large admin0 capital",
        "City small scale/x large admin0 capital",
        "City small scale/x large admin1 capital",
        "City small scale/x large admin2 capital"
      ];

      style.layers.forEach(function (layer) {
        if (toHide.indexOf(layer.id) !== -1) {
          if (!layer.layout) layer.layout = {};
          layer.layout.visibility = "none";
        }
      });

      refLayer.loadStyle(style);
    });
  });

  view.watch("scale", function (newScale) {
    // Disable/enable checkboxes for layers that have a minScale threshold.
    // When the map is zoomed out beyond a layer's minScale, its checkbox
    // and label are greyed out with a tooltip explaining why.
    updateScaleDependentControls(newScale);

    // Also update the legend to hide entries for layers beyond their minScale
    updateLegendVisibility();
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
  var layerRegistry = {
    "hvi":                 hviLayer,
    "hvi-high":            null,   // This will be a filter on hviLayer, not a separate layer
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

function updateHviState() {
  var hviCheckbox = document.querySelector('.layer-checkbox[data-layer-id="hvi"]');
  var hviHighCheckbox = document.querySelector('.layer-checkbox[data-layer-id="hvi-high"]');

  if (!hviCheckbox || !hviHighCheckbox) return;

  var showHvi = hviCheckbox.checked;
  var showHigh = hviHighCheckbox.checked;

  // neither checked -> hide HVI
  if (!showHvi && !showHigh) {
    hviLayer.visible = false;
    hviLayer.definitionExpression = null;
    return;
  }

  // high-risk checked -> show only HVI 4 or 5
  if (showHigh) {
    hviLayer.visible = true;
    hviLayer.definitionExpression = "HVI >= 4";
    return;
  }

  // only main HVI checked -> show full HVI
  hviLayer.visible = true;
  hviLayer.definitionExpression = null;
}
  // Build a checkbox row for each layer
  layerItems.forEach(function (item) {
    var row = document.createElement("label");
    row.className = "layer-row" + (item.indent ? " layer-indent" : "");

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "layer-checkbox";
    checkbox.dataset.layerId = item.id;

    checkbox.addEventListener("change", function () {
  // Handle HVI controls together
  if (item.id === "hvi" || item.id === "hvi-high") {
    updateHviState();
    return;
  }

  // Normal layer toggle
  var layer = layerRegistry[item.id];
  if (layer) {
    layer.visible = checkbox.checked;
  }
});

    var labelText = document.createTextNode(" " + item.label);

    row.appendChild(checkbox);
    row.appendChild(labelText);
    panelContent.appendChild(row);
  });

  // "Clear All Layers" button at the bottom of the panel.
  // Unchecks every checkbox and dispatches its change event so all existing
  // handlers (including the HVI special cases) run correctly.
  var clearAllBtn = document.createElement("button");
  clearAllBtn.textContent = "Clear All Layers";
  clearAllBtn.className = "clear-all-btn";
  clearAllBtn.addEventListener("click", function () {
    panelContent.querySelectorAll(".layer-checkbox").forEach(function (cb) {
      if (cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event("change"));
      }
    });
  });
  panelContent.appendChild(clearAllBtn);

  updateHviState(); // Initialize HVI state based on checkboxes (both start unchecked, so HVI starts hidden)
  
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

  // Custom home button — replaces the Home widget so we have full control over
  // click behavior. In 3D mode, resets center/zoom but preserves camera tilt and
  // heading. Uses ESRI's own widget CSS classes so it looks identical to the built-in button.
  var homeBtn = document.createElement("div");
  homeBtn.className = "esri-component esri-widget--button esri-widget esri-interactive";
  homeBtn.title = "Default extent";
  homeBtn.setAttribute("role", "button");
  homeBtn.setAttribute("tabindex", "0");
  homeBtn.innerHTML = '<span aria-hidden="true" class="esri-icon esri-icon-home"></span>';

  homeBtn.addEventListener("click", function () {
    if (is3DMode) {
      view.goTo(
        { center: [-74.006, 40.7128], zoom: 12, tilt: view.camera.tilt, heading: view.camera.heading },
        { duration: 1000 }
      );
    } else {
      view.goTo({ center: [-74.006, 40.7128], zoom: 12, tilt: 0 }, { duration: 1000 });
    }
  });

  view.ui.add(homeBtn, {position:"top-left", index:0});

  var fullscreen = new Fullscreen({ view: view });
  view.ui.add(fullscreen, "top-right");

  var basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite"
  });
  view.ui.add(basemapToggle, "bottom-right");

  // Scale indicator — display-only widget showing the current map scale as a ratio.
  // Hidden in 3D mode because SceneView.scale is unreliable when the camera is tilted.
  var scaleIndicator = document.createElement("div");
  scaleIndicator.id = "scale-indicator";

  function formatScale(scale) {
    return "1:" + Math.round(scale).toLocaleString();
  }

  scaleIndicator.textContent = formatScale(view.scale);

  view.watch("scale", function (newScale) {
    scaleIndicator.textContent = formatScale(newScale);
  });

  view.ui.add(scaleIndicator, "bottom-right");

    // Search widget with geocoding
  // Define a locator source for the Search widget that uses the ArcGIS World Geocoding Service

  var nycExtent = {
    type: "extent",
    xmin: -74.25909,
    ymin: 40.477399,
    xmax: -73.700181,
    ymax: 40.917577,
    spatialReference: { wkid: 4326 }
  }

  var search = new Search({
    view: view,
    includeDefaultSources: false,
    sources: [
      new LocatorSearchSource({
        name: "NYC Address Search",
        placeholder: "Enter an NYC address",
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
        singleLineFieldName: "SingleLine",
        countryCode:"USA",
        // searchExtent biases the World Geocoder toward this bbox via its
        // `bbox` parameter. It's a strong preference, not a hard cutoff —
        // unambiguous out-of-NYC addresses can still resolve.
        searchExtent: nycExtent
      })
    ]
  });
  view.ui.add(search, {
    position : "top-left",
  index:0}
  );

  // ==========================================================================
  // LEGEND (collapsible, bottom-left, auto-hides when no 2D layers visible)
  // ==========================================================================
  //
  // The Legend widget ignores layerInfos order and instead renders layers
  // based on their position in the map.layers collection (topmost first).
  // To control legend order independently of draw order, we create one
  // Legend widget per layer and assemble them in a container in the
  // desired sequence.  Each per-layer Legend auto-shows/hides based on
  // layer visibility, so the container only displays active layers.

  // Desired legend order (matches layer control panel).
  // fountainBufferLayer (GraphicsLayer) is excluded because the Legend
  // widget does not support GraphicsLayer.
  var legendLayers = [
    hviLayer,
    fountainsLayer,
    coolingSitesLayer,
    sprayShowersLayer,
    poolsLayer,
    beachesLayer,
    coolingCentersLayer,
    treeCanopyLayer,
    buildingFootprintsLayer
  ];

  // Build a container div and create one Legend per layer in order.
  // Each child div is hidden when its layer is not visible to prevent
  // the "No legend" placeholder from appearing for inactive layers.
  var legendContainer = document.createElement("div");
  legendContainer.id = "legend-container";

  var legendChildDivs = [];  // parallel array: legendChildDivs[i] wraps legendLayers[i]

  legendLayers.forEach(function (lyr, i) {
    var childDiv = document.createElement("div");
    childDiv.style.display = lyr.visible ? "block" : "none";
    legendContainer.appendChild(childDiv);
    legendChildDivs.push(childDiv);

    new Legend({
      view: view,
      container: childDiv,
      layerInfos: [{ layer: lyr }],
      style: "classic"
    });
  });

  // -- Wrap in Expand for collapsibility --
  var legendExpand = new Expand({
    view: view,
    content: legendContainer,
    expandIcon: "legend",
    expandTooltip: "Legend",
    collapseTooltip: "Collapse legend",
    expanded: true
  });

  // Start hidden — will show when at least one 2D layer becomes visible
  legendExpand.visible = false;
  view.ui.add(legendExpand, "bottom-left");

  /**
   * Check whether any 2D data layer is currently visible and update
   * the legend Expand widget visibility accordingly.
   * Also shows/hides each per-layer Legend child div to prevent
   * "No legend" placeholders for inactive layers or layers beyond
   * their minScale threshold.
   */
  function updateLegendVisibility() {
    var currentScale = view.scale;

    // Toggle each per-layer child div.
    // A layer's legend entry is shown only if the layer is visible AND
    // (if it has a minScale) the current map scale is within range.
    legendLayers.forEach(function (lyr, i) {
      var isVisible = lyr.visible;
      if (isVisible && lyr.minScale && currentScale > lyr.minScale) {
        isVisible = false;
      }
      legendChildDivs[i].style.display = isVisible ? "block" : "none";
    });

    // In 3D mode, always hide the entire legend
    if (is3DMode) {
      legendExpand.visible = false;
      return;
    }

    // Show legend Expand if any 2D data layer is effectively visible
    var anyVisible = legendLayers.some(function (lyr) {
      if (!lyr.visible) return false;
      if (lyr.minScale && currentScale > lyr.minScale) return false;
      return true;
    });

    legendExpand.visible = anyVisible;
  }

  // Watch visibility changes on every 2D data layer
  legendLayers.forEach(function (lyr) {
    lyr.watch("visible", function () {
      updateLegendVisibility();
    });
  });

  // Run once at startup (all layers start hidden, so legend starts hidden)
  updateLegendVisibility();

  // Auto-collapse the legend Expand when the browser window is too narrow to
  // display it without overflow. Below 886px the legend overflows and covers
  // the map. The user can still re-expand manually after widening the window.
  window.addEventListener("resize", function () {
    if (window.innerWidth <= 886) {
      legendExpand.expanded = false;
    }
  });

  // ==========================================================================
  // DRINKING FOUNTAIN BUFFER GENERATION
  // ==========================================================================
  // Once the view is ready, query all fountain points and generate a single
  // dissolved ¼-mile (402m) geodesic buffer around them.

  view.when(function () {
    // Paginate through all fountain features in case the service's maxRecordCount
    // is lower than the total feature count. Recurses until exceededTransferLimit
    // is false, then resolves with the full geometry array.
    function fetchAllFountainGeoms(start, accumulated) {
      return fountainsLayer.queryFeatures({
        where: "1=1",
        returnGeometry: true,
        outFields: ["*"],
        num: 1000,
        start: start
      }).then(function (result) {
        var geoms = accumulated.concat(
          result.features.map(function (f) { return f.geometry; })
        );
        if (result.exceededTransferLimit) {
          return fetchAllFountainGeoms(start + 1000, geoms);
        }
        return geoms;
      });
    }

    // Paginate through all HVI polygons (includes null-HVI districts) to build
    // the NYC land boundary used to clip the fountain buffer to land only.
    function fetchAllHVIGeoms(start, accumulated) {
      return hviLayer.queryFeatures({
        where: "1=1",
        returnGeometry: true,
        outFields: [],
        outSpatialReference: view.spatialReference,
        num: 1000,
        start: start
      }).then(function (result) {
        var geoms = accumulated.concat(
          result.features.map(function (f) { return f.geometry; })
        );
        if (result.exceededTransferLimit) {
          return fetchAllHVIGeoms(start + 1000, geoms);
        }
        return geoms;
      });
    }

    Promise.all([fetchAllFountainGeoms(0, []), fetchAllHVIGeoms(0, [])])
      .then(function (results) {
        var fountainGeoms = results[0];
        var hviGeoms = results[1];
        if (!fountainGeoms.length || !hviGeoms.length) return;
        return Promise.all([
          geometryEngineAsync.geodesicBuffer(fountainGeoms, 402, "meters", true),
          geometryEngineAsync.union(hviGeoms)
        ]);
      })
      .then(function (results) {
        if (!results) return;
        var buffered = results[0];
        var nycLand  = results[1];
        var bufferGeom = Array.isArray(buffered) ? buffered[0] : buffered;
        return geometryEngineAsync.intersect(bufferGeom, nycLand);
      })
      .then(function (clipped) {
        if (!clipped) return;
        fountainBufferLayer.add(new Graphic({
          geometry: clipped,
          symbol: {
            type: "simple-fill",
            color: [30, 144, 255, 0.4],
            outline: { color: [30, 100, 220, 0.5], width: 1 }
          },
          popupTemplate: {
            title: "Walking Distance from Fountains",
            content: "All areas of New York City within a quarter mile of a public drinking fountain managed by the NYC Department of Parks and Recreation"
          }
        }));
      })
      .catch(function (err) {
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
      daylightEl.timeSliderPosition = 6 * 60;
      daylightEl.playSpeedMultiplier = 1.5;
      daylightEl.hideTimezone = true;

      // Remove from body until needed
      document.body.removeChild(daylightEl);
      daylightEl.style.display = "";

      daylightInitialized = true;

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
      shadowCastEl.startTimeOfDay = hoursToMs(6);
      shadowCastEl.endTimeOfDay   = hoursToMs(20);
      shadowCastEl.utcOffset = -4;
      shadowCastEl.setAttribute("mode", "total-duration");

      view.environment.lighting.directShadowsEnabled = true;
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
        date: new Date("July 21, 2025 06:00:00 EDT"),
        directShadowsEnabled: true,
        cameraTrackingEnabled: false
      };

      // Add Daylight to the map UI
      view.ui.add(daylightEl, "top-right");

      // Re-apply settings each time
      daylightEl.localDate = new Date(2025, 6, 21);
      daylightEl.utcOffset = -4;
      daylightEl.timeSliderPosition = 6 * 60;
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

      // Hide scale indicator — unreliable with camera tilt applied
      scaleIndicator.style.display = "none";

      // Hide the legend in 3D mode
      updateLegendVisibility();

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

      // Restore scale indicator
      scaleIndicator.style.display = "";

      // Re-show the legend if any 2D layers are still active
      updateLegendVisibility();

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

