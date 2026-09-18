const { contextBridge, webFrame } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});

/*
 * Only Ctrl + mouse wheel lives here. The keyboard shortcuts (Ctrl +/-/0) are
 * handled once in the main process via `before-input-event` — having them here
 * as well made every key press apply two zoom steps.
 */
window.addEventListener(
  "wheel",
  (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const currentZoom = webFrame.getZoomFactor();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newZoom = Math.min(Math.max(currentZoom + delta, 0.5), 3.0);
    webFrame.setZoomFactor(Number(newZoom.toFixed(2)));
  },
  { passive: false }
);
