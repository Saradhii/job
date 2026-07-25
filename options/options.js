const S = window.JobFiller.storage;
const P = window.JobFiller.profile;

(async function load() {
  const p = (await S.getProfile()) || P.getDefault();
  document.getElementById("profile").value = JSON.stringify(p, null, 2);
  document.getElementById("apikey").value = (await S.getApiKey()) || "";
  document.getElementById("model").value = (await S.getModel()) || "gpt-4o-mini";
})();

document.getElementById("save").addEventListener("click", async () => {
  const msg = document.getElementById("msg");
  try {
    const p = JSON.parse(document.getElementById("profile").value);
    await S.setProfile(p);
    await S.setApiKey(document.getElementById("apikey").value.trim());
    await S.setModel(document.getElementById("model").value.trim() || "gpt-4o-mini");
    msg.textContent = "Saved.";
  } catch (e) {
    msg.textContent = "Error: " + e.message;
  }
});
