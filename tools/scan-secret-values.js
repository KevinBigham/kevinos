"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const findings = [];
const errors = [];
const skippedSecretStores = [];
let scanned = 0;

const excludedDirs = new Set([".git", ".wrangler", "node_modules"]);
const allowedSecretBasenames = new Set([".dev.vars", ".env", ".env.local", "secrets.local"]);
const maxBytes = 5 * 1024 * 1024;

const patterns = [
  { re: /-----BEGIN (?:EC|RSA|OPENSSH|PRIVATE) PRIVATE KEY-----/g, label: "private key material" },
  { re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, label: "GitHub token" },
  { re: /\bgsk_[A-Za-z0-9_-]{20,}\b/g, label: "Groq-style key" },
  { re: /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g, label: "OpenRouter key" },
  { re: /\bsk-[A-Za-z0-9_-]{32,}\b/g, label: "provider key" },
  { re: /\bAIza[0-9A-Za-z_-]{30,}\b/g, label: "Google API key" },
  { re: /\bAKIA[0-9A-Z]{16}\b/g, label: "AWS access key" },
  {
    re: /\b(?:GEMINI|GOOGLE|GROQ|MISTRAL|COHERE|OPENROUTER|SAMBANOVA|NVIDIA|OPENAI|CLOUDFLARE)[A-Z0-9_]*(?:API_?KEY|TOKEN|SECRET)[ \t]*[:=][ \t]*["']?([^\s"'`#<>]{8,})/gi,
    label: "non-empty provider credential assignment",
  },
];

function rel(full) {
  return path.relative(root, full).split(path.sep).join("/");
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isAllowedSecretStore(full) {
  const base = path.basename(full);
  if (allowedSecretBasenames.has(base)) return true;
  if (/^\.dev\.vars\.(?!example$)/.test(base)) return true;
  if (/^\.env\.(?!example$)/.test(base)) return true;
  if (/\.secrets\.local$/.test(base)) return true;
  return false;
}

function verifySecretStore(full) {
  const r = rel(full);
  skippedSecretStores.push(r);
  try {
    const stat = fs.statSync(full);
    if (process.platform !== "win32" && (stat.mode & 0o077) !== 0) {
      errors.push("local secret store permissions are too broad: " + r + " (require chmod 600)");
    }
  } catch (error) {
    errors.push("unable to stat local secret store: " + r);
  }
}

function scanFile(full) {
  if (isAllowedSecretStore(full)) {
    verifySecretStore(full);
    return;
  }
  let stat;
  try { stat = fs.statSync(full); } catch (error) { errors.push("unable to stat " + rel(full)); return; }
  if (!stat.isFile() || stat.size > maxBytes) return;
  let data;
  try { data = fs.readFileSync(full); } catch (error) { errors.push("unable to read " + rel(full)); return; }
  if (data.indexOf(0) >= 0) return;
  const text = data.toString("utf8");
  scanned += 1;
  for (const pattern of patterns) {
    pattern.re.lastIndex = 0;
    let match;
    while ((match = pattern.re.exec(text))) {
      const relative = rel(full);
      const isTestFixture = relative.indexOf("test/") === 0 || relative.indexOf("relay/test/") === 0;
      const captured = match[1] || "";
      const obviousDummy = captured.length < 32 && /(?:test|dummy|example|configured|client|secret|provider)/i.test(captured);
      if (!(pattern.label === "non-empty provider credential assignment" && isTestFixture && obviousDummy)) {
        findings.push({ file: relative, line: lineOf(text, match.index), label: pattern.label });
      }
      if (match[0].length === 0) pattern.re.lastIndex += 1;
    }
  }
}

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (error) { errors.push("unable to list " + rel(dir)); return; }
  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      scanFile(full);
    }
  }
}

walk(root);

const gitignore = (() => {
  try { return fs.readFileSync(path.join(root, ".gitignore"), "utf8"); }
  catch (error) { return ""; }
})();
for (const required of [".dev.vars", ".env", "relay/.dev.vars", "secrets.local", "output/credentials/"]) {
  if (gitignore.indexOf(required) < 0) errors.push(".gitignore missing secret-store rule: " + required);
}

if (findings.length || errors.length) {
  console.error("KevinOS secret-value scan failed.");
  for (const finding of findings) console.error("- possible " + finding.label + " at " + finding.file + ":" + finding.line + " (value intentionally redacted)");
  for (const error of errors) console.error("- " + error);
  console.error("Scanned " + scanned + " text files; skipped " + skippedSecretStores.length + " approved local secret store(s) without printing contents.");
  process.exit(1);
}

console.log("KevinOS secret-value scan ok — " + scanned + " text files, " + skippedSecretStores.length + " approved local secret store(s) skipped, 0 exposed values");
