"use strict";
const electron = require("electron");
const path = require("path");
const robotjs = require("robotjs");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const icon = path.join(__dirname, "../../resources/icon.png");
let tray = null;
let jiggleInterval = null;
const JIGGLE_AMOUNT = 1;
let currentInterval = 60;
let isJiggling = false;
let lastMousePosition = { x: 0, y: 0 };
let lastMouseMoveTime = Date.now();
function createTray() {
  const trayIcon = electron.nativeImage.createFromPath(icon);
  tray = new electron.Tray(trayIcon.resize({ width: 16, height: 16 }));
  updateTrayMenu();
}
function checkMouseMovement() {
  const currentPosition = robotjs.getMousePos();
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
  lastMousePosition = robotjs.getMousePos();
  lastMouseMoveTime = Date.now();
  let moveRight = true;
  jiggleInterval = setInterval(
    () => {
      const timeSinceLastMove = Date.now() - lastMouseMoveTime;
      if (timeSinceLastMove >= interval * 1e3) {
        if (!checkMouseMovement()) {
          const mouse = robotjs.getMousePos();
          if (moveRight) {
            robotjs.moveMouse(mouse.x + JIGGLE_AMOUNT, mouse.y);
          } else {
            robotjs.moveMouse(mouse.x - JIGGLE_AMOUNT, mouse.y);
          }
          moveRight = !moveRight;
        }
      } else {
        checkMouseMovement();
      }
    },
    Math.min(interval * 1e3, 5e3)
  );
  isJiggling = true;
  updateTrayMenu();
}
function stopJiggling() {
  if (jiggleInterval) {
    clearInterval(jiggleInterval);
    jiggleInterval = null;
  }
  isJiggling = false;
  updateTrayMenu();
}
function updateTrayMenu() {
  if (!tray) return;
  const intervalOptions = [30, 60, 120, 300].map((seconds) => ({
    label: `${seconds} seconds`,
    type: "radio",
    checked: currentInterval === seconds,
    click: () => {
      currentInterval = seconds;
      if (isJiggling) {
        startJiggling(currentInterval);
      }
    }
  }));
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: isJiggling ? "Stop Jiggling" : "Start Jiggling",
      click: () => {
        if (isJiggling) {
          stopJiggling();
        } else {
          startJiggling(currentInterval);
        }
      }
    },
    { type: "separator" },
    {
      label: "Interval",
      submenu: intervalOptions
    },
    { type: "separator" },
    { label: "Quit", click: () => electron.app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(`Mouse Jiggler - ${isJiggling ? "Active" : "Inactive"}`);
}
electron.app.whenReady().then(() => {
  if (process.platform === "darwin") {
    electron.app.dock.hide();
  }
  electronApp.setAppUserModelId("com.electron");
  createTray();
});
electron.app.on("before-quit", () => {
  stopJiggling();
});
