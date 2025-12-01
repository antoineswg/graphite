// Load configuration on page load
async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    document.getElementById("token").value = config.token || "";
    document.getElementById("channelId").value = config.channel_id || "";

    // Load messages array
    messages =
      config.messages && config.messages.length > 0 ? config.messages : [];

    document.getElementById("delayEnabled").checked =
      config.delay_enabled !== false;
    document.getElementById("minDelay").value = config.min_delay || "";
    document.getElementById("maxDelay").value = config.max_delay || "";
    document.getElementById("dryRun").checked = config.dry_run || false;

    // Mode-specific settings
    currentMode = config.mode || "spam";
    selectMode(currentMode);

    times = config.send_times || [];
    document.getElementById("spamInterval").value = config.spam_interval || 60;
    document.getElementById("windowStart").value =
      config.window_start || "09:00";
    document.getElementById("windowEnd").value = config.window_end || "17:00";
    document.getElementById("messagesCount").value =
      config.messages_count || 10;

    updateDelayVisibility();
    updateTimesDisplay();
    updateMessagesDisplay();
    updateStatus(config.bot_running);
  } catch (error) {
    console.error("Failed to load config:", error);
  }
}

async function saveConfig() {
  // Helper function to parse int or return empty string
  const parseIntOrEmpty = (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? "" : parsed;
  };

  const config = {
    token: document.getElementById("token").value,
    channel_id: document.getElementById("channelId").value,
    messages: messages,
    mode: currentMode,
    delay_enabled: document.getElementById("delayEnabled").checked,
    min_delay: parseIntOrEmpty(document.getElementById("minDelay").value),
    max_delay: parseIntOrEmpty(document.getElementById("maxDelay").value),
    dry_run: document.getElementById("dryRun").checked,
    send_times: times,
    spam_interval: parseIntOrEmpty(
      document.getElementById("spamInterval").value
    ),
    window_start: document.getElementById("windowStart").value,
    window_end: document.getElementById("windowEnd").value,
    messages_count: parseIntOrEmpty(
      document.getElementById("messagesCount").value
    ),
  };

  try {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    const result = await response.json();

    if (result.success) {
      // Reload configs to update the config info in the manager
      await loadConfigs();
      showSaveNotification();
    } else {
      showSaveError(result.message || "Failed to save configuration");
    }
  } catch (error) {
    console.error("Failed to save configuration:", error);
    showSaveError("Network error occurred");
  }
}

function showSaveNotification() {
  const consoleWindow = document.getElementById("consoleWindow");
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  const activeConfig = configs.find((c) => c.id === activeConfigId);
  const configName = activeConfig ? activeConfig.name : "current config";
  logEntry.textContent = `[${timestamp}] Configuration saved for ${configName}`;
  consoleWindow.appendChild(logEntry);
  consoleWindow.scrollTop = consoleWindow.scrollHeight;
}

function showSaveError(message) {
  const consoleWindow = document.getElementById("consoleWindow");
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry error";
  logEntry.textContent = `[${timestamp}] Save failed: ${message}`;
  consoleWindow.appendChild(logEntry);
  consoleWindow.scrollTop = consoleWindow.scrollHeight;
}

// Auto-save functionality with debouncing
let autoSaveTimeout = null;

function autoSaveConfig() {
  // Clear any existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Set a new timeout to save after 1 second of inactivity
  autoSaveTimeout = setTimeout(() => {
    saveConfig();
  }, 1000);
}

function setupAutoSave() {
  // Listen to all form inputs
  const inputFields = [
    "token",
    "channelId",
    "minDelay",
    "maxDelay",
    "spamInterval",
    "windowStart",
    "windowEnd",
    "messagesCount",
  ];

  inputFields.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", autoSaveConfig);
      element.addEventListener("change", autoSaveConfig);
    }
  });

  // Listen to checkboxes
  const checkboxFields = ["delayEnabled", "dryRun"];
  checkboxFields.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", autoSaveConfig);
    }
  });
}
