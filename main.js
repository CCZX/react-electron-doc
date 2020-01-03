const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')

let mainWindow

app.on('ready', () => {
  require('devtron').install()
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 680,
    webPreferences: {
      nodeIntegration: true
    }
  })
  const URLLocation = isDev ? 'http://localhost:3000' : 'dummyURL'
  mainWindow.loadURL(URLLocation)
  mainWindow.webContents.openDevTools()
})
