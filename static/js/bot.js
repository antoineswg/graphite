async function startBot() {
  await saveConfig();

  try {
    const response = await fetch("/api/start", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      updateStatus(true);
    } else {
      console.error("Error:", result.message);
    }
  } catch (error) {
    console.error("Failed to start bot:", error);
  }
}

async function stopBot() {
  try {
    const response = await fetch("/api/stop", { method: "POST" });
    const result = await response.json();

    updateStatus(false);
  } catch (error) {
    console.error("Failed to stop bot:", error);
  }
}

function updateStatus(running) {
  const statusDiv = document.getElementById("status");
  const statusText = document.getElementById("statusText");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (running) {
    statusDiv.className = "status running";
    statusText.textContent = "ONLINE";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusDiv.className = "status stopped";
    statusText.textContent = "OFFLINE";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

async function updateConsole() {
  try {
    const response = await fetch("/api/logs");
    const data = await response.json();
    const consoleWindow = document.getElementById("consoleWindow");

    if (data.logs && data.logs.length > 0) {
      consoleWindow.innerHTML = data.logs
        .map((log) => `<div class="log-entry">${escapeHtml(log)}</div>`)
        .join("");
      // Auto-scroll to bottom
      consoleWindow.scrollTop = consoleWindow.scrollHeight;
    }
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateTimestamp() {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("timestamp").textContent = timestamp;
}
