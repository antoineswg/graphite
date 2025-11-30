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
    // Configuration saved, no alert needed
  } catch (error) {
    console.error("Failed to save configuration:", error);
  }
}
