// KevinOS app-logic test harness (W1 item 21).
// Loads index.html's single IIFE script in Node with a tiny DOM stub and
// returns the app's internal functions for characterization testing.
// These tests pin CURRENT behavior — they are the safety net for the W2
// refactors. The app itself stays ES5; this harness runs only in Node,
// so modern syntax is fine here.

"use strict";

const fs = require("fs");
const path = require("path");

function makeStubElement(id) {
  const el = {
    id: id || "",
    innerHTML: "",
    textContent: "",
    value: "",
    hidden: false,
    disabled: false,
    className: "",
    checked: false,
    type: "",
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    isConnected: true,
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; },
    },
    addEventListener() {},
    removeEventListener() {},
    appendChild(c) { el.children.push(c); if (c && typeof c === "object") c.parentNode = el; return c; },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c; },
    insertAdjacentHTML() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    setAttribute(k, v) { el["_attr_" + k] = String(v); },
    getAttribute(k) { const v = el["_attr_" + k]; return v == null ? null : v; },
    hasAttribute(k) { return el["_attr_" + k] != null; },
    focus() {}, blur() {}, click() {}, select() {},
    contains() { return false; },
    scrollIntoView() {},
  };
  return el;
}

function makeStubDocument() {
  const byId = Object.create(null);
  return {
    getElementById(id) {
      if (!byId[id]) byId[id] = makeStubElement(id);
      return byId[id];
    },
    createElement(tag) { const el = makeStubElement(""); el.tagName = String(tag).toUpperCase(); return el; },
    createTextNode(t) { return { nodeValue: String(t) }; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
    visibilityState: "visible",
    hidden: false,
    title: "KevinOS",
    body: makeStubElement("body"),
  };
}

function makeStubLocalStorage(initial) {
  const map = Object.create(null);
  if (initial) for (const k of Object.keys(initial)) map[k] = String(initial[k]);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
    setItem(k, v) { map[k] = String(v); },
    removeItem(k) { delete map[k]; },
    _dump() { return Object.assign({}, map); },
  };
}

function extractScript(html) {
  const start = html.indexOf("<script>");
  const end = html.lastIndexOf("</script>");
  if (start < 0 || end < 0) throw new Error("script tag not found in index.html");
  return html.slice(start + "<script>".length, end);
}

// The names the tests need, harvested from inside the IIFE.
const EXPORT_NAMES = [
  "APP_VERSION", "SCHEMA_VERSION", "AREAS", "SYNC_ARRAYS", "SYNC_SKIP",
  "uid", "touch", "bury", "cloneJSON", "escapeHtml",
  "pad", "dateKey", "keyToParts", "todayKey", "addDaysKey", "prettyDate",
  "nextRepeatKey", "rollRecurring",
  "parseCaptureDate", "parseCaptureText", "parseCaptureTime", "tokenEntityId",
  "portableDoc", "applyPortableDoc",
  "buildSyncDoc", "applySyncDoc", "mergeById", "mergeRemoteDoc", "unionDeleted", "mergeRoomStats",
  "unfold", "icsUnescape", "parseDT", "parseRRule", "expandRecurrence", "parseICS", "icsEscape", "buildICS",
  "habitDoneToday", "habitCurrentStreak", "habitLongestStreak", "habitGrid7", "toggleHabitToday",
  "trimCouncil", "COUNCIL_KEEP", "entityBytes", "docCountsText", "verifyBackup",
  "deriveSyncKey", "deriveSyncKeyV2", "SYNC_KDF_ITERS",
  "computeStreaks", "weekStartKey",
  "go", "normalizeRoom",
  "checkDayChange", "DAY_CHECK_MS",
  "dayDigest", "invalidateDayCache",
  "armUndo", "runUndo", "findItem",
  "moveFocusTask", "windItems",
  "libraryPaletteEntries", "libraryRecords", "PALETTE_LIB_MAX",
  "closeHourVal", "updateTomorrowFocus", "launchBodyShort",
  "sweepStreak", "mergeSweepLog",
];

// Load the app. opts.storedState: object persisted at kevinos:v1 before boot.
// Returns a promise for { app: <exports>, window, document, localStorage }.
function loadApp(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  let src = extractScript(html);

  const open = src.indexOf("(function(){");
  const close = src.lastIndexOf("})();");
  if (open < 0 || close < 0) throw new Error("IIFE wrapper not found");
  let body = src.slice(open + "(function(){".length, close);

  const harvest =
    "\nreturn {" +
    EXPORT_NAMES.map((n) => n + ":(typeof " + n + '==="undefined"?undefined:' + n + ")").join(",") +
    ',getState:function(){return state;},getRoom:function(){return room;},"__store":store};\n';
  body += harvest;

  const stubLS = makeStubLocalStorage(
    opts.storedState ? { "kevinos:v1": JSON.stringify(opts.storedState) } : null
  );
  const documentStub = makeStubDocument();
  const windowStub = {
    localStorage: stubLS,
    indexedDB: undefined,
    addEventListener() {},
    removeEventListener() {},
    atob(s) { return Buffer.from(s, "base64").toString("binary"); },
    open() {},
    alert() {},
    confirm() { return true; },
  };
  const navigatorStub = { onLine: true, userAgent: "kevinos-test" };
  const locationStub = { search: "", protocol: "file:", origin: "null", pathname: "/", hash: "" };
  const historyStub = { replaceState() {} };
  const setIntervalStub = function () { return 0; };

  // Silence the expected one-time "snapshots unavailable" warn from the stubbed IDB.
  const realWarn = console.warn;
  console.warn = function (m) { if (String(m).indexOf("snapshots unavailable") < 0) realWarn.apply(console, arguments); };

  let app;
  try {
    const factory = new Function(
      "window", "document", "navigator", "location", "history", "setInterval",
      body
    );
    app = factory(windowStub, documentStub, navigatorStub, locationStub, historyStub, setIntervalStub);
  } finally {
    // boot continues async; keep warn suppressed a moment longer
    setTimeout(() => { console.warn = realWarn; }, 100);
  }

  // Boot (store.load().then(...)) resolves on microtasks + a save round-trip.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ app, window: windowStub, document: documentStub, localStorage: stubLS });
    }, 25);
  });
}

module.exports = { loadApp, makeStubLocalStorage };
