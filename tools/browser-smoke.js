#!/usr/bin/env node
"use strict";

// Optional, dependency-free Chromium smoke. Node suites remain authoritative.
// This serves only the repository root on loopback and never opens a provider,
// credential, remote URL, or persistent browser profile.
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CANDIDATES = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function browserExecutable() {
  return CANDIDATES.find((candidate) => {
    try { return fs.statSync(candidate).isFile(); } catch (_) { return false; }
  }) || "";
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return ext === ".html" ? "text/html; charset=utf-8" : ext === ".js" ? "text/javascript; charset=utf-8" : ext === ".json" ? "application/json; charset=utf-8" : "application/octet-stream";
}

function serve(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(ROOT, relative);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { response.writeHead(403); response.end("forbidden"); return; }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404); response.end("not found"); return; }
    response.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
    response.end(body);
  });
}

async function main() {
  const executable = browserExecutable();
  if (!executable) {
    console.log("KevinOS browser smoke NOT ATTEMPTED — no supported Chromium executable found");
    return;
  }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kevinos-browser-smoke-"));
  const server = http.createServer(serve);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  const url = "http://127.0.0.1:" + address.port + "/";
  const screenshot = path.join(profile, "smoke.png");
  let output = "", errors = "";
  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(executable, ["--headless=new", "--disable-gpu", "--disable-background-networking", "--disable-component-update", "--disable-extensions", "--disable-sync", "--no-service-autorun", "--no-first-run", "--no-default-browser-check", "--window-size=390,844", "--run-all-compositor-stages-before-draw", "--user-data-dir=" + profile, "--screenshot=" + screenshot, url], { stdio: ["ignore", "pipe", "pipe"] });
      let done = false, screenshotReady = false, forceKill = null;
      const poll = setInterval(() => {
        try {
          if (!done && fs.existsSync(screenshot) && fs.statSync(screenshot).size >= 10000) {
            screenshotReady = true; clearInterval(poll); child.kill("SIGTERM");forceKill=setTimeout(() => child.kill("SIGKILL"), 2000);
          }
        } catch (_) { /* keep polling until the bounded timeout */ }
      }, 250);
      const timer = setTimeout(() => { if (done) return; done = true; clearInterval(poll); if(forceKill)clearTimeout(forceKill); child.kill("SIGKILL"); reject(new Error("Chromium smoke timed out")); }, 30000);
      child.stdout.on("data", (chunk) => { output += chunk; });
      child.stderr.on("data", (chunk) => { errors += chunk; });
      child.once("error", (error) => { if (!done) { done = true; clearInterval(poll); clearTimeout(timer); if(forceKill)clearTimeout(forceKill); reject(error); } });
      child.once("close", (status) => { if (!done) { done = true; clearInterval(poll); clearTimeout(timer); if(forceKill)clearTimeout(forceKill); resolve(screenshotReady?0:status); } });
    });
    if (code !== 0) throw new Error("Chromium exited " + code + ": " + errors.slice(-500));
    const source = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    if (!/KevinOS/.test(source) || !/room-today/.test(source) || !/AI Provider Control Center/.test(source)) throw new Error("Expected KevinOS shell markers were missing");
    if (!fs.existsSync(screenshot) || fs.statSync(screenshot).size < 10000) throw new Error("Chromium did not produce a meaningful local screenshot");
    console.log("KevinOS optional Chromium smoke PASS — local shell rendered with no dependency install");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("KevinOS optional Chromium smoke FAIL — " + error.message); process.exit(1); });
