// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  root.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
  // Initialize theme
  initTheme();

  // Set up delay checkbox listener
  document
    .getElementById("delayEnabled")
    .addEventListener("change", updateDelayVisibility);

  // Update timestamp immediately and every second
  updateTimestamp();
  setInterval(updateTimestamp, 1000);

  // Load configs and initial configuration
  loadConfigs().then(() => {
    loadConfig();
  });

  // Set up auto-save listeners
  setupAutoSave();
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

// Shortcuts Help Modal Functions
function showShortcutsHelp() {
  document.getElementById("shortcutsHelpModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeShortcutsHelp() {
  document.getElementById("shortcutsHelpModal").style.display = "none";
  document.body.style.overflow = "auto";
}

function clearConsole() {
  const consoleWindow = document.getElementById("consoleWindow");
  consoleWindow.innerHTML = '<div class="log-entry">Console cleared.</div>';
}

const modes = ["spam", "scheduled", "random_window"];
let currentModeIndex = 0;

function cycleModes() {
  currentModeIndex = (currentModeIndex + 1) % modes.length;
  selectMode(modes[currentModeIndex]);
}

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  const isInputFocused =
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA";
  const isMessageTextarea = document.activeElement.id === "newMessage";
  const isTimeInput = document.activeElement.id === "newTime";

  if (event.key === "Escape") {
    closeTokenHelp();
    closeChannelHelp();
    closeShortcutsHelp();
    closeConfigManager();
    return;
  }

  if (event.key === "Enter" && isTimeInput) {
    event.preventDefault();
    addTime();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    document.getElementById("token").focus();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "l") {
    event.preventDefault();
    document.getElementById("channelId").focus();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "m") {
    event.preventDefault();
    document.getElementById("newMessage").focus();
    return;
  }

  if (
    (event.ctrlKey || event.metaKey) &&
    event.key === "Enter" &&
    isMessageTextarea
  ) {
    event.preventDefault();
    addMessage();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "d") {
    event.preventDefault();
    const dryRunCheckbox = document.getElementById("dryRun");
    dryRunCheckbox.checked = !dryRunCheckbox.checked;
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    event.preventDefault();
    clearConsole();
    return;
  }

  if (!isInputFocused) {
    if (event.key === "1") {
      event.preventDefault();
      selectMode("spam");
      return;
    }

    if (event.key === "2") {
      event.preventDefault();
      selectMode("scheduled");
      return;
    }

    if (event.key === "3") {
      event.preventDefault();
      selectMode("random_window");
      return;
    }

    if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      cycleModes();
      return;
    }

    if (event.key.toLowerCase() === "d") {
      event.preventDefault();
      const delayCheckbox = document.getElementById("delayEnabled");
      delayCheckbox.checked = !delayCheckbox.checked;
      updateDelayVisibility();
      return;
    }

    if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      const dryRunCheckbox = document.getElementById("dryRun");
      dryRunCheckbox.checked = !dryRunCheckbox.checked;
      return;
    }

    if (event.key.toLowerCase() === "t") {
      event.preventDefault();
      toggleTheme();
      return;
    }

    if (event.key.toLowerCase() === "h" || event.key === "?") {
      event.preventDefault();
      showShortcutsHelp();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const consoleWindow = document.getElementById("consoleWindow");
      consoleWindow.scrollTop -= 40;
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const consoleWindow = document.getElementById("consoleWindow");
      consoleWindow.scrollTop += 40;
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      const startBtn = document.getElementById("startBtn");
      const stopBtn = document.getElementById("stopBtn");

      if (!startBtn.disabled) {
        startBot();
      } else if (!stopBtn.disabled) {
        stopBot();
      }
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
