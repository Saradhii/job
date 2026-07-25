// src/fields.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  // path -> { phrases: [regex/keyword strings], valueType, options? }
  const DICTIONARY = {
    "identity.firstName":      { phrases: ["first name", "given name"], valueType: "text" },
    "identity.lastName":       { phrases: ["last name", "surname", "family name"], valueType: "text" },
    "identity.email":          { phrases: ["email", "email address"], valueType: "email" },
    "identity.phone":          { phrases: ["phone", "mobile", "phone number", "contact number"], valueType: "tel" },
    "identity.linkedin":       { phrases: ["linkedin"], valueType: "text" },
    "identity.github":         { phrases: ["github", "portfolio"], valueType: "text" },
    "identity.website":        { phrases: ["website", "personal site", "url"], valueType: "text" },
    "identity.location":       { phrases: ["location", "city", "address"], valueType: "text" },
    "preferences.expectedSalary": { phrases: ["salary", "compensation", "expected pay", "salary expectation"], valueType: "text" },
    "preferences.authorizedToWorkUS": { phrases: ["authorized to work", "legally authorized"], valueType: "bool" },
    "preferences.requiresSponsorship": { phrases: ["require sponsorship", "need sponsorship", "sponsorship now or future"], valueType: "bool" },
    "preferences.remote":      { phrases: ["open to remote", "willing to remote", "remote work"], valueType: "bool" },
    "preferences.relocation":  { phrases: ["willing to relocate", "open to relocation"], valueType: "bool" },
  };

  root.JobFiller.fields = {
    DICTIONARY,
    allPhrases: () => {
      const s = new Set();
      for (const e of Object.values(DICTIONARY)) e.phrases.forEach((p) => s.add(p.toLowerCase()));
      return [...s];
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
