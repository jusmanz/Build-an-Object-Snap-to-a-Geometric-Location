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

  // TODO
  // #1 - create a buffer around the point

  // #2 - convert bbox to window coordinates (x,y) in pixels for querying the line

  // #3 - query the polygon filter by areaId

  // #4 - using featureEach to iterate over the features and check the condition canWithIn in properties if true set isCanWithIn to true

  // #5 - if isCanWithIn is true, save the feature in featureWithIn
};

const onUp = (e) => {
  // centroid of the polygon

  // #6 - check if isCanWithIn is true update the dragId source snap with the centroid coordinates

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
