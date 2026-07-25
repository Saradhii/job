// tests/fields.test.js
require("../src/fields.js");
const { DICTIONARY, allPhrases } = globalThis.JobFiller.fields;

describe("fields dictionary", () => {
  it("has entries for core identity fields", () => {
    expect(DICTIONARY["identity.firstName"]).toBeDefined();
    expect(DICTIONARY["identity.email"]).toBeDefined();
  });

  it("each entry has phrases + value type", () => {
    for (const [path, e] of Object.entries(DICTIONARY)) {
      expect(Array.isArray(e.phrases)).toBe(true);
      expect(e.phrases.length).toBeGreaterThan(0);
      expect(["text", "email", "tel", "select", "bool", "date", "longtext"])
        .toContain(e.valueType);
    }
  });

  it("allPhrases returns deduped lowercased list", () => {
    const all = allPhrases();
    expect(all.length).toBeGreaterThan(10);
    expect(all.every((p) => p === p.toLowerCase())).toBe(true);
  });
});
