document.getElementById("fill").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "Filling…";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { out.textContent = "No active tab"; return; }
  chrome.tabs.sendMessage(tab.id, { type: "job-autofiller:fill" }, (resp) => {
    if (chrome.runtime.lastError) {
      out.textContent = "Can't run here (try reloading the page).";
      return;
    }
    out.textContent = `Filled: ${resp.filled}\nReview: ${resp.review}\nUnresolved: ${resp.unresolved}`;
  });
});
document.getElementById("opts").addEventListener("click", () => chrome.runtime.openOptionsPage());
