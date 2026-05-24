#!/usr/bin/env node
/**
 * Pull layout + text from Figma node 24:297 (expanded donation UI).
 *
 * Requires a Personal Access Token: https://www.figma.com/developers/api#access-tokens
 *
 *   FIGMA_TOKEN=figd_xxxx node scripts/pull-figma-donation.mjs
 *
 * First run writes data/figma-donation-layers.json — use layer names to fill
 * data/figma-donation-map.json (copy from figma-donation-map.example.json).
 * Second run writes data/figma-donation-expanded.json for the site (design px, origin = frame 24:297).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FILE_KEY = "TpV5YTCcyQtiGxZg3alClj";
const NODE_PARAM = "24-297";
const NODE_ID = NODE_PARAM.includes(":") ? NODE_PARAM : NODE_PARAM.replace("-", ":");

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error(
    "Set FIGMA_TOKEN (Figma → Settings → Security → Personal access tokens).\n" +
      "Example: FIGMA_TOKEN=figd_.... node scripts/pull-figma-donation.mjs"
  );
  process.exit(1);
}

const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
const res = await fetch(url, { headers: { "X-Figma-Token": token } });
if (!res.ok) {
  console.error(`Figma API ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const payload = await res.json();
const wrapped = payload.nodes?.[NODE_ID];
if (!wrapped?.document) {
  console.error("Node not in response:", NODE_ID, Object.keys(payload.nodes || {}));
  process.exit(1);
}

const doc = wrapped.document;
const rootBox = doc.absoluteBoundingBox;
if (!rootBox) {
  console.error("Root node has no absoluteBoundingBox — pick a FRAME in Figma.");
  process.exit(1);
}

function localBox(box) {
  return {
    x: box.x - rootBox.x,
    y: box.y - rootBox.y,
    w: box.width,
    h: box.height,
  };
}

const layers = [];
const texts = [];

function walk(node) {
  const box = node.absoluteBoundingBox;
  const loc = box ? localBox(box) : null;
  if (loc && node.name) {
    layers.push({
      name: node.name,
      type: node.type,
      ...loc,
    });
  }
  if (node.type === "TEXT" && typeof node.characters === "string") {
    texts.push({
      name: node.name,
      text: node.characters,
      ...(loc || {}),
    });
  }
  for (const c of node.children || []) walk(c);
}

walk(doc);

const layersPath = join(ROOT, "data", "figma-donation-layers.json");
const textsPath = join(ROOT, "data", "figma-donation-text.json");
writeFileSync(
  layersPath,
  JSON.stringify({ fileKey: FILE_KEY, nodeId: NODE_ID, rootBox, layers }, null, 2),
  "utf8"
);
writeFileSync(textsPath, JSON.stringify({ fileKey: FILE_KEY, nodeId: NODE_ID, texts }, null, 2), "utf8");
console.log("Wrote", layersPath);
console.log("Wrote", textsPath);

function findLayer(label) {
  if (!label || typeof label !== "string") return null;
  const trimmed = label.trim();
  let hit = layers.find((l) => l.name === trimmed);
  if (hit) return hit;
  hit = layers.find((l) => l.name.includes(trimmed));
  return hit || null;
}

const mapPath = join(ROOT, "data", "figma-donation-map.json");
if (!existsSync(mapPath)) {
  console.log(
    "\nNext: copy data/figma-donation-map.example.json → data/figma-donation-map.json\n" +
      "and set values to exact (or unique substring) Figma layer names from figma-donation-layers.json,\n" +
      "then run this script again."
  );
  process.exit(0);
}

let map;
try {
  map = JSON.parse(readFileSync(mapPath, "utf8"));
} catch (e) {
  console.error("Invalid JSON:", mapPath, e.message);
  process.exit(1);
}

function boxFromMap(key) {
  const label = map[key];
  const layer = findLayer(label);
  if (!layer) {
    console.warn(`Map key "${key}" → no layer match for "${label}"`);
    return null;
  }
  return { x: layer.x, y: layer.y, w: layer.w, h: layer.h };
}

const expanded = {
  $schemaHint:
    "Loaded by js/scroll-transition.js — coordinates are design px relative to Figma frame node 24-297.",
  designSize: { w: rootBox.width, h: rootBox.height },
  morph: {
    bar: boxFromMap("bar"),
    bg: boxFromMap("bg"),
  },
  targets: {
    status: boxFromMap("status"),
    donate: boxFromMap("donate"),
    forms: boxFromMap("forms"),
  },
};

const bad = Object.entries(expanded.morph)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (bad.length) {
  console.error("Missing morph boxes for:", bad.join(", "), "— fix figma-donation-map.json");
  process.exit(1);
}

const expandedPath = join(ROOT, "data", "figma-donation-expanded.json");
writeFileSync(expandedPath, JSON.stringify(expanded, null, 2), "utf8");
console.log("Wrote", expandedPath);
