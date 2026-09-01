const { execSync } = require("node:child_process");
const path = require("node:path");

function createShortcut() {
  if (process.platform === "win32") {
    const psScript = path.join(__dirname, "create-desktop-shortcut.ps1");
    try {
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScript}"`, {
        stdio: "inherit",
      });
    } catch (err) {
      console.error("Failed to create desktop shortcut:", err.message);
    }
  } else {
    console.log("Desktop shortcut creation is currently configured for Windows.");
  }
}

createShortcut();
