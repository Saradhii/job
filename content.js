// Content script — runs at document_idle on every page.
// v1 pipeline: Extract fields → match → fill.
// Entry point is the FILL message from background.

const FILL_ACTION = "job-autofiller:fill";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== FILL_ACTION) return;
  runFill().then((report) => sendResponse(report));
  return true; // async
});

async function runFill() {
  const JF = window.JobFiller;
  const profile = (await JF.storage.getProfile()) || JF.profile.getDefault();

  const bundles = extractFields();
  const results = []; // { id, el, path, value, confidence, source, status, inputType }

  // --- Tier 1: rules + fuzzy ---
  const unresolved = [];
  for (const b of bundles) {
    const m = JF.match.match(b);
    if (m && m.confidence >= 0.5) {
      results.push({
        id: b.id, el: b.element, path: m.path,
        value: JF.profile.getByPath(profile, m.path),
        confidence: m.confidence, source: "rules", status: "matched",
        inputType: b.inputType,
      });
    } else {
      unresolved.push(b);
    }
  }

  // --- Tier 2: LLM on the residue (bundle only, no DOM refs) ---
  if (unresolved.length) {
    const apiKey = await JF.storage.getApiKey();
    const model = await JF.storage.getModel();
    let llmOut = [];
    if (apiKey) {
      try {
        const clean = unresolved.map(stripForLLM);
        const name = profile.identity.firstName;
        llmOut = await JF.llm.callLLM(clean, { apiKey, model, userName: name });
      } catch (e) {
        console.warn("[job-autofiller] LLM failed", e);
      }
    }
    // map LLM results back onto bundles by id
    for (const b of unresolved) {
      const r = llmOut.find((x) => x.id === b.id);
      if (r && r.path && r.confidence >= 0.5) {
        results.push({
          id: b.id, el: b.element, path: r.path,
          value: JF.profile.getByPath(profile, r.path),
          confidence: r.confidence, source: "llm", status: "matched",
          inputType: b.inputType,
        });
      } else {
        results.push({
          id: b.id, el: b.element, path: null, value: null,
          confidence: r?.confidence || 0, source: "unresolved", status: "unresolved",
          inputType: b.inputType,
        });
      }
    }
  }

  // --- Apply fills per confidence gate ---
  const filled = [], review = [], unresolvedIds = [];
  for (const r of results) {
    if (r.status !== "matched" || r.value == null || r.value === "") {
      unresolvedIds.push(r.id);
      continue;
    }
    const ok = JF.fill.fill(r.el, r.value, r.inputType);
    if (!ok) { unresolvedIds.push(r.id); continue; }
    if (r.confidence >= 0.85) filled.push(r);
    else review.push(r);
  }

  console.log("[job-autofiller]", {
    filled: filled.length, review: review.length, unresolved: unresolvedIds.length,
  });
  return { filled: filled.length, review: review.length, unresolved: unresolvedIds.length };
}

function stripForLLM(b) {
  // never send the element reference or anything DOM-bound to the LLM
  return {
    id: b.id, label: b.label, placeholder: b.placeholder,
    helpText: b.helpText, ariaLabel: b.ariaLabel, section: b.section,
    inputType: b.inputType, options: b.options,
  };
}

/**
 * Walk the DOM (incl. open shadow roots + same-origin iframes)
 * and emit "evidence bundles" — structured field metadata.
 * @see DESIGN.md §3 Evidence bundle
 */
function extractFields() {
  const candidates = queryFieldElements(document);
  const fields = candidates
    .map(toEvidenceBundle)
    .filter(Boolean);
  return fields;
}

function queryFieldElements(root) {
  const selector = "input, select, textarea, [contenteditable='true']";
  let els = Array.from(root.querySelectorAll(selector));

  // Pierce open shadow roots.
  els.forEach((el) => {
    if (el.shadowRoot) {
      els = els.concat(queryFieldElements(el.shadowRoot));
    }
  });

  // Same-origin iframes only; cross-origin we can't touch from content script.
  root.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const doc = iframe.contentDocument;
      if (doc) els = els.concat(queryFieldElements(doc));
    } catch {
      // cross-origin — skip
    }
  });

  return els.filter(isVisibleFillable);
}

function isVisibleFillable(el) {
  if (el.disabled || el.getAttribute("aria-hidden") === "true") return false;
  if (el.type === "hidden") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  return true;
}

/**
 * Build an evidence bundle for a single element.
 * Deliberately NOT raw HTML — structured metadata only (DESIGN.md §6).
 */
function toEvidenceBundle(el) {
  const id = el.id || el.getAttribute("name") || null;
  const label = findLabel(el);
  return {
    element: el, // stripped before sending to any backend
    id,
    label,
    ariaLabel: el.getAttribute("aria-label") || null,
    placeholder: el.getAttribute("placeholder") || null,
    helpText: findHelpText(el),
    inputType: el.tagName.toLowerCase() === "select"
      ? "select"
      : (el.getAttribute("type") || el.tagName.toLowerCase()),
    inputMode: el.getAttribute("inputmode") || null,
    section: findSection(el),
    required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
    options: el.tagName.toLowerCase() === "select"
      ? Array.from(el.options).map((o) => o.textContent.trim())
      : [],
    domain: location.hostname,
  };
}

function findLabel(el) {
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) return lbl.textContent.trim();
  }
  // <label> wrapping the field
  const wrapping = el.closest("label");
  if (wrapping) return wrapping.textContent.trim();
  if (el.getAttribute("aria-labelledby")) {
    const lb = document.getElementById(el.getAttribute("aria-labelledby"));
    if (lb) return lb.textContent.trim();
  }
  return null;
}

function findHelpText(el) {
  const describedBy = el.getAttribute("aria-describedby");
  if (!describedBy) return null;
  const node = document.getElementById(describedBy);
  return node ? node.textContent.trim() : null;
}

function findSection(el) {
  const heading = el.closest("fieldset")?.querySelector("legend")?.textContent.trim();
  if (heading) return heading;
  const section = el.closest("[aria-labelledby], section");
  if (section?.getAttribute("aria-labelledby")) {
    const h = document.getElementById(section.getAttribute("aria-labelledby"));
    if (h) return h.textContent.trim();
  }
  return null;
}
