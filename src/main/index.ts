/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let jiggleInterval: NodeJS.Timeout | null = null
const JIGGLE_AMOUNT = 300
let lastMousePosition = { x: 0, y: 0 }
let lastMouseMoveTime = Date.now()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 400,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the local URL for development or the local file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function getMousePosition() {
  const point = screen.getCursorScreenPoint()
  return { x: point.x, y: point.y }
}

function moveMouse(x: number, y: number) {
  // Using the robotjs alternative approach
  const { exec } = require('child_process')
  if (process.platform === 'win32') {
    // For Windows
    exec(`powershell -command "$cursor = [System.Windows.Forms.Cursor]::Position; $cursor.X = ${x}; $cursor.Y = ${y}; [System.Windows.Forms.Cursor]::Position = $cursor"`)
  } else if (process.platform === 'darwin') {
    // For macOS
    exec(`osascript -e 'tell application "System Events" to set cursor position to {${x}, ${y}}'`)
  } else {
    // For Linux
    exec(`xdotool mousemove ${x} ${y}`)
  }
}

function checkMouseMovement() {
  const currentPosition = getMousePosition()
  if (currentPosition.x !== lastMousePosition.x || currentPosition.y !== lastMousePosition.y) {
    lastMousePosition = currentPosition
    lastMouseMoveTime = Date.now()
    return true // Mouse has moved
  }
  return false // Mouse hasn't moved
}

function startJiggling(interval: number): void {
  if (jiggleInterval) {
    clearInterval(jiggleInterval)
  }

  // Initialize last position
  lastMousePosition = getMousePosition()
  lastMouseMoveTime = Date.now()
  let moveRight = true

  jiggleInterval = setInterval(
    () => {
      // Only jiggle if mouse hasn't moved in the last interval
      const timeSinceLastMove = Date.now() - lastMouseMoveTime
      if (timeSinceLastMove >= interval * 1000) {
        if (!checkMouseMovement()) {
          // Double check mouse hasn't moved
          const mouse = getMousePosition()
          if (moveRight) {
            moveMouse(mouse.x + JIGGLE_AMOUNT, mouse.y)
          } else {
            moveMouse(mouse.x - JIGGLE_AMOUNT, mouse.y)
          }
          moveRight = !moveRight
        }
      }
    },
    Math.min(interval * 1000, 5000)
  ) // Check at least every 5 seconds
}

function stopJiggling(): void {
  if (jiggleInterval) {
    clearInterval(jiggleInterval)
    jiggleInterval = null
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Create the browser window.
  createWindow()

  // Set up IPC handlers
  ipcMain.on('start-jiggling', (_, interval: number) => {
    console.log('Received start-jiggling with interval:', interval)
    startJiggling(interval)
  })

  ipcMain.on('stop-jiggling', () => {
    console.log('Received stop-jiggling')
    stopJiggling()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopJiggling()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
