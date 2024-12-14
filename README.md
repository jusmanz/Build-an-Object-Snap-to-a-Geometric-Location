# Build-an-Object-Snap-to-a-Geometric-Location

Build an Object Snap to a Geometric Location FOSS4G 2024 Thailand

## Library

**[MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/)** is an open-source library for publishing maps on your websites or webview based apps. Fast displaying of maps is possible thanks to GPU-accelerated vector tile rendering.

It originated as an open-source fork of [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js), before their switch to a non-OSS license in December 2020. The library's initial versions (1.x) were intended to be a drop-in replacement for the Mapbox’s OSS version (1.x) with additional functionality, but have evolved a lot since then.

---

**[Turf](https://turfjs.org)** is a [JavaScript library](https://en.wikipedia.org/wiki/JavaScript_library) for [spatial analysis](https://en.wikipedia.org/wiki/Spatial_analysis). It includes traditional spatial operations, helper functions for creating [GeoJSON](https://geojson.org) data, and data classification and statistics tools. Turf can be added to your website as a client-side plugin, or you can [run Turf server-side](https://www.npmjs.com/package/@turf/turf) with [Node.js](https://nodejs.org/) (see below).

## How it works

![alt text](/images/img-1.png "Sample image caption")

1. Find vector tiles data by using [queryRenderFeature](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#queryrenderedfeatures) from MapLibreGL i'm using bounding box of drag point and find what's layers under the bbox.

2. find nearest point on the line by using [nearestPointOnLine](https://turfjs.org/docs/api/nearestPointOnLine) from turf.js. when you get the closest point on the line to point. update drag point by closest point coordinates.
