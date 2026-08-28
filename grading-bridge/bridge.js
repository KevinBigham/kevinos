"use strict";

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const BRIDGE_VERSION = "1";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;
const SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_EXTRACTED_CHARS = 250000;
const MAX_ARCHIVE_ENTRIES = 200;
const MAX_ARCHIVE_EXPANDED = 5 * 1024 * 1024;
const MAX_ARCHIVE_RATIO = 100;
const SAFE_EXTENSIONS = new Set([".txt", ".md", ".markdown", ".csv", ".html", ".htm", ".docx", ".pdf", ".png", ".jpg", ".jpeg"]);
const REJECT_EXTENSIONS = new Set([".exe", ".dll", ".com", ".bat", ".cmd", ".sh", ".js", ".jar", ".app", ".dmg", ".pkg", ".docm", ".dotm", ".xlsm", ".xlam", ".pptm", ".zip", ".rar", ".7z"]);
const TEMP_PREFIX = path.join(os.tmpdir(), "kevinos-grading-bridge-");

function safeLog(event, facts) {
  const row = { event: String(event || "bridge"), at: new Date().toISOString() };
  for (const key of ["status", "count", "bytes", "code"]) if (facts && facts[key] != null) row[key] = facts[key];
  process.stdout.write(JSON.stringify(row) + "\n");
}

