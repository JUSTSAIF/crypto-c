const { default: axios } = require("axios");
const electron = require("electron");
const { app, Menu, Tray, BrowserWindow, ipcMain, dialog } = require("electron");
const ICON = "./assets/aka.ico";
let tray = null;
let MainWin = null;
let InfoWin = null;
let LoginWin = null;
const Store = require("electron-store");
const store = new Store();

try {
  require("electron-reloader")(module);
} catch (_) {}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function createWindows() {
  // Main Window
  MainWin = new BrowserWindow({
    show: false,
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
    y: (electron.screen.getPrimaryDisplay().bounds.height - 450) / 2,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  MainWin.setIcon(ICON);
  MainWin.loadFile("layout/index.html");
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
  InfoWin.loadFile("layout/info.html");
  // Login Win
  LoginWin = new BrowserWindow({
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
  LoginWin.setIcon("assets/login.png");
  LoginWin.loadFile("layout/login.html");
}

ipcMain.on("asynchronous-message", (event, arg) => {
  switch (arg) {
    case "hide":
      MainWin.hide();
      break;
    case "show-info":
      InfoWin.show();
      break;
    case "close-info":
      InfoWin.hide();
      break;
    case "close-app":
      app.quit();
      break;
  }
});

ipcMain.on("login", function (event, data) {
  CheckLogin(data)
    .then((res) => {
      if (res) {
        LoginWin.webContents.send("login", "success");
        setTimeout(() => {
          LoginWin.hide();
          MainWin.show();
          RunApp();
          store.set("token", data);
        }, 2000);
      } else {
        LoginWin.webContents.send("login", "Invalid Token");
      }
    })
    .catch((err) => app.quit());
});

app.whenReady().then(() => {
  // store.set("token", "");
  // Create All Windows
  createWindows();
  axios
    .get("https://www.google.com/")
    .then(() => {
      //  Check if Login
      CheckLogin(store.get("token")).then((res) => {
        // console.log(res);
        if (res === false) {
          LoginWin.show();
        } else {
          RunApp();
        }
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

const RunApp = () => {
  // === Run App ===
  MainWin.show();
  tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Exit", type: "normal", role: "quit" },
  ]);
  // Set tray icon
  tray.setToolTip("CRYPTO-C");
  tray.setContextMenu(contextMenu);
  tray.addListener("double-click", function () {
    MainWin.show();
  });
};

const CheckLogin = (token, checkErr = false) => {
  return axios
    .get(
      `https://api.nomics.com/v1/currencies/ticker?key=${token}&ids=BTC&interval=1d,30d&convert=USD&per-page=100&page=1`
    )
    .then((res) => {
      return true;
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.status === 401) {
          return false;
        }
        if (checkErr) {
          if (error.response.status === 429) {
            return 429;
          }
        }
      }
      return false;
    });
};
