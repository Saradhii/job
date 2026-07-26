const S = window.JobFiller.storage;
const P = window.JobFiller.profile;

// --- map a dotted profile path to its input element id ---
const IDENTITY = ["firstName", "lastName", "email", "phone", "linkedin", "github", "website", "location"];
const PREFS_TEXT = ["expectedSalary"];
const PREFS_BOOL = ["authorizedToWorkUS", "requiresSponsorship", "remote", "relocation"];

const $ = (id) => document.getElementById(id);

let rawEdited = false;
$("raw").addEventListener("input", () => { rawEdited = true; });

(async function load() {
  const p = (await S.getProfile()) || P.getDefault();
  populateForm(p);
  $("apikey").value = (await S.getApiKey()) || "";
  $("model").value = (await S.getModel()) || "gpt-4o-mini";
})();

function populateForm(p) {
  IDENTITY.forEach((k) => { $(k).value = p.identity?.[k] ?? ""; });
  PREFS_TEXT.forEach((k) => { $(k).value = p.preferences?.[k] ?? ""; });
  PREFS_BOOL.forEach((k) => { $(k).checked = p.preferences?.[k] === true; });
  $("raw").value = JSON.stringify(p, null, 2);
}

function collectFromForm(base) {
  const p = structuredClone(base);
  p.identity = p.identity || {};
  IDENTITY.forEach((k) => { p.identity[k] = $(k).value.trim(); });

  p.preferences = p.preferences || {};
  PREFS_TEXT.forEach((k) => { p.preferences[k] = $(k).value.trim(); });
  // unchecked → null (means "unknown"), so matcher treats it as unresolved
  PREFS_BOOL.forEach((k) => { p.preferences[k] = $(k).checked ? true : null; });
  return p;
}

function setMsg(text, kind) {
  const m = $("msg");
  m.textContent = text;
  m.className = kind || "";
}

$("save").addEventListener("click", async () => {
  const btn = $("save");
  btn.disabled = true;
  try {
    // If the user edited raw JSON, that wins — it may contain workHistory etc.
    let p;
    if (rawEdited) {
      p = JSON.parse($("raw").value);
    } else {
      const base = (await S.getProfile()) || P.getDefault();
      p = collectFromForm(base);
    }

    // light validation
    if (p.identity?.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.identity.email)) {
      throw new Error("Email doesn't look right.");
    }

    await S.setProfile(p);
    await S.setApiKey($("apikey").value.trim());
    await S.setModel($("model").value.trim() || "gpt-4o-mini");
    populateForm(p); // re-sync raw view
    rawEdited = false;
    setMsg("Saved ✓", "ok");
  } catch (e) {
    setMsg(e.message, "err");
  } finally {
    btn.disabled = false;
  }
});
