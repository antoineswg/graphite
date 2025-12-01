let messageStatsChart = null;

function initMessageStatsChart() {
  const ctx = document.getElementById("messageStatsChart");
  if (!ctx) return;

  const isDark =
    document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#fcfcfc" : "#080807";
  const gridColor = isDark
    ? "rgba(112, 109, 106, 0.2)"
    : "rgba(112, 109, 106, 0.3)";
  const barColor = isDark ? "#fcfcfc" : "#080807";

  if (messageStatsChart) {
    messageStatsChart.destroy();
  }

  messageStatsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Messages Sent",
          data: [],
          backgroundColor: isDark ? "rgba(252, 252, 252)" : "rgba(8, 8, 7)",
          borderColor: barColor,
          borderWidth: 2,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark ? "#0a0a0a" : "#fcfcfc",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function (context) {
              const label = context[0].label;
              return label.length > 50 ? label.substring(0, 50) + "..." : label;
            },
            label: function (context) {
              return `Count: ${context.parsed.x}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
            },
            stepSize: 1,
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
          title: {
            display: true,
            text: "Number of times sent",
            color: textColor,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
              weight: "normal",
            },
          },
        },
        y: {
          ticks: {
            color: textColor,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
            callback: function (value, index, ticks) {
              const label = this.getLabelForValue(value);
              return label.length > 30 ? label.substring(0, 30) + "..." : label;
            },
          },
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
  });
}

async function loadMessageStats() {
  try {
    const response = await fetch("/api/message-stats");
    const data = await response.json();

    if (data.stats && Object.keys(data.stats).length > 0) {
      updateMessageStatsChart(data.stats);
      showStatsPanel();
    } else {
      hideStatsPanel();
    }
  } catch (error) {
    console.error("Failed to load message stats:", error);
  }
}

function updateMessageStatsChart(stats) {
  if (!messageStatsChart) {
    initMessageStatsChart();
  }

  const sortedEntries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(([msg]) => msg);
  const data = sortedEntries.map(([, count]) => count);

  messageStatsChart.data.labels = labels;
  messageStatsChart.data.datasets[0].data = data;
  messageStatsChart.update();
}

function showStatsPanel() {
  const panel = document.getElementById("statsPanel");
  if (panel) {
    panel.style.display = "block";
  }
}

function hideStatsPanel() {
  const panel = document.getElementById("statsPanel");
  if (panel) {
    panel.style.display = "none";
  }
}

async function resetMessageStats() {
  try {
    await fetch("/api/message-stats", { method: "DELETE" });
    hideStatsPanel();
    if (messageStatsChart) {
      messageStatsChart.data.labels = [];
      messageStatsChart.data.datasets[0].data = [];
      messageStatsChart.update();
    }
  } catch (error) {
    console.error("Failed to reset message stats:", error);
  }
}

// Update stats when theme changes
function updateChartTheme() {
  if (messageStatsChart) {
    const panel = document.getElementById("statsPanel");
    if (panel && panel.style.display !== "none") {
      const currentData = {
        labels: messageStatsChart.data.labels,
        data: messageStatsChart.data.datasets[0].data,
      };
      initMessageStatsChart();
      if (currentData.labels.length > 0) {
        messageStatsChart.data.labels = currentData.labels;
        messageStatsChart.data.datasets[0].data = currentData.data;
        messageStatsChart.update();
      }
    }
  }
}

// Export function so it can be called from main.js
window.updateChartTheme = updateChartTheme;
