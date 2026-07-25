// tests/profile.test.js
require("../src/profile.js");
const { getDefault, getByPath } = globalThis.JobFiller.profile;

describe("profile", () => {
  it("returns default profile with identity", () => {
    const p = getDefault();
    expect(p.identity.firstName).toBe("");
    expect(Array.isArray(p.workHistory)).toBe(true);
  });

  it("resolves dotted path", () => {
    const p = { identity: { firstName: "Sara" } };
    expect(getByPath(p, "identity.firstName")).toBe("Sara");
  });

  it("returns undefined for unknown path", () => {
    expect(getByPath({}, "nope.x")).toBeUndefined();
  });
});
