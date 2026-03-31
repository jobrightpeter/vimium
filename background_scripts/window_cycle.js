// background_scripts/window_cycle.js

async function focusAdjacentWindow(direction = +1, { includeNonNormal = false } = {}) {
  const current = await chrome.windows.getCurrent();

  let wins = await chrome.windows.getAll({
    populate: false,
    windowTypes: includeNonNormal ? undefined : ["normal"],
  });

  // If current isn't in the filtered list (e.g., popup), fall back to all
  if (!wins.some(w => w.id === current.id)) {
    wins = await chrome.windows.getAll({ populate: false });
  }
  if (wins.length <= 1) return;

  // Deterministic order
  wins.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const i = wins.findIndex(w => w.id === current.id);
  const nextIndex = (i + direction + wins.length) % wins.length;
  const target = wins[nextIndex];

  // Restore if minimized, then focus
  if (target.state === "minimized") {
    await chrome.windows.update(target.id, { state: "normal" });
  }
  await chrome.windows.update(target.id, { focused: true });
}

// Wire up lightweight message API
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || !msg.command) return;
  if (msg.command === "nextWindow") { focusAdjacentWindow(+1); return true; }
  if (msg.command === "previousWindow") { focusAdjacentWindow(-1); return true; }
});

export { focusAdjacentWindow };
