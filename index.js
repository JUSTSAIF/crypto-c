const { default: axios } = require("axios");
const electron = require("electron");
const { app, Menu, Tray, BrowserWindow, ipcMain, dialog } = require("electron");
const ICON = "./assets/aka.ico";
let tray = null;
let win = null;
try {
  require("electron-reloader")(module);
} catch (_) {}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    titleBarStyle: "customButtonsOnHover",
    title: "CRYPTO-C by  剣",
    roundedCorners: true,
    autoHideMenuBar: true,
    width: 400,
    height: 600,
    x: electron.screen.getPrimaryDisplay().bounds.width - 430,
    y: 430,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.setIcon(ICON);
  win.loadFile("index.html");
}

ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "hide") {
    win.hide();
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
      createWindow();
      tray.addListener("double-click", function () {
        win.show();
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
