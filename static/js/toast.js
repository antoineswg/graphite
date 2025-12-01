let toastIdCounter = 0;
let activeToasts = new Map();

function showToast(message, undoCallback, duration = 5000) {
  const toastId = toastIdCounter++;
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.id = `toast-${toastId}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-action" onclick="handleUndo(${toastId})">UNDO</button>
  `;

  container.appendChild(toast);

  const timeoutId = setTimeout(() => {
    hideToast(toastId);
  }, duration);

  activeToasts.set(toastId, {
    element: toast,
    timeoutId: timeoutId,
    undoCallback: undoCallback,
  });

  return toastId;
}

function handleUndo(toastId) {
  const toastData = activeToasts.get(toastId);
  if (toastData && toastData.undoCallback) {
    toastData.undoCallback();
    hideToast(toastId, true);
  }
}

function hideToast(toastId, immediate = false) {
  const toastData = activeToasts.get(toastId);
  if (!toastData) return;

  clearTimeout(toastData.timeoutId);

  if (immediate) {
    toastData.element.remove();
    activeToasts.delete(toastId);
  } else {
    toastData.element.classList.add("hiding");
    setTimeout(() => {
      toastData.element.remove();
      activeToasts.delete(toastId);
    }, 300);
  }
}
