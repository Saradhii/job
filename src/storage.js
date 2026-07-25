// src/storage.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  const KEYS = { PROFILE: "profile", APIKEY: "openai_key", MODEL: "openai_model" };

  function get(k) {
    return new Promise((res) => root.chrome?.storage.local.get(k, (r) => res(r[k])));
  }
  function set(k, v) {
    return new Promise((res) => root.chrome?.storage.local.set({ [k]: v }, () => res()));
  }

  root.JobFiller.storage = {
    KEYS,
    getProfile: () => get(KEYS.PROFILE),
    setProfile: (p) => set(KEYS.PROFILE, p),
    getApiKey: () => get(KEYS.APIKEY),
    setApiKey: (k) => set(KEYS.APIKEY, k),
    getModel: () => get(KEYS.MODEL),
    setModel: (m) => set(KEYS.MODEL, m),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
