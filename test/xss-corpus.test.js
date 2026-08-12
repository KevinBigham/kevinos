"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

function rawMarkupInNode(node, payload) {
  if (!node || typeof node !== "object") return false;
  if (typeof node.innerHTML === "string" && node.innerHTML.indexOf(payload) >= 0) return true;
  return (node.children || []).some((child) => rawMarkupInNode(child, payload));
}

(async function main() {
  const { app, document } = await loadApp();
  const state = app.getState();
  const attack = '<img src=x onerror="window.__kevinosXss=1"><script>window.__kevinosXss=2</script>';
  const corpus = ["AI", "Gmail", "Calendar", "GitHub", "ICS", "backup", "task", "project", "person", "profile", "note", "URL label"];

  for (const surface of corpus) {
    const rendered = app.escapeHtml(surface + " " + attack);
    assert.doesNotMatch(rendered, /<img|<script/i, surface + " external text is escaped");
    assert.match(rendered, /&lt;img/, surface + " external text remains visible as text");
  }

  state.projects = [{ id: attack, title: attack, area: "Inbox", status: "Active", outcome: attack, nextAction: attack }];
  state.people = [{ id: attack, name: attack, email: "safe@example.com", cadence: "monthly", lastContact: app.todayKey(), note: attack }];
  const taskNode = app.makeTaskRow({ id: attack, text: attack, area: "Inbox", done: false, projectId: attack, personId: attack }, { editable: true, areaTag: true, pin: true, del: true });
  const projectNode = app.projCard(state.projects[0]);
  const noteNode = app.noteCard({ id: attack, title: attack, para: "Resource", area: "Inbox", tags: attack, body: attack });
  const buildNode = app.buildCard({ id: attack, name: attack, outcome: attack, stage: "Idea", verificationStatus: "unverified" });
  for (const pair of [["task", taskNode], ["project", projectNode], ["note", noteNode], ["mission", buildNode]]) {
    assert.strictEqual(rawMarkupInNode(pair[1], attack), false, pair[0] + " renderer does not inject hostile text through innerHTML");
  }

  const personHTML = app.personCardHTML(state.people[0]);
  assert.doesNotMatch(personHTML, /<img src=x|<script>window/i, "person renderer escapes imported values");

  state.profile = [{ id: attack, cat: attack, t: attack, createdAt: Date.now() }];
  app.renderProfileList();
  assert.doesNotMatch(document.getElementById("profileList").innerHTML, /<img src=x|<script>window/i, "profile renderer escapes facts");

  const mailHTML = app.emailRowHTML({ id: attack, from: attack, subject: attack, snippet: attack, unread: true });
  assert.doesNotMatch(mailHTML, /<img src=x|<script>window/i, "Gmail renderer escapes provider strings");

  state.events = [{ id: "calendar-xss", title: attack, date: app.todayKey(), time: "09:00", area: "Inbox" }];
  app.invalidateDayCache();
  assert.doesNotMatch(app.launchAgendaCardHTML(), /<img src=x|<script>window/i, "calendar renderer escapes event titles");

  const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:xss-ics\r\nDTSTART;VALUE=DATE:" + app.todayKey().replace(/-/g, "") + "\r\nSUMMARY:" + attack + "\r\nEND:VEVENT\r\nEND:VCALENDAR";
  const parsed = app.parseICS(ics);
  assert.strictEqual(parsed.events[0].title, attack, "ICS parser preserves source text without executing it");
  state.events = parsed.events;
  app.invalidateDayCache();
  assert.doesNotMatch(app.launchAgendaCardHTML(), /<img src=x|<script>window/i, "ICS title is escaped at render time");

  state.pending = [{ id: "ai-xss", kind: "ai", mode: "Review", status: "review", title: attack, body: attack, provider: attack, model: attack, seat: attack, promptId: attack, promptVersion: 1, contextCategories: [attack], createdAt: Date.now() }];
  assert.doesNotMatch(app.renderAiReviewHTML(), /<img src=x|<script>window/i, "AI proposal renderer escapes provider output and provenance");

  const proofMission = { id: "proof-xss", name: attack, outcome: attack, stage: "Testing", acceptance: attack, proofBundle: { version: 1, acceptanceItems: [{ id: "ac-xss", text: attack, status: "waived", waiverReason: attack, evidenceRefs: [] }], attempts: [{ id: "attempt-xss", collaborator: attack, role: attack, packetFingerprint: "stale", summary: attack, verificationReceipts: [{ id: "receipt-xss", actionType: "command", action: attack, reportedStatus: attack, localStatus: "unverified", evidence: attack }] }] } };
  assert.doesNotMatch(app.missionProofEditorHTML(proofMission), /<img src=x|<script>window/i, "mission acceptance, attempt, waiver, command, and evidence fields render inertly");

  assert.strictEqual(app.safeHttpUrl("javascript:alert(1)"), "", "active URL labels cannot create executable links");
  assert.strictEqual(app.safeHttpUrl("https://user:pass@example.com/"), "", "credential-bearing URLs are rejected");

  const backup = app.portableDoc(state);
  assert.strictEqual(backup.pending[0].body, attack, "backup preserves hostile text as inert data");
  const restored = await loadApp({ storedState: backup });
  assert.doesNotMatch(restored.app.renderAiReviewHTML(), /<img src=x|<script>window/i, "restored hostile data remains inert");

  console.log("external-content XSS corpus ok (12 surfaces)");
})().catch((err) => { console.error(err); process.exit(1); });