function sha256(buffer) { return "sha256:" + crypto.createHash("sha256").update(buffer).digest("hex"); }
function randomHex(bytes) { return crypto.randomBytes(bytes).toString("hex"); }
function contentType(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(text), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(text);
}
function exactOrigin(origin, allowlist) { return !!origin && allowlist.has(origin); }
function safeHost(host, port) { return host === "127.0.0.1:" + port || host === "localhost:" + port || host === "[::1]:" + port; }
function safeFilename(name) {
  const value = String(name || "");
  if (!value || value.length > 220 || /[\u0000-\u001f]/.test(value)) return false;
  if (value !== path.basename(value) || /[\\/]/.test(value) || value === "." || value === "..") return false;
  return true;
}
function extension(name) { return path.extname(String(name || "")).toLowerCase(); }
function paragraphMap(text, prefix) {
  const rows = String(text || "").replace(/\r\n?/g, "\n").split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean);
  return rows.slice(0, 5000).map((value, index) => ({ location: (prefix || "paragraph") + "-" + (index + 1), text: value.slice(0, 4000) }));
}
function decodeEntities(text) {
  return String(text || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n) || 32));
}
function parsePlain(buffer, kind) {
  const text = buffer.toString("utf8").replace(/\u0000/g, "").slice(0, MAX_EXTRACTED_CHARS);
  const paragraphs = paragraphMap(text, kind === "csv" ? "row" : "paragraph");
  return paragraphs.length ? { status: "readable", text, locations: paragraphs, parser: "node-local-" + kind } : { status: "unreadable", text: "", locations: [], reason: "EMPTY_EXTRACTION", parser: "node-local-" + kind };
}
function parseHtml(buffer) {
  let text = buffer.toString("utf8").slice(0, MAX_EXTRACTED_CHARS * 2);
  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<\/?(?:p|div|section|article|h[1-6]|li|tr|br)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ");
  return parsePlain(Buffer.from(decodeEntities(text).replace(/[ \t]+/g, " ")), "html");
}
function findEocd(buffer) {
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset--) if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  return -1;
}
function inspectZip(buffer) {
  const eocd = findEocd(buffer);
  if (eocd < 0) throw new Error("MALFORMED_ARCHIVE");
  const count = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (count > MAX_ARCHIVE_ENTRIES || centralOffset + centralSize > buffer.length) throw new Error("ARCHIVE_LIMIT");
  const entries = [];
  let offset = centralOffset, expanded = 0;
  for (let index = 0; index < count; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("MALFORMED_ARCHIVE");
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || name.includes("\u0000")) throw new Error("ARCHIVE_TRAVERSAL");
    expanded += uncompressed;
    if (expanded > MAX_ARCHIVE_EXPANDED || (compressed === 0 ? uncompressed > 0 : uncompressed / compressed > MAX_ARCHIVE_RATIO)) throw new Error("ARCHIVE_BOMB");
    if (/vbaProject\.bin$/i.test(name)) throw new Error("MACRO_REJECTED");
    if (method !== 0 && method !== 8) throw new Error("UNSUPPORTED_COMPRESSION");
    entries.push({ name, method, compressed, uncompressed, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
function extractZipEntry(buffer, entry) {
  const offset = entry.localOffset;
  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error("MALFORMED_ARCHIVE");
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const end = start + entry.compressed;
  if (end > buffer.length) throw new Error("MALFORMED_ARCHIVE");
  const payload = buffer.subarray(start, end);
  const out = entry.method === 0 ? Buffer.from(payload) : zlib.inflateRawSync(payload, { maxOutputLength: MAX_ARCHIVE_EXPANDED });
  if (out.length !== entry.uncompressed || out.length > MAX_ARCHIVE_EXPANDED) throw new Error("ARCHIVE_SIZE_MISMATCH");
  return out;
}
function parseDocx(buffer) {
  const entries = inspectZip(buffer);
  const documentEntry = entries.find((x) => x.name === "word/document.xml");
  if (!documentEntry) return { status: "unreadable", text: "", locations: [], reason: "DOCX_DOCUMENT_MISSING", parser: "node-local-docx" };
  let xml = extractZipEntry(buffer, documentEntry).toString("utf8");
  xml = xml.replace(/<w:tab\b[^>]*\/>/g, "\t").replace(/<w:br\b[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "");
  const text = decodeEntities(xml).replace(/[ \t]+/g, " ").slice(0, MAX_EXTRACTED_CHARS);
  const locations = paragraphMap(text, "paragraph");
  return locations.length ? { status: "readable", text, locations, parser: "node-local-docx" } : { status: "unreadable", text: "", locations: [], reason: "EMPTY_EXTRACTION", parser: "node-local-docx" };
}
function pdfString(value) { return value.replace(/\\([nrtbf()\\])/g, (_, c) => ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" }[c] || c)).replace(/\\([0-7]{1,3})/g, (_, n) => String.fromCharCode(parseInt(n, 8))); }
function extractPdfText(chunk) {
  const text = chunk.toString("latin1"), rows = [];
  for (const match of text.matchAll(/\(((?:\\.|[^\\)])*)\)\s*(?:Tj|'|")/g)) rows.push(pdfString(match[1]));
  for (const match of text.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) for (const item of match[1].matchAll(/\(((?:\\.|[^\\)])*)\)/g)) rows.push(pdfString(item[1]));
  return rows.join(" ");
}
function parsePdf(buffer) {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("CORRUPT_PDF");
  const source = buffer.toString("latin1");
  if (/\/Encrypt\b/.test(source)) throw new Error("PASSWORD_PROTECTED");
  const chunks = [buffer];
  for (const match of source.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    const before = source.slice(Math.max(0, match.index - 300), match.index);
    const raw = Buffer.from(match[1], "latin1");
    if (/\/FlateDecode\b/.test(before)) try { chunks.push(zlib.inflateSync(raw, { maxOutputLength: MAX_ARCHIVE_EXPANDED })); } catch (_) {}
    else chunks.push(raw);
  }
  const text = chunks.map(extractPdfText).join("\n").replace(/[ \t]+/g, " ").slice(0, MAX_EXTRACTED_CHARS);
  const locations = paragraphMap(text, "page-1-paragraph");
  return locations.length ? { status: "readable", text, locations, parser: "node-local-pdf-basic" } : { status: "unreadable", text: "", locations: [], reason: "LOCAL_OCR_UNAVAILABLE_OR_INSUFFICIENT", parser: "node-local-pdf-basic" };
}
function parseImage(buffer, ext) {
  const png = ext === ".png" && buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = (ext === ".jpg" || ext === ".jpeg") && buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (!png && !jpg) throw new Error("CORRUPT_IMAGE");
  return { status: "unreadable", text: "", locations: [], reason: "LOCAL_OCR_UNAVAILABLE_OR_INSUFFICIENT", parser: "node-local-image-metadata" };
}
function parseFile(name, mimeType, buffer) {
  if (!safeFilename(name)) throw new Error("UNSAFE_FILENAME");
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_FILE_BYTES) throw new Error("FILE_SIZE_LIMIT");
  const ext = extension(name);
  if (REJECT_EXTENSIONS.has(ext)) throw new Error("FILE_TYPE_REJECTED");
  if (!SAFE_EXTENSIONS.has(ext)) throw new Error("FILE_TYPE_UNSUPPORTED");
  if (buffer.subarray(0, 2).toString("ascii") === "MZ" || buffer.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) throw new Error("EXECUTABLE_REJECTED");
  let parsed;
  if ([".txt", ".md", ".markdown", ".csv"].includes(ext)) parsed = parsePlain(buffer, ext === ".csv" ? "csv" : "text");
  else if (ext === ".html" || ext === ".htm") parsed = parseHtml(buffer);
  else if (ext === ".docx") parsed = parseDocx(buffer);
  else if (ext === ".pdf") parsed = parsePdf(buffer);
  else parsed = parseImage(buffer, ext);
  return Object.assign({ sourceHash: sha256(buffer), sourceBytes: buffer.length, mimeType: String(mimeType || "application/octet-stream").slice(0, 120) }, parsed);
}
function pdfEscape(text) { return String(text || "").replace(/[^\x20-\x7e]/g, "?").replace(/([\\()])/g, "\\$1"); }
function renderFeedbackPdf(text) {
  const lines = String(text || "").slice(0, 12000).split(/\r?\n/).flatMap((line) => line.match(/.{1,88}/g) || [""]).slice(0, 48);
  const stream = "BT /F1 10 Tf 54 748 Td 14 TL " + lines.map((line, i) => (i ? "T* " : "") + "(" + pdfEscape(line) + ") Tj").join(" ") + " ET";
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", "<< /Length " + Buffer.byteLength(stream) + " >>\nstream\n" + stream + "\nendstream", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let body = "%PDF-1.4\n", offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += (index + 1) + " 0 obj\n" + object + "\nendobj\n"; });
  const xref = Buffer.byteLength(body);
  body += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n" + offsets.slice(1).map((n) => String(n).padStart(10, "0") + " 00000 n \n").join("") + "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(body, "binary");
}
function gradedFilename(name, version) { return path.basename(String(name || "assignment"), path.extname(String(name || ""))).slice(0, 150) + " — GRADED v" + (version || 1) + ".pdf"; }
function exactKeys(value, required, optional) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const allowed = required.concat(optional || []).sort();
  const keys = Object.keys(value).sort();
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && keys.every((key) => allowed.includes(key));
}
function boundedString(value, min, max) { return typeof value === "string" && value.length >= min && value.length <= max; }
function boundedStrings(value, minItems, maxItems, maxLength) { return Array.isArray(value) && value.length >= minItems && value.length <= maxItems && value.every((item) => boundedString(item, 1, maxLength)); }
function validateLocalModelOutput(output, rubric, sourceText) {
  const errors = [];
  const top = ["schemaVersion", "submissionToken", "rubricFingerprint", "status", "criteria", "feedback", "flags", "review"];
  if (!exactKeys(output, top, [])) errors.push("OUTPUT_SCHEMA");
  if (!output || output.schemaVersion !== "1" || !/^SUB-[A-Z0-9]{6,24}$/.test(output.submissionToken || "")) errors.push("OUTPUT_IDENTITY");
  const criteria = Array.isArray(rubric && rubric.criteria) ? rubric.criteria : [];
  const byId = new Map(criteria.map((x) => [x.id, x]));
  const seen = new Set();
  if (!Array.isArray(output && output.criteria) || output.criteria.length !== criteria.length) errors.push("OUTPUT_CRITERIA");
  else for (const row of output.criteria) {
    if (!exactKeys(row, ["criterionId", "pointsProposed", "evidence", "rationale", "studentFeedback"], ["confidenceSignal"])) errors.push("OUTPUT_CRITERIA_SCHEMA");
    const criterion = byId.get(row.criterionId);
    if (!criterion || seen.has(row.criterionId) || typeof row.pointsProposed !== "number" || row.pointsProposed < 0 || row.pointsProposed > criterion.maxPoints) errors.push("OUTPUT_CRITERIA");
    seen.add(row.criterionId);
    if (!Array.isArray(row.evidence) || row.evidence.length > 8 || !boundedString(row.rationale, 1, 1600) || !boundedString(row.studentFeedback, 1, 1200) || (row.confidenceSignal != null && (typeof row.confidenceSignal !== "number" || row.confidenceSignal < 0 || row.confidenceSignal > 1))) errors.push("OUTPUT_CRITERIA_SCHEMA");
    for (const evidence of Array.isArray(row.evidence) ? row.evidence : []) {
      if (!exactKeys(evidence, ["location", "excerpt", "explanation"], []) || !boundedString(evidence.location, 1, 160) || !boundedString(evidence.excerpt, 0, 800) || !boundedString(evidence.explanation, 1, 1200)) errors.push("OUTPUT_EVIDENCE_SCHEMA");
      if (evidence.excerpt && !String(sourceText || "").replace(/\s+/g, " ").includes(String(evidence.excerpt).replace(/\s+/g, " "))) errors.push("EVIDENCE_NOT_FOUND");
    }
  }
  if (!output || output.rubricFingerprint !== rubric.fingerprint || !/^sha256:[a-f0-9]{64}$/.test(output.rubricFingerprint || "")) errors.push("RUBRIC_FINGERPRINT");
  if (!output || !["READY_FOR_REVIEW", "REVIEW_REQUIRED", "CANNOT_GRADE"].includes(output.status)) errors.push("OUTPUT_STATUS");
  const feedback = output && output.feedback;
  if (!exactKeys(feedback, ["strengths", "nextSteps", "studentNote", "teacherNote"], []) || !boundedStrings(feedback && feedback.strengths, 1, 4, 500) || !boundedStrings(feedback && feedback.nextSteps, 1, 4, 500) || !boundedString(feedback && feedback.studentNote, 1, 1600) || !boundedString(feedback && feedback.teacherNote, 0, 1600)) errors.push("OUTPUT_FEEDBACK_SCHEMA");
  const codes = ["MISSING_PAGE", "LOW_PARSE_COVERAGE", "UNREADABLE", "MISSING_REQUIRED_SECTION", "RUBRIC_AMBIGUITY", "EVIDENCE_NOT_FOUND", "EVIDENCE_CONFLICT", "POSSIBLE_PROMPT_INJECTION", "SENSITIVE_CONTENT", "BORDERLINE_SCORE", "NEEDS_ACCOMMODATION_REVIEW", "OUTPUT_UNSTABLE", "OTHER"];
  if (!Array.isArray(output && output.flags) || output.flags.length > 30) errors.push("OUTPUT_FLAGS_SCHEMA");
  else for (const flag of output.flags) if (!exactKeys(flag, ["code", "severity", "message"], []) || !codes.includes(flag.code) || !["INFO", "REVIEW", "BLOCK"].includes(flag.severity) || !boundedString(flag.message, 1, 800)) errors.push("OUTPUT_FLAGS_SCHEMA");
  const review = output && output.review;
  if (!exactKeys(review, ["required", "reasons", "recommendedAction"], []) || typeof (review && review.required) !== "boolean" || !Array.isArray(review && review.reasons) || review.reasons.length > 20 || !review.reasons.every((reason) => boundedString(reason, 0, 500)) || !boundedString(review && review.recommendedAction, 0, 1000)) errors.push("OUTPUT_REVIEW_SCHEMA");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => { size += chunk.length; if (size > MAX_BODY_BYTES) { reject(new Error("BODY_LIMIT")); req.destroy(); return; } chunks.push(chunk); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch (_) { reject(new Error("BAD_JSON")); } });
    req.on("error", reject);
  });
}
function safeSessionDir(dir) { return typeof dir === "string" && dir.startsWith(TEMP_PREFIX) && path.dirname(dir) === os.tmpdir(); }
function removeSession(rec) {
  let count = 0;
  if (rec && safeSessionDir(rec.dir) && fs.existsSync(rec.dir)) { count = fs.readdirSync(rec.dir).length; fs.rmSync(rec.dir, { recursive: true, force: true }); }
  return { temporaryFilesRemoved: count, sessionsRemoved: rec ? 1 : 0 };
}
function createBridge(options) {
  options = options || {};
  const host = options.host || DEFAULT_HOST;
  if (host !== "127.0.0.1" && host !== "::1") throw new Error("Bridge must bind to loopback only");
  const requestedPort = options.port == null ? DEFAULT_PORT : Number(options.port);
  const origins = new Set(options.origins || String(process.env.GRADING_BRIDGE_ORIGINS || "http://127.0.0.1:4173").split(",").map((x) => x.trim()).filter(Boolean));
  const sessions = new Map();
  const server = http.createServer(async (req, res) => {
    const actualPort = server.address() && server.address().port || requestedPort;
    if (!safeHost(String(req.headers.host || ""), actualPort)) return contentType(res, 403, { ok: false, code: "HOST_REJECTED" });
    if (!exactOrigin(req.headers.origin, origins)) return contentType(res, 403, { ok: false, code: "ORIGIN_REJECTED" });
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Grading-Session"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS"); return contentType(res, 200, { ok: true }); }
    if (req.method === "GET" && req.url === "/health") return contentType(res, 200, { ok: true, version: BRIDGE_VERSION, loopbackOnly: true, parsers: { text: true, markdown: true, csv: true, html: true, docx: true, pdfBasic: true, imageOcr: false }, localModel: "disabled", logs: "content-free" });
    if (req.method === "POST" && req.url === "/session") {
      const id = randomHex(12), token = randomHex(24), dir = fs.mkdtempSync(TEMP_PREFIX);
      sessions.set(id, { id, tokenHash: sha256(Buffer.from(token)), expiresAt: Date.now() + SESSION_TTL_MS, dir, artifacts: 0 });
      safeLog("session.created", { status: "ok", count: 1 });
      return contentType(res, 201, { ok: true, sessionId: id, token, expiresInMs: SESSION_TTL_MS });
    }
    const match = String(req.url || "").match(/^\/session\/([a-f0-9]{24})$/);
    const sessionId = match ? match[1] : String(req.headers["x-grading-session"] || "");
    let rec = sessions.get(sessionId);
    if (rec && rec.expiresAt <= Date.now()) { removeSession(rec); sessions.delete(sessionId); rec = null; safeLog("session.expired", { status: "deleted", count: 1 }); }
    const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!rec || !bearer || sha256(Buffer.from(bearer)) !== rec.tokenHash) return contentType(res, 401, { ok: false, code: "SESSION_INVALID" });
    if (req.method === "DELETE" && match) {
      const proof = removeSession(rec); sessions.delete(sessionId); safeLog("session.deleted", { status: "ok", count: proof.temporaryFilesRemoved });
      return contentType(res, 200, { ok: true, deletion: proof });
    }
    try {
      const body = await readJson(req);
      if (req.method === "POST" && req.url === "/parse") {
        if (!safeFilename(body.name)) throw new Error("UNSAFE_FILENAME");
        const bytes = Buffer.from(String(body.base64 || ""), "base64");
        const parsed = parseFile(body.name, body.mimeType, bytes);
        safeLog("file.parsed", { status: parsed.status, bytes: bytes.length });
        return contentType(res, 200, { ok: true, result: parsed });
      }
      if (req.method === "POST" && req.url === "/validate-local-output") {
        const validation = validateLocalModelOutput(body.output, body.rubric, body.sourceText);
        safeLog("local-output.validated", { status: validation.valid ? "pass" : "fail", count: validation.errors.length });
        return contentType(res, validation.valid ? 200 : 422, { ok: validation.valid, validation });
      }
      if (req.method === "POST" && req.url === "/render-feedback") {
        if (!safeFilename(body.name) || String(body.text || "").length > 12000) throw new Error("RENDER_INPUT_REJECTED");
        const pdf = renderFeedbackPdf(body.text), name = gradedFilename(body.name, 1), artifactId = randomHex(10), target = path.join(rec.dir, artifactId + ".pdf");
        if (!target.startsWith(rec.dir + path.sep)) throw new Error("TEMP_PATH_REJECTED");
        fs.writeFileSync(target, pdf, { flag: "wx", mode: 0o600 }); rec.artifacts++;
        safeLog("feedback.rendered", { status: "ok", bytes: pdf.length });
        return contentType(res, 200, { ok: true, artifact: { id: artifactId, name, mimeType: "application/pdf", bytes: pdf.length, sourceHash: sha256(pdf), base64: pdf.toString("base64") } });
      }
      return contentType(res, 404, { ok: false, code: "NOT_FOUND" });
    } catch (error) {
      const code = String(error && error.message || "BRIDGE_ERROR").replace(/[^A-Z0-9_]/g, "_").slice(0, 80) || "BRIDGE_ERROR";
      safeLog("request.rejected", { status: "rejected", code });
      return contentType(res, ["BODY_LIMIT", "FILE_SIZE_LIMIT"].includes(code) ? 413 : 422, { ok: false, code });
    }
  });
  return { server, sessions, listen() { return new Promise((resolve, reject) => { server.once("error", reject); server.listen(requestedPort, host, () => resolve(server.address())); }); }, close() { for (const rec of sessions.values()) removeSession(rec); sessions.clear(); return new Promise((resolve) => server.close(resolve)); } };
}

if (require.main === module) {
  const bridge = createBridge({});
  bridge.listen().then((address) => safeLog("bridge.listening", { status: "ok", count: address.port })).catch(() => { safeLog("bridge.failed", { status: "failed" }); process.exitCode = 1; });
}

module.exports = { BRIDGE_VERSION, DEFAULT_HOST, DEFAULT_PORT, SESSION_TTL_MS, MAX_FILE_BYTES, MAX_EXTRACTED_CHARS, TEMP_PREFIX, safeHost, safeFilename, inspectZip, parseFile, parseDocx, parsePdf, renderFeedbackPdf, gradedFilename, validateLocalModelOutput, createBridge, sha256 };
