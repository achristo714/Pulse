const { app, BrowserWindow, Tray, Menu, globalShortcut, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Dock mode settings
let isDockMode = false;
const DOCK_WIDTH = 380;
const DOCK_HEIGHT = 600;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 500,
    frame: true,
    titleBarStyle: 'hiddenInset', // macOS native look
    backgroundColor: '#0F0F0F',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  // Load the Vercel deployment or local dev
  const url = process.env.PULSE_URL || 'https://pulse-ten-topaz.vercel.app';
  mainWindow.loadURL(url);

  // Hide instead of close (minimize to tray)
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Use a simple icon (you'd replace with a proper .png)
  tray = new Tray(path.join(__dirname, 'tray-icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Pulse',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: isDockMode ? 'Exit Dock Mode' : 'Dock Mode (Always on Top)',
      click: () => toggleDockMode(),
    },
    { type: 'separator' },
    {
      label: 'Quick Add Task',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // Send message to renderer to open quick add
          mainWindow.webContents.executeJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "n"}))');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Pulse',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Pulse');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function toggleDockMode() {
  if (!mainWindow) return;
  isDockMode = !isDockMode;

  if (isDockMode) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setSize(DOCK_WIDTH, DOCK_HEIGHT);
    mainWindow.setPosition(screenWidth - DOCK_WIDTH - 16, screenHeight - DOCK_HEIGHT - 16);
    mainWindow.setResizable(false);
    mainWindow.setSkipTaskbar(true);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSize(1200, 800);
    mainWindow.center();
    mainWindow.setResizable(true);
    mainWindow.setSkipTaskbar(false);
  }

  // Rebuild tray menu to reflect state
  createTray();
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Global shortcut to toggle Pulse
  globalShortcut.register('CmdOrCtrl+Shift+P', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Global shortcut to toggle dock mode
  globalShortcut.register('CmdOrCtrl+Shift+D', () => {
    toggleDockMode();
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});
