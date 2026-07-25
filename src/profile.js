// src/profile.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  const DEFAULT = {
    identity: {
      firstName: "", lastName: "", email: "", phone: "",
      linkedin: "", github: "", website: "", location: "",
    },
    workHistory: [],   // [{ company, title, startDate, endDate, bullets: [] }]
    education: [],     // [{ school, degree, startDate, endDate }]
    skills: [],
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
