// tests/match.test.js
require("../src/profile.js");
require("../src/fields.js");
require("../src/match.js");
const { match } = globalThis.JobFiller.match;

function bundle(s) {
  return { label: s, placeholder: null, helpText: null, ariaLabel: null, section: null };
}

describe("Tier 1 matcher", () => {
  it("exact phrase → high confidence", () => {
    const r = match(bundle("First Name"));
    expect(r.path).toBe("identity.firstName");
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("phrase substring → medium confidence", () => {
    const r = match(bundle("Please enter your email address"));
    expect(r.path).toBe("identity.email");
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("fuzzy typo → lower confidence", () => {
    const r = match(bundle("firstt name"));
    expect(r.path).toBe("identity.firstName");
    expect(r.confidence).toBeLessThan(0.9);
    expect(r.confidence).toBeGreaterThan(0.4);
  });

  it("no match → null", () => {
    expect(match(bundle("favourite colour"))).toBeNull();
  });

  it("uses placeholder when label empty", () => {
    // Placeholder with a clear keyword should still match.
    const r = match({ label: null, placeholder: "Phone number", helpText: null, ariaLabel: null, section: null });
    expect(r).not.toBeNull();
    expect(r.path).toBe("identity.phone");
  });
});
