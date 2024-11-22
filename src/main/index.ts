/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { app, Tray, Menu, nativeImage } from 'electron'
import { electronApp } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import robotjs from 'robotjs'

let tray: Tray | null = null
let jiggleInterval: NodeJS.Timeout | null = null
const JIGGLE_AMOUNT = 1
let currentInterval = 60 // default interval in seconds
let isJiggling = false
let lastMousePosition = { x: 0, y: 0 }
let lastMouseMoveTime = Date.now()

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  updateTrayMenu()
}

function checkMouseMovement() {
  const currentPosition = robotjs.getMousePos()
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
  lastMousePosition = robotjs.getMousePos()
  lastMouseMoveTime = Date.now()
  let moveRight = true

  jiggleInterval = setInterval(
    () => {
      // Only jiggle if mouse hasn't moved in the last interval
      const timeSinceLastMove = Date.now() - lastMouseMoveTime
      if (timeSinceLastMove >= interval * 1000) {
        if (!checkMouseMovement()) {
          // Double check mouse hasn't moved
          const mouse = robotjs.getMousePos()
          if (moveRight) {
            robotjs.moveMouse(mouse.x + JIGGLE_AMOUNT, mouse.y)
          } else {
            robotjs.moveMouse(mouse.x - JIGGLE_AMOUNT, mouse.y)
          }
          moveRight = !moveRight
        }
      } else {
        checkMouseMovement() // Update last position
      }
    },
    Math.min(interval * 1000, 5000)
  ) // Check at least every 5 seconds

  isJiggling = true
  updateTrayMenu()
}

function stopJiggling(): void {
  if (jiggleInterval) {
    clearInterval(jiggleInterval)
    jiggleInterval = null
  }
  isJiggling = false
  updateTrayMenu()
}

function updateTrayMenu(): void {
  if (!tray) return

  const intervalOptions = [30, 60, 120, 300].map((seconds) => ({
    label: `${seconds} seconds`,
    type: 'radio' as const,
    checked: currentInterval === seconds,
    click: () => {
      currentInterval = seconds
      if (isJiggling) {
        startJiggling(currentInterval)
      }
    }
  }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isJiggling ? 'Stop Jiggling' : 'Start Jiggling',
      click: () => {
        if (isJiggling) {
          stopJiggling()
        } else {
          startJiggling(currentInterval)
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Interval',
      submenu: intervalOptions
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip(`Mouse Jiggler - ${isJiggling ? 'Active' : 'Inactive'}`)
}

app.whenReady().then(() => {
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  electronApp.setAppUserModelId('com.electron')
  createTray()
})

app.on('before-quit', () => {
  stopJiggling()
})
