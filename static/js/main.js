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

// Token Help Modal Functions
function showTokenHelp() {
  document.getElementById("tokenHelpModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeTokenHelp() {
  document.getElementById("tokenHelpModal").style.display = "none";
  document.body.style.overflow = "auto";
}

// Close modal when clicking outside of it
window.addEventListener("click", function (event) {
  const modal = document.getElementById("tokenHelpModal");
  if (event.target === modal) {
    closeTokenHelp();
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  const isInputFocused =
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA";

  if (event.key === "Escape") {
    closeTokenHelp();
    closeChannelHelp();
  }

  if (event.code === "Space" && !isInputFocused) {
    event.preventDefault();
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    if (!startBtn.disabled) {
      startBot();
    } else if (!stopBtn.disabled) {
      stopBot();
    }
  }
});

// Channel ID Help Modal Functions
function showChannelHelp() {
  document.getElementById("channelHelpModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeChannelHelp() {
  document.getElementById("channelHelpModal").style.display = "none";
  document.body.style.overflow = "auto";
}

// Close channel modal when clicking outside of it
window.addEventListener("click", function (event) {
  const channelModal = document.getElementById("channelHelpModal");
  if (event.target === channelModal) {
    closeChannelHelp();
  }
});
