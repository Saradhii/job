// src/match.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  function normalize(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function tokenOverlap(haystack, phrase) {
    const hay = new Set(haystack.split(" "));
    const ph = phrase.split(" ");
    const hit = ph.filter((w) => hay.has(w)).length;
    return ph.length ? hit / ph.length : 0; // 0..1
  }

  // Bundle is { label, placeholder, helpText, ariaLabel, section }
  function match(bundle) {
    const fields = root.JobFiller.fields;
    if (!fields) throw new Error("fields module not loaded");

    const text = normalize([bundle.label, bundle.placeholder, bundle.helpText, bundle.ariaLabel].join(" "));
    if (!text) return null;

    let best = null;

    for (const [path, entry] of Object.entries(fields.DICTIONARY)) {
      for (const phraseRaw of entry.phrases) {
        const phrase = normalize(phraseRaw);
        let conf = 0;

        // 1) Exact whole-string equality → strongest
        if (text === phrase) conf = 1.0;
        // 2) Phrase as a substring (bounded by word edge)
        else if (new RegExp(`(^| )${escapeRe(phrase)}( |$)`).test(text)) conf = 0.9;
        // 3) All phrase tokens present in text
        else {
          const ov = tokenOverlap(text, phrase);
          if (ov === 1) conf = 0.75;
          else if (ov >= 0.5) conf = 0.6;
        }

        // 4) Fuzzy fallback: typo tolerance — compare phrase against tokens of
        //    comparable length. Similarity is based on PHRASE length (not the
        //    longer text) so short words like "url" don't noise-match everything.
        //    Skip tiny phrases (< 4 chars) entirely — they're too ambiguous.
        if (conf === 0 && phrase.length >= 4) {
          let bestSim = 0;
          text.split(" ").forEach((tok) => {
            if (Math.abs(tok.length - phrase.length) <= 2) {
              const sim = 1 - levenshtein(tok, phrase) / phrase.length;
              if (sim > bestSim) bestSim = sim;
            }
          });
          if (bestSim >= 0.7) conf = bestSim * 0.75; // typo match, capped lower than rules
        }

        if (conf > (best?.confidence ?? 0)) {
          best = { path, confidence: Math.round(conf * 100) / 100 };
        }
      }
    }

    return best && best.confidence >= 0.4 ? best : null;
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  root.JobFiller.match = { match, normalize, levenshtein };
})(typeof globalThis !== "undefined" ? globalThis : this);
