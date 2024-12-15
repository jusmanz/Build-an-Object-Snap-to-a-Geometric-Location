import { Map } from "https://cdn.skypack.dev/maplibre-gl";
import * as turf from "https://cdn.skypack.dev/@turf/turf";
import { data } from "../data/session-2.js";
import { snapPoint2 } from "../data/snap-point-2.js";

const map = new Map({
  container: "map",
  style: {
    id: "raster",
    version: 8,
    name: "Raster tiles",
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#e0dfdf",
        },
      },
      {
        id: "simple-tiles",
        type: "raster",
        source: "raster-tiles",
      },
    ],
  },
  antialias: true,
  hash: true,
  maxPitch: 85,
});

const areaId = "area";
const dragId = "snapPoint";

const canvas = map.getCanvasContainer();

let featureWithIn = {
  type: "FeatureCollection",
  features: [],
};

let isCanWithIn = false;

map.once("idle", (e) => {
  //area for snapping
  e.target.addSource(areaId, {
    type: "geojson",
    data: data,
  });
  e.target.addLayer({
    id: areaId,
    type: "fill",
    source: areaId,
    paint: {
      "fill-color": [
        "case",
        ["boolean", ["get", "canWithIn"], true],
        "#088",
        "#F44336",
      ],
      "fill-opacity": 0.5,
    },
  });

  // snap point
  e.target.addSource(dragId, {
    type: "geojson",
    data: snapPoint2,
  });
  e.target.addLayer({
    id: dragId,
    type: "circle",
    source: dragId,
    paint: {
      "circle-radius": 10,
      "circle-color": "#f00",
    },
  });
});

map.on("mouseenter", dragId, (e) => {
  canvas.style.cursor = "move";
});

map.on("mouseleave", dragId, (e) => {
  canvas.style.cursor = "";
});

map.on("mousedown", dragId, (e) => {
  e.preventDefault();

  canvas.style.cursor = "grab";

  e.target.on("mousemove", onMove);
  e.target.once("mouseup", onUp);
});

const onMove = (e) => {
  const coords = e.lngLat;

  //add grabbing cursor
  canvas.style.cursor = "grabbing";

  //change source with new position
  map.getSource(dragId).setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          coordinates: [coords.lng, coords.lat],
          type: "Point",
        },
      },
    ],
  });

  //checking for snapping on the line
  const radius = 1;

  const clonePoint = turf.point(coords.toArray());
  const bf1Meters = turf.buffer(clonePoint, radius, { units: "meters" });

  const pointBbox = turf.bbox(bf1Meters);

  const xy1 = map.project([pointBbox?.at(0) ?? 0, pointBbox?.at(1) ?? 0]);
  const xy2 = map.project([pointBbox?.at(2) ?? 0, pointBbox?.at(3) ?? 0]);

  // create new bbox for querty data on window screen
  const windowBbox = [
    [xy1.x, xy1.y],
    [xy2.x, xy2.y],
  ];

  const features = map
    .queryRenderedFeatures(windowBbox, {
      filter: ["==", "$type", "Polygon"],
    })
    .filter((feature) => feature.layer.id === areaId);

  if (features.length > 0) {
    turf.featureEach({ type: "FeatureCollection", features }, (feature) => {
      if (feature.toJSON()?.properties?.canWithIn) {
        map.setPaintProperty(dragId, "circle-color", "#0f0");
        isCanWithIn = true;
      } else {
        map.setPaintProperty(dragId, "circle-color", "#f00");
        isCanWithIn = false;
      }

      if (isCanWithIn) {
        // save feature
        featureWithIn = {
          type: "FeatureCollection",
          features: [feature.toJSON()],
        };
      }
    });
  } else {
    map.setPaintProperty(dragId, "circle-color", "#f00");
    isCanWithIn = false;
  }
};

const onUp = (e) => {
  // centroid of the polygon

  if (isCanWithIn) {
    const centroid = turf.centroid(featureWithIn.features[0]);

    map.getSource(dragId).setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            coordinates: centroid.geometry.coordinates,
            type: "Point",
          },
        },
      ],
    });

    isCanWithIn = false;
  }

  canvas.style.cursor = "";
  map.off("mousemove", onMove);
  map.off("mouseup", onUp);
};

map.on("touchstart", dragId, (e) => {
  if (e.points.length !== 1) return;

  // Prevent the default map drag behavior.
  e.preventDefault();
  e.target.on("touchmove", onMove);
  e.target.once("touchend", onUp);
});
