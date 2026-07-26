// src/profile.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  const DEFAULT = {
    identity: {
      firstName: "", lastName: "", email: "", phone: "",
      linkedin: "", github: "", website: "", location: "",
    },
    // India SDE-specific experience block
    experience: {
      totalYears: "",        // e.g. "3.5" or "3 years 6 months"
      currentCompany: "",    // employer right now
      currentTitle: "",      // designation
      currentCTC: "",        // ₹/annum, fixed+variable (e.g. "₹18,00,000")
      expectedCTC: "",       // ₹/annum
      noticePeriod: "",      // e.g. "60 days", "90 days", "Serving — 15 Aug"
    },
    workHistory: [],   // [{ company, title, startDate, endDate, bullets: [] }]
    education: [],     // [{ school, degree, startDate, endDate }]
    skills: [],        // ["React", "Node", ...]
    preferences: {
      authorizedToWorkUS: null, requiresSponsorship: null,
      remote: null, relocation: null, expectedSalary: "",
    },
    questions: {},     // free-text screener answers keyed by slug
  };

  root.JobFiller.profile = {
    getDefault: () => structuredClone(DEFAULT),
    getByPath: (obj, path) =>
      path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
