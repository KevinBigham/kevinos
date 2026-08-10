"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(html, /<nav class="bottom-nav"[^>]*id="bottomNav"/, "mobile bottom navigation exists");
const registry = html.match(/var ROOM_DEFS=\[([\s\S]*?)\n  \];/);
assert.ok(registry, "canonical room registry exists");
const mobile = [...registry[1].matchAll(/\{id:"([^"]+)",label:"([^"]+)"[\s\S]*?mobile:(\d+)/g)]
  .map((m) => ({ id: m[1], label: m[2], order: Number(m[3]) })).filter((x) => x.order).sort((a, b) => a.order - b.order);
assert.deepStrictEqual(mobile.map((x) => x.label), ["Today", "Tasks", "Calendar", "More"], "mobile room order comes from ROOM_DEFS");
assert.match(html, /if\(d\.mobile===4\)h\+='<button[^']*data-bottom-capture/, "Capture is inserted between Tasks and Calendar");
assert.match(html, /@media \(max-width:560px\)[\s\S]*?\.primary-room-tabs\{display:none\}/, "desktop room tabs hide on phones");
assert.match(html, /\.bottom-nav\{[^}]*grid-template-columns:repeat\(5,1fr\)/, "mobile nav has five equal targets");
assert.match(html, /\.check\{[^}]*width:44px;height:44px/, "task completion target is 44x44");
assert.match(html, /\.task-more\{[^}]*width:44px;height:44px/, "task overflow target is 44x44");
assert.match(html, /more\.setAttribute\("aria-expanded"/, "task overflow exposes expanded state");
assert.match(html, /menu\.setAttribute\("role","menu"\)/, "task secondary actions use a named menu");
assert.match(html, /Overdue · /, "overdue state is explicit text");
assert.match(html, /captureMode="quick"/, "capture defaults to quick text");
assert.match(html, /<summary>Power syntax<\/summary>/, "capture grammar is progressively disclosed");
assert.match(html, /\.vc-mic\{display:none\}/, "floating capture control does not overlap mobile content");
assert.match(html, /@media \(pointer:coarse\)\{button,a\.btn-soft,\.stash-actions a\{min-width:44px;min-height:44px\}\}/, "coarse-pointer controls keep touch targets on tablets");
assert.match(html, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?animation-duration:\.01ms !important[\s\S]*?scroll-behavior:auto !important/, "reduced-motion mode suppresses all recurring animation and smooth scrolling");

console.log("responsive UI contracts ok");
