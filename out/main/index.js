"use strict";
const electron = require("electron");
const path = require("path");
const icon = path.join(__dirname, "../../resources/icon.png");
let mainWindow = null;
let jiggleInterval = null;
const JIGGLE_AMOUNT = 300;
let lastMousePosition = { x: 0, y: 0 };
let lastMouseMoveTime = Date.now();
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 300,
    height: 400,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  if (!electron.app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function getMousePosition() {
  const point = electron.screen.getCursorScreenPoint();
  return { x: point.x, y: point.y };
}
function moveMouse(x, y) {
  const { exec } = require("child_process");
  if (process.platform === "win32") {
    exec(`powershell -command "$cursor = [System.Windows.Forms.Cursor]::Position; $cursor.X = ${x}; $cursor.Y = ${y}; [System.Windows.Forms.Cursor]::Position = $cursor"`);
  } else if (process.platform === "darwin") {
    exec(`osascript -e 'tell application "System Events" to set cursor position to {${x}, ${y}}'`);
  } else {
    exec(`xdotool mousemove ${x} ${y}`);
  }
}
function checkMouseMovement() {
  const currentPosition = getMousePosition();
  if (currentPosition.x !== lastMousePosition.x || currentPosition.y !== lastMousePosition.y) {
    lastMousePosition = currentPosition;
    lastMouseMoveTime = Date.now();
    return true;
  }
  return false;
}
function startJiggling(interval) {
  if (jiggleInterval) {
    clearInterval(jiggleInterval);
  }
  lastMousePosition = getMousePosition();
  lastMouseMoveTime = Date.now();
  let moveRight = true;
  jiggleInterval = setInterval(
    () => {
      const timeSinceLastMove = Date.now() - lastMouseMoveTime;
      if (timeSinceLastMove >= interval * 1e3) {
        if (!checkMouseMovement()) {
          const mouse = getMousePosition();
          if (moveRight) {
            moveMouse(mouse.x + JIGGLE_AMOUNT, mouse.y);
          } else {
            moveMouse(mouse.x - JIGGLE_AMOUNT, mouse.y);
          }
          moveRight = !moveRight;
        }
      }
    },
    Math.min(interval * 1e3, 5e3)
  );
}
function stopJiggling() {
  if (jiggleInterval) {
    clearInterval(jiggleInterval);
    jiggleInterval = null;
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.ipcMain.on("start-jiggling", (_, interval) => {
    console.log("Received start-jiggling with interval:", interval);
    startJiggling(interval);
  });
  electron.ipcMain.on("stop-jiggling", () => {
    console.log("Received stop-jiggling");
    stopJiggling();
  });
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  stopJiggling();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
