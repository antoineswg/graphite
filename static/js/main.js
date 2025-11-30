// Initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
  // Set up delay checkbox listener
  document
    .getElementById("delayEnabled")
    .addEventListener("change", updateDelayVisibility);

  // Update timestamp immediately and every second
  updateTimestamp();
  setInterval(updateTimestamp, 1000);

  // Load initial configuration
  loadConfig();
});

// Poll status and logs every 2 seconds
setInterval(async () => {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    updateStatus(config.bot_running);
  } catch (error) {
    console.error("Failed to check status:", error);
  }

  // Update console logs
  updateConsole();
}, 2000);
