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
      showNotification(`Error: ${data.message}`);
      select.value = activeConfigId;
    }
  } catch (error) {
    console.error("Failed to switch config:", error);
    showNotification("Error: Failed to switch config");
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
            <div class="config-info" onclick="switchToConfig('${config.id}')">
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
      showNotification(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Failed to switch config:", error);
    showNotification("Error: Failed to switch config");
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
    showNotification("Error: Failed to create config");
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
    showNotification("Error: Config name cannot be empty");
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
    showNotification("Error: Failed to rename config");
  }
}

async function deleteConfig(configId) {
  const config = configs.find((c) => c.id === configId);
  if (!config) return;

  const configBackup = JSON.parse(JSON.stringify(config));

  try {
    const response = await fetch(`/api/accounts/${configId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (data.success) {
      await loadConfigs();
      renderConfigsList();

      showToast(`Config deleted: ${config.name}`, async () => {
        try {
          const restoreResponse = await fetch("/api/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: configBackup.name,
              config: configBackup.config,
            }),
          });
          const restoreData = await restoreResponse.json();

          if (restoreData.success) {
            await loadConfigs();
            renderConfigsList();
          }
        } catch (error) {
          console.error("Failed to restore config:", error);
        }
      });
    } else {
      showNotification(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Failed to delete config:", error);
    showNotification("Error: Failed to delete config");
  }
}

function exportConfigAsJSON() {
  const config = configs.find((c) => c.id === activeConfigId);
  if (!config) {
    showNotification("Error: No active config to export");
    return;
  }

  const exportData = {
    name: config.name,
    config: config.config,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `graphite-config-${config.name
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification(`Config "${config.name}" exported successfully`);
}

async function importConfigFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Reset the input so the same file can be imported again if needed
  event.target.value = "";

  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate the imported data
    if (!importData.config || !importData.name) {
      showNotification("Error: Invalid config file format");
      return;
    }

    // Create a new config with the imported data
    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: importData.name + " (imported)",
        config: importData.config,
      }),
    });
    const data = await response.json();

    if (data.success) {
      await loadConfigs();
      renderConfigsList();
      showNotification(`Config "${importData.name}" imported successfully`);
    } else {
      showNotification(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Failed to import config:", error);
    showNotification("Error: Failed to import config file");
  }
}
