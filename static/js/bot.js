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
        .map((log) => {
          const isError = /Error|Failed|error|failed/i.test(log);
          const className = isError ? "log-entry error" : "log-entry";
          return `<div class="${className}">${escapeHtml(log)}</div>`;
        })
        .join("");
      consoleWindow.scrollTop = consoleWindow.scrollHeight;

      // Save logs to localStorage
      saveLogsToStorage(data.logs);

      // Update log buttons state
      updateLogButtonsState();
    }
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
}

function saveLogsToStorage(logs) {
  try {
    localStorage.setItem("graphite_logs", JSON.stringify(logs));
    localStorage.setItem("graphite_logs_timestamp", new Date().toISOString());
  } catch (error) {
    console.error("Failed to save logs to localStorage:", error);
  }
}

function loadLogsFromStorage() {
  try {
    const savedLogs = localStorage.getItem("graphite_logs");
    if (savedLogs) {
      const logs = JSON.parse(savedLogs);
      const consoleWindow = document.getElementById("consoleWindow");
      consoleWindow.innerHTML = logs
        .map((log) => {
          const isError = /Error|Failed|error|failed/i.test(log);
          const className = isError ? "log-entry error" : "log-entry";
          return `<div class="${className}">${escapeHtml(log)}</div>`;
        })
        .join("");
      consoleWindow.scrollTop = consoleWindow.scrollHeight;
    }
    updateLogButtonsState();
  } catch (error) {
    console.error("Failed to load logs from localStorage:", error);
  }
}

function exportLogsToFile() {
  try {
    const savedLogs = localStorage.getItem("graphite_logs");
    if (!savedLogs) {
      return;
    }

    const logs = JSON.parse(savedLogs);
    const logsText = logs.join("\n");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `graphite-logs-${timestamp}.txt`;

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("Logs exported successfully");
  } catch (error) {
    console.error("Failed to export logs:", error);
    showNotification("Error: Failed to export logs");
  }
}

async function copyLogsToClipboard() {
  try {
    const savedLogs = localStorage.getItem("graphite_logs");
    if (!savedLogs) {
      return;
    }

    const logs = JSON.parse(savedLogs);
    const logsText = logs.join("\n");

    await navigator.clipboard.writeText(logsText);
    showNotification("Logs copied to clipboard");
  } catch (error) {
    console.error("Failed to copy logs:", error);
    showNotification("Error: Failed to copy logs to clipboard");
  }
}

function updateLogButtonsState() {
  const savedLogs = localStorage.getItem("graphite_logs");
  const hasLogs = savedLogs && JSON.parse(savedLogs).length > 1;

  const copyBtn = document.getElementById("copyLogsBtn");
  const exportBtn = document.getElementById("exportLogsBtn");

  if (copyBtn) copyBtn.disabled = !hasLogs;
  if (exportBtn) exportBtn.disabled = !hasLogs;
}

function showNotification(message) {
  const consoleWindow = document.getElementById("consoleWindow");
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.textContent = `[${timestamp}] ${message}`;
  consoleWindow.appendChild(logEntry);
  consoleWindow.scrollTop = consoleWindow.scrollHeight;
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
