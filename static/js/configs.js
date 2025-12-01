let configs = [];
let activeConfigId = null;

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadConfigs() {
  try {
    const response = await fetch("/api/accounts");
    const data = await response.json();
    configs = data.accounts;
    activeConfigId = data.active_account_id;
    updateConfigSelect();
  } catch (error) {
    console.error("Failed to load configs:", error);
  }
}

function updateConfigSelect() {
  const select = document.getElementById("configSelect");
  select.innerHTML = "";

  configs.forEach((config) => {
    const option = document.createElement("option");
    option.value = config.id;
    option.textContent = config.name;
    option.selected = config.id === activeConfigId;
    select.appendChild(option);
  });
}

async function switchConfig() {
  const select = document.getElementById("configSelect");
  const configId = select.value;

  if (configId === activeConfigId) return;

  try {
    const response = await fetch(`/api/accounts/${configId}/activate`, {
      method: "POST",
    });
    const data = await response.json();

    if (data.success) {
      activeConfigId = configId;
      await loadConfig();
    } else {
      alert(data.message);
      select.value = activeConfigId;
    }
  } catch (error) {
    console.error("Failed to switch config:", error);
    alert("Failed to switch config");
    select.value = activeConfigId;
  }
}

function showConfigManager() {
  document.getElementById("configManagerModal").style.display = "block";
  renderConfigsList();
}

function closeConfigManager() {
  document.getElementById("configManagerModal").style.display = "none";
}

function renderConfigsList() {
  const container = document.getElementById("configsList");
  container.innerHTML = "";

  configs.forEach((config) => {
    const item = document.createElement("div");
    item.className =
      "config-item" + (config.id === activeConfigId ? " active" : "");
    item.id = `config-${config.id}`;

    const hasToken = config.config.token && config.config.token.length > 0;
    const tokenDisplay = hasToken
      ? `Token: ${config.config.token.substring(0, 20)}...`
      : "No token configured";
    const messageCount = config.config.messages.length;

    item.innerHTML = `
            <div class="config-info" onclick="switchToConfig('${
              config.id
            }')">
                <div class="config-name" id="name-${config.id}">${escapeHtml(
      config.name
    )}</div>
                <div class="config-details">${tokenDisplay} • ${messageCount} message(s)</div>
            </div>
            <div class="config-actions" id="actions-${config.id}">
                <button onclick="event.stopPropagation(); startRenameConfig('${
                  config.id
                }')">Rename</button>
                ${
                  configs.length > 1
                    ? `<button class="delete" onclick="event.stopPropagation(); deleteConfig('${config.id}')">Delete</button>`
                    : ""
                }
            </div>
        `;

    container.appendChild(item);
  });
}

async function switchToConfig(configId) {
  if (configId === activeConfigId) {
    closeConfigManager();
    return;
  }

  try {
    const response = await fetch(`/api/accounts/${configId}/activate`, {
      method: "POST",
    });
    const data = await response.json();

    if (data.success) {
      activeConfigId = configId;
      await loadConfig();
      updateConfigSelect();
      renderConfigsList();
      closeConfigManager();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Failed to switch config:", error);
    alert("Failed to switch config");
  }
}

async function addNewConfig() {
  const name = `Config ${configs.length + 1}`;

  try {
    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name }),
    });
    const data = await response.json();

    if (data.success) {
      const configId = data.account.id;
      await loadConfigs();

      // Switch to the new config
      const response2 = await fetch(`/api/accounts/${configId}/activate`, {
        method: "POST",
      });
      const data2 = await response2.json();

      if (data2.success) {
        activeConfigId = configId;
        await loadConfig();
        updateConfigSelect();
        renderConfigsList();
        // Start rename immediately so user can give it a custom name
        startRenameConfig(configId);
      }
    }
  } catch (error) {
    console.error("Failed to create config:", error);
    alert("Failed to create config");
  }
}

function startRenameConfig(configId) {
  const config = configs.find((c) => c.id === configId);
  if (!config) return;

  const nameElement = document.getElementById(`name-${configId}`);
  const actionsElement = document.getElementById(`actions-${configId}`);

  // Replace name with input
  nameElement.innerHTML = `<input type="text" class="config-name-input" id="input-${configId}" value="${escapeHtml(
    config.name
  )}" onclick="event.stopPropagation()">`;

  // Replace rename button with save button
  actionsElement.innerHTML = `
        <button onclick="event.stopPropagation(); saveRenameConfig('${configId}')">Save</button>
        ${
          configs.length > 1
            ? `<button class="delete" onclick="event.stopPropagation(); deleteConfig('${configId}')">Delete</button>`
            : ""
        }
    `;

  // Focus the input and select all text
  const input = document.getElementById(`input-${configId}`);
  input.focus();
  input.select();

  // Allow Enter to save, Escape to cancel
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRenameConfig(configId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      renderConfigsList();
    }
  });
}

async function saveRenameConfig(configId) {
  const input = document.getElementById(`input-${configId}`);
  const newName = input.value.trim();

  if (!newName) {
    alert("Config name cannot be empty");
    input.focus();
    return;
  }

  const config = configs.find((c) => c.id === configId);
  if (newName === config.name) {
    renderConfigsList();
    return;
  }

  try {
    const response = await fetch(`/api/accounts/${configId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await response.json();

    if (data.success) {
      await loadConfigs();
      renderConfigsList();
    }
  } catch (error) {
    console.error("Failed to rename config:", error);
    alert("Failed to rename config");
  }
}

async function deleteConfig(configId) {
  if (
    !confirm(
      "Are you sure you want to delete this config? This cannot be undone."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/accounts/${configId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      await loadConfigs();
      renderConfigsList();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Failed to delete config:", error);
    alert("Failed to delete config");
  }
}
