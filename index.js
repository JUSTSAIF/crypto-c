const { default: axios } = require("axios");
const electron = require("electron");
const {
  remote,
  app,
  Menu,
  Tray,
  BrowserWindow,
  ipcMain,
  dialog,
} = require("electron");
const ICON = __dirname + "/assets/images/aka.ico";
let tray = null;
let MainWin = null;
let InfoWin = null;
let LoginWin = null;
const Store = require("electron-store");
const store = new Store();

// Uncomment this if you want to use Hot reload in development mode
// try {
//   require("electron-reloader")(module);
// } catch (_) {}

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
const gotTheLock = app.requestSingleInstanceLock();

function createMainWindow() {
  // Main Window
  MainWin = new BrowserWindow({
    show: false,
    frame: false,
    resizable: true,
    titleBarStyle: "customButtonsOnHover",
    title: "CRYPTO-C by  剣",
    roundedCorners: true,
    autoHideMenuBar: true,
    width: 250,
    maxWidth: 250,
    minWidth: 250,
    height: 450,
    minHeight: 450,
    maxHeight: 800,
    x: electron.screen.getPrimaryDisplay().bounds.width - 250,
    y: (electron.screen.getPrimaryDisplay().bounds.height - 450) / 2,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  MainWin.setAlwaysOnTop(true, "normal");
  MainWin.setIcon(ICON);
  MainWin.loadFile("html/index.html");
}

function createWindows() {
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
  InfoWin.loadFile("html/info.html");
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
  LoginWin.setIcon(__dirname + "/assets/images/login.png");
  LoginWin.loadFile("html/login.html");
}
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    MainWin.show();
  });

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
        app.exit();
        break;
    }
  });

  ipcMain.on("login", function (event, data) {
    setTimeout(() => {
      CheckLogin(data)
        .then((res) => {
          if (res) {
            LoginWin.webContents.send("login", "success");
            LoginWin.hide();
            createMainWindow();
            MainWin.show();
            RunApp();
            store.set("token", data);
          } else {
            LoginWin.webContents.send("login", "Invalid Token");
          }
        })
        .catch((err) => {
          LoginWin.webContents.send("login", "Trying after 3 second");
        });
    }, 2000);
  });
  app.whenReady().then(() => {
    // Create All Windows
    createWindows();
    setTimeout(() => {
      axios
        .get("https://www.google.com/")
        .then(() => {
          //  Check if Login
          CheckLogin(store.get("token")).then((res) => {
            if (res === false) {
              LoginWin.show();
            } else {
              createMainWindow();
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
              store.set("token", "");
              app.exit();
            });
        });
    }, 1000);
  });
}
const RunApp = () => {
  // === Run App ===
  MainWin.show();
  tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Exit", type: "normal", click: () => app.exit() },
    {
      label: "Logout and Exit",
      type: "normal",
      click: () => {
        store.set("token", "");
        app.exit();
      },
    },
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
