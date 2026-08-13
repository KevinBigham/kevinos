"use strict";

const fs = require("fs");
const path = require("path");

if (process.argv.length !== 3 || process.argv[2] !== "--redacted") {
  console.error("Usage: node tools/verify-ai-provider-config.js --redacted");
  console.error("This verifier never accepts or prints credential values.");
  process.exit(2);
}

const root = path.resolve(__dirname, "..");
const file = process.env.KEVINOS_PROVIDER_CONFIG_FILE || path.join(root, "relay", ".dev.vars");
const values = Object.create(null);

function loadNamesOnly() {
  let raw = "";
  try { raw = fs.readFileSync(file, "utf8"); } catch (error) {
    if (error && error.code === "ENOENT") return { present: false, mode: "absent" };
    return { present: true, mode: "unreadable" };
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const at = line.indexOf("=");
    if (at <= 0) continue;
    const name = line.slice(0, at).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) continue;
    values[name] = line.slice(at + 1);
  }
  let mode = "unknown";
  try { mode = (fs.statSync(file).mode & 0o777).toString(8); } catch (_) {}
  return { present: true, mode };
}

function configured(name) {
  const value = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : process.env[name];
  return typeof value === "string" && value.length > 0 && !/\s/.test(value);
}

const store = loadNamesOnly();
const enabled = String(values.AI_ENABLED_PROVIDERS || process.env.AI_ENABLED_PROVIDERS || "").split(",").map((x) => x.trim()).filter(Boolean);
const freeModels = String(values.AI_FREE_VERIFIED_MODELS || process.env.AI_FREE_VERIFIED_MODELS || "").split(",").map((x) => x.trim()).filter(Boolean);
const paid = String(values.AI_ALLOW_PAID || process.env.AI_ALLOW_PAID || "false").toLowerCase();
function confirmed(name) {
  const value = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : process.env[name];
  return value === "1" || String(value).toLowerCase() === "true";
}

const providers = [
  ["Groq", "groq", "GROQ_API_KEY", confirmed("GROQ_ZDR_CONFIRMED") ? "ZDR-CONFIRMED" : "ZDR-UNCONFIRMED"],
  ["Mistral", "mistral", "MISTRAL_API_KEY", confirmed("MISTRAL_FREE_MODE_CONFIRMED") ? "FREE-MODE-CONFIRMED" : "FREE-MODE-UNCONFIRMED"],
  ["Gemini", "gemini", "GEMINI_API_KEY", confirmed("GEMINI_FREE_DATA_USE_ACKNOWLEDGED") ? "FREE-DATA-USE-ACKNOWLEDGED" : "MODEL-FREE-ELIGIBILITY-UNCONFIRMED"],
  ["Cohere", "cohere", "COHERE_API_KEY", "OPTIONAL"],
  ["OpenRouter", "openrouter", "OPENROUTER_API_KEY", "OPTIONAL"],
  ["SambaNova", "sambanova", "SAMBANOVA_API_KEY", "OPTIONAL"],
  ["NVIDIA NIM", "nvidia", "NVIDIA_API_KEY", "OPTIONAL"],
];

console.log("KevinOS AI provider configuration — REDACTED");
console.log("Local store  " + (store.present ? "PRESENT / PERMISSIONS " + (store.mode === "600" ? "600" : "UNSAFE-OR-UNKNOWN") : "ABSENT"));
console.log("Paid routing " + (paid === "false" ? "DISABLED" : "UNSAFE"));
for (const [label, id, secret, caveat] of providers) {
  let status = configured(secret) ? "CONFIGURED" : "NOT CONFIGURED";
  if (configured(secret)) status += enabled.indexOf(id) >= 0 ? " / POLICY-ENABLED" : " / POLICY-DISABLED";
  status += " / " + caveat;
  console.log(label.padEnd(12) + status);
}
console.log("Workers AI  BINDING-UNVERIFIED / DAILY-CAP-CONFIGURED");
console.log("Free models " + (freeModels.length ? "DECLARED / LIVE-VERIFICATION-REQUIRED" : "NONE DECLARED"));

if (store.present && store.mode !== "600") process.exitCode = 1;
if (paid !== "false") process.exitCode = 1;
