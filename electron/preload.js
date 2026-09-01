const { contextBridge, webFrame } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});

// Setup zooming support: Ctrl + mouse wheel & Ctrl + / - / 0
window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const currentZoom = webFrame.getZoomFactor();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const newZoom = Math.min(Math.max(currentZoom + delta, 0.5), 3.0);
      webFrame.setZoomFactor(Number(newZoom.toFixed(2)));
    }
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") {
      e.preventDefault();
      const currentZoom = webFrame.getZoomFactor();
      webFrame.setZoomFactor(Math.min(Number((currentZoom + 0.1).toFixed(2)), 3.0));
    } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
      e.preventDefault();
      const currentZoom = webFrame.getZoomFactor();
      webFrame.setZoomFactor(Math.max(Number((currentZoom - 0.1).toFixed(2)), 0.5));
    } else if (e.key === "0" || e.code === "Numpad0") {
      e.preventDefault();
      webFrame.setZoomFactor(1.0);
    }
  }
});
