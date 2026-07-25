// tests/llm.test.js
require("../src/profile.js");
require("../src/fields.js");
require("../src/llm.js");
const { buildPrompt, parseResponse } = globalThis.JobFiller.llm;

describe("llm prompt", () => {
  it("includes the canonical schema as allowed paths", () => {
    const p = buildPrompt([{ id: "q1", label: "Notice period?" }], "John");
    expect(p).toContain("identity.firstName");
    expect(p).toContain("q1");
  });
});

describe("llm parse", () => {
  it("parses valid json array", () => {
    const out = parseResponse('[{"path":"preferences.relocation","confidence":0.8,"reasoning":"x"}]', ["preferences.relocation"]);
    expect(out).toHaveLength(1);
    expect(out[0].path).toBe("preferences.relocation");
  });

  it("drops entries with unknown paths", () => {
    const out = parseResponse('[{"path":"nope.bad","confidence":0.9}]', ["identity.email"]);
    expect(out).toHaveLength(0);
  });

  it("returns [] on garbage", () => {
    expect(parseResponse("not json", [])).toEqual([]);
  });
});
