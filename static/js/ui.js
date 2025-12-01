function updateTimesDisplay() {
  const container = document.getElementById("timesContainer");
  container.innerHTML = "";

  times.forEach((time, index) => {
    const chip = document.createElement("div");
    chip.className = "time-chip";
    chip.innerHTML = `
            <span>${time}</span>
            <button onclick="removeTime(${index})">×</button>
        `;
    container.appendChild(chip);
  });
}

function addTime() {
  const input = document.getElementById("newTime");
  const time = input.value;

  if (time && !times.includes(time)) {
    times.push(time);
    times.sort();
    updateTimesDisplay();
    input.value = "";
    autoSaveConfig();
  }
}

function removeTime(index) {
  const removedTime = times[index];
  times.splice(index, 1);
  updateTimesDisplay();
  autoSaveConfig();

  showToast(`Time removed: ${removedTime}`, () => {
    times.splice(index, 0, removedTime);
    times.sort();
    updateTimesDisplay();
    autoSaveConfig();
  });
}

function updateMessagesDisplay() {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = "";

  messages.forEach((message, index) => {
    const chip = document.createElement("div");
    chip.className = "time-chip";
    // Replace newlines with space for display, show ↵ symbol to indicate line breaks
    const displayText = message.replace(/\n/g, " ↵ ");
    const truncatedDisplay =
      displayText.length > 50
        ? displayText.substring(0, 50) + "..."
        : displayText;
    // Escape for HTML attributes and display
    const escapedMessage = message
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "&#10;");
    const escapedDisplay = truncatedDisplay
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    chip.innerHTML = `
            <span title="${escapedMessage}">${escapedDisplay}</span>
            <button onclick="removeMessage(${index})">×</button>
        `;
    container.appendChild(chip);
  });
}

function addMessage() {
  const input = document.getElementById("newMessage");
  const message = input.value;

  // Only trim leading/trailing whitespace, keep internal newlines
  const trimmedMessage = message.trim();

  if (trimmedMessage && !messages.includes(trimmedMessage)) {
    messages.push(trimmedMessage);
    updateMessagesDisplay();
    input.value = "";
    autoSaveConfig();
  }
}

function removeMessage(index) {
  const removedMessage = messages[index];
  messages.splice(index, 1);
  updateMessagesDisplay();
  autoSaveConfig();

  const displayText =
    removedMessage.length > 30
      ? removedMessage.substring(0, 30) + "..."
      : removedMessage;

  showToast(`Message removed: "${displayText}"`, () => {
    messages.splice(index, 0, removedMessage);
    updateMessagesDisplay();
    autoSaveConfig();
  });
}

function selectMode(mode) {
  const previousMode = currentMode;
  currentMode = mode;

  // Update button states
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update config panels
  document.querySelectorAll(".mode-config").forEach((panel) => {
    panel.classList.remove("active");
  });
  document.getElementById("config-" + mode).classList.add("active");

  // Auto-save only if mode actually changed (not initial load)
  if (previousMode !== mode && previousMode !== undefined) {
    autoSaveConfig();
  }
}

function updateDelayVisibility() {
  const delayEnabled = document.getElementById("delayEnabled").checked;
  const delaySettings = document.getElementById("delaySettings");
  delaySettings.style.opacity = delayEnabled ? "1" : "0.5";
  document.getElementById("minDelay").disabled = !delayEnabled;
  document.getElementById("maxDelay").disabled = !delayEnabled;
}
