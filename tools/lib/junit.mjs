// Reading httpyac's JUnit report, and the one judgement that matters in it: was this failure the
// API changing, or the stack never being there.
//
// Ported from the frozen `ClaudeRag` prototype (`tools/http-smoke/scripts/lib/report.mjs`), whose
// whole value is this distinction. Reporting a dead stack as an API regression sends the next person
// to read a diff that contains nothing; reporting a regression as an environment problem ships it.
//
// A regex reader rather than an XML parser on purpose: no dependency, and the document is machine
// written by one known producer. Anything it cannot read comes back as invalid — never as "no
// failures", which is the direction that would turn an unreadable report into a green run.

/**
 * Failures whose text names a transport or harness problem rather than a broken promise.
 *
 * `ReferenceError`/`TypeError` are in the list because they come from a script block in the `.http`
 * file itself — a broken assertion, not a broken API — and reading one as a contract regression is
 * how a typo in a test becomes an incident.
 */
const ENVIRONMENT = [
  /ECONNREFUSED/i, /ENOTFOUND/i, /ETIMEDOUT/i, /ECONNRESET/i, /EAI_AGAIN/i, /EPIPE/i,
  /socket hang up/i, /request to .* failed/i,
  /self[- ]signed certificate/i, /unable to verify the first certificate/i,
  /CERT_HAS_EXPIRED/i, /DEPTH_ZERO_SELF_SIGNED_CERT/i,
  /\bReferenceError\b/, /\bTypeError\b/,
];

const TESTCASE = /<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
const FAILURE = /<(failure|error)\b([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
const ATTRIBUTE = (name) => new RegExp(`${name}="([^"]*)"`);

function attribute(attributes, name) {
  return ATTRIBUTE(name).exec(attributes)?.[1] ?? "";
}

function decode(text) {
  return text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

/**
 * Parse a JUnit document into test cases.
 *
 * `{ valid: false }` for anything that is not a report with at least one test case — an empty file,
 * a stack trace httpyac printed instead of XML, a document from a run that produced no requests.
 * A report with zero cases is NOT a pass: it is a run that exercised nothing.
 */
export function parseJUnit(xml) {
  if (typeof xml !== "string" || !xml.includes("<testcase")) {
    return { valid: false, cases: [] };
  }
  const cases = [];
  for (const match of xml.matchAll(TESTCASE)) {
    const [, attributes, body = ""] = match;
    const failures = [];
    for (const failure of body.matchAll(FAILURE)) {
      const [, kind, failureAttributes, text = ""] = failure;
      failures.push({
        kind,
        message: decode(attribute(failureAttributes, "message") || text.trim()).trim(),
      });
    }
    cases.push({
      name: attribute(attributes, "name"),
      classname: attribute(attributes, "classname"),
      failures,
    });
  }
  return { valid: cases.length > 0, cases };
}

/** True when this failure names a transport or harness problem rather than a broken contract. */
export function isEnvironmentFailure(message) {
  return ENVIRONMENT.some((pattern) => pattern.test(message));
}

/**
 * The verdict for a whole report.
 *
 * `environment` only when EVERY failure is environmental. One real assertion failure among ten
 * connection errors is still a contract regression — the stack was up enough to answer, and the
 * answer was wrong.
 */
export function verdict(report) {
  const failed = report.cases.filter((c) => c.failures.length > 0);
  if (failed.length === 0) return { outcome: "pass", failed, environmental: [], contractual: [] };

  const environmental = [];
  const contractual = [];
  for (const testCase of failed) {
    const target = testCase.failures.every((f) => isEnvironmentFailure(f.message))
      ? environmental
      : contractual;
    target.push(testCase);
  }
  return {
    outcome: contractual.length > 0 ? "contract" : "environment",
    failed, environmental, contractual,
  };
}
