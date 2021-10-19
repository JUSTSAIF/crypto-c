const { default: axios } = require("axios");
const electron = require("electron");
const { app, Menu, Tray, BrowserWindow, ipcMain, dialog } = require("electron");
const ICON = "./assets/aka.ico";
let tray = null;
let win = null;
let InfoWin = null;
try {
  require("electron-reloader")(module);
} catch (_) {}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function createWindows() {
  // Main Window
  win = new BrowserWindow({
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    titleBarStyle: "customButtonsOnHover",
    title: "CRYPTO-C by  剣",
    roundedCorners: true,
    autoHideMenuBar: true,
    width: 250,
    height: 450,
    x: electron.screen.getPrimaryDisplay().bounds.width - 250,
    y: (electron.screen.getPrimaryDisplay().bounds.height - 450) / 2 ,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.setIcon(ICON);
  win.loadFile("index.html");
  // Info Win
  InfoWin = new BrowserWindow({
    show: false,
    frame: false,
    resizable: false,
    titleBarStyle: "customButtonsOnHover",
    title: "CRYPTO-C by  剣",
    roundedCorners: true,
    autoHideMenuBar: true,
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  InfoWin.setIcon(ICON);
  InfoWin.loadFile("info.html");
}

ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "hide") {
    win.hide();
  } else if (arg === "show-info") {
    InfoWin.show();
  } else if (arg === "close-info") {
    InfoWin.hide();
  }
});

app.whenReady().then(() => {
  axios
    .get("https://www.google.com/")
    .then(() => {
      tray = new Tray(ICON);
      const contextMenu = Menu.buildFromTemplate([
        { label: "Exit", type: "normal", role: "quit" },
      ]);
      tray.setToolTip("CRYPTO-C");
      tray.setContextMenu(contextMenu);
      createWindows();

      tray.addListener("double-click", function () {
        win.show();
      });
    })
    .then(() => {
      InfoWin.on("close", async (e) => {
        e.preventDefault();
      });
    })
    .catch(() => {
      return dialog
        .showMessageBox({
          title: "There's no internet",
          message: "No internet available",
          type: "warning",
          buttons: ["close"],
          defaultId: 0,
        })
        .then(() => {
          app.quit();
        });
    });
});
