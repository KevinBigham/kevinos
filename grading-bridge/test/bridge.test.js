"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { createBridge, parseFile, renderFeedbackPdf, gradedFilename, validateLocalModelOutput, sha256 } = require("../bridge");

function storedZip(name, payload, declaredSize) {
  const filename = Buffer.from(name), data = Buffer.from(payload), local = Buffer.alloc(30), central = Buffer.alloc(46), end = Buffer.alloc(22);
  const size = declaredSize == null ? data.length : declaredSize;
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 8); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(size, 22); local.writeUInt16LE(filename.length, 26);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 10); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(size, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(0, 42);
  const localPart = Buffer.concat([local, filename, data]), centralPart = Buffer.concat([central, filename]);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(centralPart.length, 12); end.writeUInt32LE(localPart.length, 16);
  return Buffer.concat([localPart, centralPart, end]);
}
async function json(url, options) { const res = await fetch(url, options); return { status: res.status, body: await res.json() }; }
async function rawHealth(address, host, origin) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: address.port, path: "/health", headers: { Host: host, Origin: origin } }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }));
    });
    req.on("error", reject); req.end();
  });
}

(async function () {
  const bridgeSource = fs.readFileSync(path.join(__dirname, "..", "bridge.js"), "utf8");
  assert.doesNotMatch(bridgeSource, /\bfetch\s*\(|https\.request|axios|relayCall|child_process|\bspawn\s*\(|\bexec\s*\(/, "bridge contains no outbound/provider transport primitive");
  assert.throws(() => createBridge({ host: "0.0.0.0", port: 0 }), /loopback/);
  const origin = "http://127.0.0.1:4173";
  const bridge = createBridge({ host: "127.0.0.1", port: 0, origins: [origin] });
  const address = await bridge.listen();
  const base = "http://127.0.0.1:" + address.port;
  try {
    let out = await json(base + "/health", { headers: { Origin: "https://evil.example" } });
    assert.deepStrictEqual([out.status, out.body.code], [403, "ORIGIN_REJECTED"]);
    out = await rawHealth(address, "evil.example", origin);
    assert.deepStrictEqual([out.status, out.body.code], [403, "HOST_REJECTED"]);
    out = await json(base + "/health", { headers: { Origin: origin } });
    assert.strictEqual(out.status, 200); assert.strictEqual(out.body.loopbackOnly, true); assert.strictEqual(out.body.localModel, "disabled");

    const session = await json(base + "/session", { method: "POST", headers: { Origin: origin } });
    assert.strictEqual(session.status, 201); assert.match(session.body.sessionId, /^[a-f0-9]{24}$/); assert.match(session.body.token, /^[a-f0-9]{48}$/);
    const auth = { Origin: origin, Authorization: "Bearer " + session.body.token, "X-Grading-Session": session.body.sessionId, "Content-Type": "application/json" };
    out = await json(base + "/parse", { method: "POST", headers: auth, body: JSON.stringify({ name: "synthetic.txt", mimeType: "text/plain", base64: Buffer.from("First paragraph.\nSecond paragraph.").toString("base64") }) });
    assert.strictEqual(out.status, 200); assert.strictEqual(out.body.result.status, "readable"); assert.deepStrictEqual(out.body.result.locations.map((x) => x.location), ["paragraph-1", "paragraph-2"]);

    const docx = storedZip("word/document.xml", "<w:document><w:body><w:p><w:r><w:t>Synthetic DOCX evidence.</w:t></w:r></w:p></w:body></w:document>");
    const docxResult = parseFile("synthetic.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);
    assert.strictEqual(docxResult.status, "readable"); assert.match(docxResult.text, /Synthetic DOCX evidence/);
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<< /Length 40 >>stream\nBT (Synthetic PDF evidence.) Tj ET\nendstream\nendobj\n%%EOF", "binary");
    const pdfResult = parseFile("synthetic.pdf", "application/pdf", pdf);
    assert.strictEqual(pdfResult.status, "readable"); assert.match(pdfResult.text, /Synthetic PDF evidence/);
    const imageResult = parseFile("synthetic.png", "image/png", Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(32)]));
    assert.deepStrictEqual([imageResult.status, imageResult.reason], ["unreadable", "LOCAL_OCR_UNAVAILABLE_OR_INSUFFICIENT"]);

    for (const [name, bytes, code] of [
      ["../escape.txt", Buffer.from("x"), "UNSAFE_FILENAME"], ["run.exe", Buffer.from("MZpayload"), "FILE_TYPE_REJECTED"], ["macro.docm", Buffer.from("x"), "FILE_TYPE_REJECTED"],
      ["broken.docx", Buffer.from("not zip"), "MALFORMED_ARCHIVE"], ["secret.pdf", Buffer.from("%PDF-1.4 /Encrypt"), "PASSWORD_PROTECTED"], ["bad.png", Buffer.from("not png"), "CORRUPT_IMAGE"],
    ]) assert.throws(() => parseFile(name, "application/octet-stream", bytes), new RegExp(code));
    assert.throws(() => parseFile("traversal.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", storedZip("../word/document.xml", "x")), /ARCHIVE_TRAVERSAL/);
    assert.throws(() => parseFile("bomb.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", storedZip("word/document.xml", "x", 6 * 1024 * 1024)), /ARCHIVE_BOMB/);
    assert.throws(() => parseFile("large.txt", "text/plain", Buffer.alloc(1024 * 1024 + 1)), /FILE_SIZE_LIMIT/);

    const rubric = { fingerprint: "sha256:" + "a".repeat(64), criteria: [{ id: "c1", maxPoints: 10 }] };
    const modelOutput = { schemaVersion: "1", submissionToken: "SUB-ABCDEF", rubricFingerprint: rubric.fingerprint, status: "REVIEW_REQUIRED", criteria: [{ criterionId: "c1", pointsProposed: 8, evidence: [{ location: "paragraph-1", excerpt: "Synthetic evidence", explanation: "Direct support" }], rationale: "Matches", studentFeedback: "Add detail" }], feedback: { strengths: ["Claim"], nextSteps: ["Detail"], studentNote: "Review", teacherNote: "" }, flags: [], review: { required: true, reasons: ["Pilot"], recommendedAction: "Review" } };
    assert.strictEqual(validateLocalModelOutput(modelOutput, rubric, "Synthetic evidence in source.").valid, true);
    const invented = JSON.parse(JSON.stringify(modelOutput)); invented.criteria[0].evidence[0].excerpt = "invented";
    assert.deepStrictEqual(validateLocalModelOutput(invented, rubric, "Synthetic evidence in source.").errors, ["EVIDENCE_NOT_FOUND"]);
    const extra = Object.assign({ total: 8 }, modelOutput);
    assert.ok(validateLocalModelOutput(extra, rubric, "Synthetic evidence in source.").errors.includes("OUTPUT_SCHEMA"));
    const nestedExtra = JSON.parse(JSON.stringify(modelOutput)); nestedExtra.criteria[0].authority = "final";
    assert.ok(validateLocalModelOutput(nestedExtra, rubric, "Synthetic evidence in source.").errors.includes("OUTPUT_CRITERIA_SCHEMA"));

    const original = Buffer.from("immutable synthetic original"), originalHash = sha256(original);
    const feedback = renderFeedbackPdf("Synthetic feedback\nScore reviewed locally");
    assert.match(feedback.subarray(0, 8).toString("ascii"), /^%PDF-1/); assert.strictEqual(sha256(original), originalHash); assert.strictEqual(gradedFilename("paper.docx", 1), "paper — GRADED v1.pdf");
    out = await json(base + "/render-feedback", { method: "POST", headers: auth, body: JSON.stringify({ name: "paper.docx", text: "Synthetic feedback only" }) });
    assert.strictEqual(out.status, 200); assert.strictEqual(out.body.artifact.name, "paper — GRADED v1.pdf"); assert.match(Buffer.from(out.body.artifact.base64, "base64").subarray(0, 8).toString("ascii"), /^%PDF-1/);

    out = await json(base + "/session/" + session.body.sessionId, { method: "DELETE", headers: auth });
    assert.strictEqual(out.status, 200); assert.deepStrictEqual(out.body.deletion, { temporaryFilesRemoved: 1, sessionsRemoved: 1 });
    out = await json(base + "/parse", { method: "POST", headers: auth, body: "{}" }); assert.strictEqual(out.status, 401);
  } finally { await bridge.close(); }
  console.log("grading bridge loopback, parsing, rendering, and deletion contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
