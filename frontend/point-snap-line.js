import { Map } from "https://cdn.skypack.dev/maplibre-gl";
import { data } from "../data/session-1.js";
import { snapPoint } from "../data/snap-point-1.js";
import * as turf from "https://cdn.skypack.dev/@turf/turf";

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

const size = 80;

const dragId = "snap-1";

const lineSnapId = "session-1";

const pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),

  // get rendering context for the map canvas when layer is added to the map
  onAdd() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext("2d");
  },

  // called once before every frame where the icon will be used
  render() {
    const duration = 1000;
    const t = (performance.now() % duration) / duration;

    const radius = (size / 2) * 0.3;
    const outerRadius = (size / 2) * 0.7 * t + radius;
    const context = this.context;

    // draw outer circle
    context.clearRect(0, 0, this.width, this.height);
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
    context.fillStyle = `rgba(88, 185, 166,${1 - t})`;
    context.fill();

    // draw inner circle
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(95, 200, 144, 1)";
    context.strokeStyle = "white";
    context.lineWidth = 2 + 4 * (1 - t);
    context.fill();
    context.stroke();

    // update this image's data with data from the canvas
    this.data = context.getImageData(0, 0, this.width, this.height).data;

    // continuously repaint the map, resulting in the smooth animation of the dot
    map.triggerRepaint();

    // return `true` to let the map know that the image was updated
    return true;
  },
};

const canvas = map.getCanvasContainer();

map.once("idle", (e) => {
  //line for snapping
  e.target.addSource("session-1", {
    type: "geojson",
    data: data,
  });
  e.target.addLayer({
    id: lineSnapId,
    type: "line",
    source: "session-1",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#00A64F",
      "line-width": 2,
    },
  });

  //point for dragging
  e.target.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

  //origin point source
  e.target.addSource("snap-1", {
    type: "geojson",
    data: snapPoint,
  });

  //origin point
  e.target.addLayer({
    id: dragId,
    type: "symbol",
    source: "snap-1",
    layout: {
      "icon-image": "pulsing-dot",
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
  const radius = 5;

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

  // find interesting features by condition
  const features = map
    .queryRenderedFeatures(windowBbox, {
      filter: ["==", "$type", "LineString"],
    })
    .filter((feature) => feature.layer.id === lineSnapId);

  if (!features.length) return;

  let nearestPoint;

  turf.featureEach({ type: "FeatureCollection", features }, (feature) => {
    const snap = turf.nearestPointOnLine(feature, clonePoint);

    if (!nearestPoint || snap.properties.dist < nearestPoint.properties.dist) {
      nearestPoint = snap;
    }
    if (nearestPoint) {
      map.getSource(dragId).setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: nearestPoint.geometry.coordinates,
              type: "Point",
            },
          },
        ],
      });
    }
  });
};

const onUp = (e) => {
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
