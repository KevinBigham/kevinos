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
assert.match(html, /class="focus-reason"/, "NOW exposes a quiet attention reason");
assert.match(html, /<summary>Why these\?<\/summary>/, "attention rules are progressively disclosed");
assert.match(html, /data-focus-reset="1"/, "keyboard and pointer users can clear explicit focus");
assert.doesNotMatch(html, /universal urgency score|productivity score/i, "focus UI does not expose a hidden numerical score");
assert.match(html, /class="context-budget"/, "AI consent preview shows a compact record and byte budget");
assert.match(html, /<details class="ai-receipt">/, "proposal receipts are collapsed by default");
assert.match(html, /readonly/, "terminal and error proposal text cannot be silently reapplied");
assert.match(html, /data-proof-convert=/, "legacy Studio missions expose reviewed one-click proof conversion");
assert.match(html, /data-proof-attempt=/, "structured missions can append bounded attempt receipts");
assert.match(html, /Shipped with override/, "override language remains visibly distinct from verified");
assert.match(html, /localStatus/, "proof contract distinguishes local verification from collaborator report");
assert.match(html, /role="alertdialog"/, "rare risky actions use the shared accessible interruption contract");
assert.match(html, /class="error-summary" role="alert" aria-live="assertive"/, "validation failures are announced and summarized");
assert.match(html, /function cancelHighStakes\(\)/, "Escape has one deterministic high-stakes cancel path");
assert.match(html, /highStakesReturnSelector=highStakesFocusSelector/, "high-stakes focus survives renderer replacement through a stable return selector");
assert.match(html, /id="drillBtn"[^>]*>Test backup<\/button>/, "footer exposes a manual read-only recovery drill");
assert.match(html, /none performed/, "drill result states its read-only consequence explicitly");
assert.match(html, /RECOVERY_DRILL_MAX_BYTES=5000000/, "drill enforces a named file-size ceiling");
assert.match(html, /data-friction-open="now"/, "NOW exposes an explicit friction mark entry point");
assert.match(html, /data-friction-open="capture"/, "quick capture exposes an explicit friction mark entry point");
assert.match(html, /FRICTION_KEEP=200,FRICTION_DAYS=30,FRICTION_COMPACT_MS=43200000/, "friction pilot has named compaction and retention bounds");
assert.match(html, /data-friction-toggle=/, "pilot has an explicit local on/off control");
assert.match(html, /data-friction-clear=/, "pilot has an immediate local clear path");
assert.match(html, /captureMode="quick"/, "capture defaults to quick text");
assert.match(html, /<summary>Power syntax<\/summary>/, "capture grammar is progressively disclosed");
assert.match(html, /\.vc-mic\{display:none\}/, "floating capture control does not overlap mobile content");
assert.match(html, /@media \(pointer:coarse\)\{button,a\.btn-soft,\.stash-actions a\{min-width:44px;min-height:44px\}\}/, "coarse-pointer controls keep touch targets on tablets");
assert.match(html, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?animation-duration:\.01ms !important[\s\S]*?scroll-behavior:auto !important/, "reduced-motion mode suppresses all recurring animation and smooth scrolling");

console.log("responsive UI contracts ok");
