const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const SERVER_URL = `http://${HOST}:${PORT}`;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function checkServerReady(url, maxRetries = 60, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryConnect = () => {
      attempts++;
      const req = http.get(url, (res) => {
        if (res.statusCode) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on("error", () => {
        retry();
      });

      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (attempts >= maxRetries) {
        reject(new Error(`Server at ${url} did not respond in time.`));
      } else {
        setTimeout(tryConnect, intervalMs);
      }
    };

    tryConnect();
  });
}

const fs = require("node:fs");

function getNodeExecutable() {
  const possiblePaths = [
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Program Files (x86)\\nodejs\\node.exe",
    path.join(process.env.LOCALAPPDATA || "", "Programs", "node", "node.exe"),
    path.join(process.env.APPDATA || "", "npm", "node.exe"),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return "node";
}

function startNextServerIfNeeded() {
  return new Promise((resolve) => {
    // Check if server is already running
    const req = http.get(SERVER_URL, () => {
      // Server already running
      resolve();
    });

    req.on("error", () => {
      // Server not running, let's spawn next server directly
      const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
      const dotNextDir = path.join(__dirname, "..", ".next");
      const hasBuild = fs.existsSync(dotNextDir);
      const action = hasBuild && process.env.NODE_ENV !== "development" ? "start" : "dev";
      const nodeExec = getNodeExecutable();

      serverProcess = spawn(nodeExec, [nextBin, action, "-p", String(PORT)], {
        cwd: path.join(__dirname, ".."),
        env: {
          ...process.env,
          PORT: String(PORT),
          NODE_ENV: action === "start" ? "production" : "development",
        },
        shell: false,
        windowsHide: true,
        stdio: isDev ? "pipe" : "ignore",
      });

      serverProcess.on("error", (err) => {
        console.error("Failed to start Next.js process with direct node:", err);
      });

      resolve();
    });
  });
}

function createMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${SERVER_URL}/dashboard`);
            }
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom", accelerator: "CmdOrCtrl+0" },
        { role: "zoomIn", accelerator: "CmdOrCtrl+=" },
        { role: "zoomOut", accelerator: "CmdOrCtrl+-" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "Book Forge",
    icon: path.join(__dirname, process.platform === "win32" ? "icon.ico" : "icon.png"),
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  createMenu();

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control || input.meta) {
      if (input.key === "=" || input.key === "+" || input.code === "NumpadAdd") {
        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.min(Number((currentZoom + 0.1).toFixed(2)), 3.0));
      } else if (input.key === "-" || input.key === "_" || input.code === "NumpadSubtract") {
        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.max(Number((currentZoom - 0.1).toFixed(2)), 0.5));
      } else if (input.key === "0" || input.code === "Numpad0") {
        mainWindow.webContents.setZoomFactor(1.0);
      }
    }
  });

  // Intercept new window requests and open in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Check if it's local app navigation
      if (!url.startsWith(SERVER_URL)) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    }
    return { action: "allow" };
  });

  try {
    await startNextServerIfNeeded();
    await checkServerReady(SERVER_URL);
    await mainWindow.loadURL(SERVER_URL);
  } catch (error) {
    console.error("Failed to connect to Next.js server:", error);
    mainWindow.loadURL(
      `data:text/html,<html><body style="background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>Nie udało się połączyć z serwerem Book Forge</h2><p>${error.message}</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:6px;background:#6366f1;color:white;border:none;cursor:pointer;font-weight:bold;">Spróbuj ponownie</button></div></body></html>`
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function cleanup() {
  if (serverProcess) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    } catch {}
    serverProcess = null;
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  cleanup();
});
