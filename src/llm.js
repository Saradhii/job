// src/llm.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  function allowedPaths() {
    return Object.keys(root.JobFiller.fields.DICTIONARY);
  }

  // bundles: [{ id, label, placeholder, helpText, options, section }]
  function buildPrompt(bundles, userName) {
    const schema = allowedPaths().sort().join("\n");
    const items = bundles.map((b, i) => {
      const bits = [b.label, b.placeholder, b.helpText, b.section].filter(Boolean).join(" | ");
      const opts = b.options?.length ? ` [options: ${b.options.join(", ")}]` : "";
      return `${i + 1}. id=${b.id}: ${bits}${opts}`;
    }).join("\n");

    return `You map job-application form fields to a candidate profile.
Candidate name (for context only): ${userName || "unknown"}.

Allowed canonical paths (use ONLY these; if none fit, set path to null):
${schema}

For each field below, return one entry in a JSON array. Each element:
{"id": <field id>, "path": <canonical path or null>, "confidence": <0..1>, "reasoning": "<short>"}
Confidence < 0.5 if unsure.

Fields:
${items}`;
  }

  function parseResponse(text, validPaths) {
    const set = new Set(validPaths);
    let arr;
    try {
      // tolerate code fences / trailing prose: grab the first JSON array
      const m = text.match(/\[[\s\S]*\]/);
      arr = JSON.parse(m ? m[0] : text);
    } catch { return []; }
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === "object" && (x.path === null || set.has(x.path)))
      .map((x) => ({
        id: x.id,
        path: x.path,
        confidence: Math.min(1, Math.max(0, Number(x.confidence) || 0)),
        reasoning: String(x.reasoning || ""),
      }));
  }

  // OpenAI json_object mode requires a top-level object, so we ask for { "results": [...] }
  // and then validate through parseResponse.
  async function callLLM(bundles, { apiKey, model, userName }) {
    if (!apiKey) return [];
    const prompt = buildPrompt(bundles, userName);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You return JSON only. Wrap the array under a top-level key \"results\"." },
          { role: "user", content: prompt + '\n\nReturn: {"results": [ ... ]}' },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let inner;
    try {
      inner = JSON.parse(content).results;
    } catch {
      inner = [];
    }
    // re-stringify so parseResponse can validate paths
    return parseResponse(JSON.stringify(inner), allowedPaths());
  }

  root.JobFiller.llm = { buildPrompt, parseResponse, callLLM, allowedPaths };
})(typeof globalThis !== "undefined" ? globalThis : this);
