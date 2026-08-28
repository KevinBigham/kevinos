const assert = require("assert");
const { loadApp } = require("./harness");

(async function () {
  const { app } = await loadApp();
  const attacks = ["=2+2", "+SUM(A1:A2)", "-10+20", "@cmd", "  =HYPERLINK(\"x\")", "\t+1"];
  for (const value of attacks) assert.match(app.gmCsvCell(value), /^"'/, "formula-like CSV cell is neutralized: " + JSON.stringify(value));
  assert.strictEqual(app.gmCsvCell("ordinary"), '"ordinary"');
  assert.strictEqual(app.gmCsvCell('a"b'), '"a""b"');

  const rubric = app.gmBlankRubric();
  rubric.fingerprint = "sha256:" + "b".repeat(64);
  const batch = { assignmentName: "Synthetic Brief", course: "Finance", hour: "Hour 3" };
  const subs = [
    { id: "s1", token: "SUB-AAAAAA11", parseStatus: "readable" },
    { id: "s2", token: "SUB-BBBBBB22", parseStatus: "readable" },
  ];
  const finalized = {
    id: "r1", submissionId: "s1", token: "SUB-AAAAAA11", workflow: app.GM_WORKFLOW.FINAL,
    grade: { earned: 90, possible: 100, percent: 90, letter: "A" },
    finalCriteria: [{ criterionId: "criterion-1", points: 45 }, { criterionId: "criterion-2", points: 45 }],
    finalFeedback: { strengths: ["Specific evidence"], nextSteps: ["Explain the tradeoff"], studentNote: "Good work", teacherNote: "" },
    proposal: { feedback: { strengths: ["Specific evidence"], nextSteps: ["Explain the tradeoff"] } }, override: null,
  };
  const proposal = {
    id: "r2", submissionId: "s2", token: "SUB-BBBBBB22", workflow: app.GM_WORKFLOW.REVIEW,
    grade: { earned: 80, possible: 100, percent: 80, letter: "B" },
    finalCriteria: null,
    proposal: { criteria: [{ criterionId: "criterion-1", pointsProposed: 40 }, { criterionId: "criterion-2", pointsProposed: 40 }], feedback: { strengths: ["Claim"], nextSteps: ["Add evidence"] } },
    override: null, flags: [{ message: "Pilot review required" }],
  };
  const ids = [
    { token: "SUB-AAAAAA11", localIdentity: "Local 1" },
    { token: "SUB-BBBBBB22", localIdentity: "=FORMULA" },
  ];
  const summary = app.gmSummaryModel(batch, rubric, subs, [finalized, proposal], ids);
  assert.strictEqual(summary.class.finalizedCount, 1);
  assert.strictEqual(summary.class.requiringReview, 1);
  assert.strictEqual(summary.class.mean, 90);
  assert.strictEqual(summary.class.median, 90);
  assert.deepStrictEqual(summary.class.gradeDistribution, { A: 1 });
  assert.strictEqual(summary.rows[1].status, app.GM_WORKFLOW.REVIEW, "proposal remains visibly non-final");
  assert.strictEqual(summary.rows[1].posted, app.GM_WORKFLOW.NOT_POSTED);

  const csv = app.gmSummaryCsv(summary, rubric);
  assert.match(csv, /"'=FORMULA"/, "identity is CSV-safe");
  assert.match(csv, /"FINALIZED LOCALLY"/);
  assert.match(csv, /"REVIEW REQUIRED"/, "review item is not mislabeled final");
  const gradebook = app.gmSummaryCsv(summary, rubric, true);
  assert.match(gradebook, /SUB-AAAAAA11/);
  assert.doesNotMatch(gradebook, /SUB-BBBBBB22/, "non-final proposal cannot enter gradebook-ready CSV");
  const queue = app.gmReviewQueueCsv(summary, [finalized, proposal]);
  assert.strictEqual((queue.match(/SUB-BBBBBB22/g) || []).length, 1, "review queue includes each non-final item exactly once");
  assert.strictEqual((queue.match(/SUB-AAAAAA11/g) || []).length, 0, "finalized item is absent from review queue");

  const escaped = app.gmFeedbackHtml({ token: "SUB-AAAAAA11" }, finalized, "<img src=x onerror=alert(1)>");
  assert.doesNotMatch(escaped, /<img src=x/, "feedback artifact escapes hostile identity strings");
  assert.match(escaped, /FINALIZED LOCALLY/);
  assert.match(escaped, /NOT POSTED/);
  console.log("grading export and artifact contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
