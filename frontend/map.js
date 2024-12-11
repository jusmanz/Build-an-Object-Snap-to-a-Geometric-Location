import { Map } from "https://cdn.skypack.dev/maplibre-gl";

new Map({
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
